package com.watchnotify

import android.content.ComponentName
import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NotificationListenerPermissionModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = NAME

  @ReactMethod
  fun getPermissionStatus(promise: Promise) {
    val componentName = ComponentName(reactContext, WatchNotificationListenerService::class.java)
    promise.resolve(if (isNotificationListenerEnabled(componentName)) "authorized" else "denied")
  }

  @ReactMethod
  fun requestPermission(promise: Promise) {
    try {
      val intent =
          Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }

      reactContext.startActivity(intent)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("notification_listener_settings_error", error)
    }
  }

  private fun isNotificationListenerEnabled(componentName: ComponentName): Boolean {
    val enabledListeners =
        Settings.Secure.getString(
            reactContext.contentResolver,
            "enabled_notification_listeners",
        ) ?: return false

    return enabledListeners.split(':').any {
      ComponentName.unflattenFromString(it)?.let { enabledComponent ->
        TextUtils.equals(enabledComponent.packageName, componentName.packageName) &&
            TextUtils.equals(enabledComponent.className, componentName.className)
      } ?: false
    }
  }

  private companion object {
    private const val NAME = "NotificationListenerPermission"
  }
}
