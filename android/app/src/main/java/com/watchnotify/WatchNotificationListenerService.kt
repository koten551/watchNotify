package com.watchnotify

import android.app.Notification
import android.content.ComponentName
import android.content.Intent
import android.os.Build
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.text.TextUtils
import android.util.Log
import com.facebook.react.HeadlessJsTaskService
import org.json.JSONObject

class WatchNotificationListenerService : NotificationListenerService() {
  override fun onCreate() {
    super.onCreate()
    Log.d(TAG, "service created")
  }

  override fun onListenerConnected() {
    super.onListenerConnected()
    Log.d(TAG, "listener connected")
  }

  override fun onListenerDisconnected() {
    super.onListenerDisconnected()
    Log.w(TAG, "listener disconnected")
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      requestRebind(ComponentName(this, WatchNotificationListenerService::class.java))
    }
  }

  override fun onDestroy() {
    Log.d(TAG, "service destroyed")
    super.onDestroy()
  }

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    Log.d(TAG, "notification posted from ${sbn.packageName}")

    val notification = sbn.notification
    val extras = notification?.extras

    if (extras == null) {
      Log.d(TAG, "ignored notification without extras: ${sbn.packageName}")
      return
    }

    val payload =
        JSONObject()
            .put("app", sbn.packageName.ifBlank { "Unknown App" })
            .put("title", extras.getCharSequence(Notification.EXTRA_TITLE).safeString())
            .put("titleBig", extras.getCharSequence(Notification.EXTRA_TITLE_BIG).safeString())
            .put("text", extras.getCharSequence(Notification.EXTRA_TEXT).safeString())
            .put("subText", extras.getCharSequence(Notification.EXTRA_SUB_TEXT).safeString())
            .put("summaryText", extras.getCharSequence(Notification.EXTRA_SUMMARY_TEXT).safeString())
            .put("bigText", extras.getCharSequence(Notification.EXTRA_BIG_TEXT).safeString())
            .put("time", sbn.postTime.toString())
            .toString()

    val serviceIntent =
        Intent(applicationContext, BackgroundTask::class.java).apply {
          putExtra("type", "notification")
          putExtra("notification", payload)
        }

    try {
      HeadlessJsTaskService.acquireWakeLockNow(applicationContext)
      applicationContext.startService(serviceIntent)
      Log.d(TAG, "BackgroundTask requested for notification from ${sbn.packageName}")
    } catch (error: IllegalStateException) {
      Log.e(TAG, "failed to start BackgroundTask for notification", error)
    }
  }

  private fun CharSequence?.safeString(): String =
      if (TextUtils.isEmpty(this)) "" else this.toString().trim()

  private companion object {
    private const val TAG = "WatchNotificationListener"
  }
}
