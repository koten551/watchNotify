package com.watchnotify

import android.app.Application
import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Bundle
import android.util.Log
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {
  private val lockReceiver =
      object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
          val action = intent.action ?: return
          if (action !in DEVICE_STATE_ACTIONS) {
            return
          }

          val keyguardManager = context.getSystemService(KEYGUARD_SERVICE) as KeyguardManager
          val lockStatus =
              if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                keyguardManager.isDeviceLocked
              } else {
                @Suppress("DEPRECATION")
                keyguardManager.inKeyguardRestrictedInputMode()
              }

          Log.d(TAG, "device state event received: action=$action, lockStatus=$lockStatus")

          startBackgroundTask(
              Bundle().apply {
                putBoolean("lockStatus", lockStatus)
                putString("type", "deviceState")
              }
          )
        }
      }

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          add(NotificationListenerPermissionPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    registerLockReceiver()
  }

  private fun registerLockReceiver() {
    val filter =
        IntentFilter().apply {
          DEVICE_STATE_ACTIONS.forEach(::addAction)
        }

    registerNotExportedReceiver(lockReceiver, filter)
  }

  private fun registerNotExportedReceiver(receiver: BroadcastReceiver, filter: IntentFilter) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      @Suppress("DEPRECATION")
      registerReceiver(receiver, filter)
    }
  }

  private fun startBackgroundTask(params: Bundle) {
    val service = Intent(applicationContext, BackgroundTask::class.java).apply { putExtras(params) }
    HeadlessJsTaskService.acquireWakeLockNow(applicationContext)
    try {
      applicationContext.startService(service)
      Log.d(TAG, "BackgroundTask service requested: type=${params.getString("type")}")
    } catch (error: IllegalStateException) {
      Log.e(TAG, "failed to start BackgroundTask service", error)
    }
  }

  private companion object {
    private const val TAG = "MainApplication"
    val DEVICE_STATE_ACTIONS =
        setOf(Intent.ACTION_USER_PRESENT, Intent.ACTION_SCREEN_OFF, Intent.ACTION_SCREEN_ON)
  }
}
