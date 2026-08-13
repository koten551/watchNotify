package com.watchnotify

import android.content.ComponentName
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.service.notification.NotificationListenerService
import android.text.TextUtils
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactApplication
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()
    super.onCreate(savedInstanceState)
    requestNotificationListenerRebind()
    
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "watchNotify"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    val reactHost = (application as ReactApplication).reactHost

    if (reactHost?.currentReactContext == null) {
      return
    }

    super.onWindowFocusChanged(hasFocus)
  }

  private fun requestNotificationListenerRebind() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
      return
    }

    val componentName = ComponentName(this, WatchNotificationListenerService::class.java)
    if (!isNotificationListenerEnabled(componentName)) {
      Log.w(TAG, "notification listener permission is not enabled")
      return
    }

    NotificationListenerService.requestRebind(componentName)
    Log.d(TAG, "notification listener rebind requested")
  }

  private fun isNotificationListenerEnabled(componentName: ComponentName): Boolean {
    val enabledListeners =
        Settings.Secure.getString(contentResolver, "enabled_notification_listeners") ?: return false

    return enabledListeners.split(':').any {
      ComponentName.unflattenFromString(it)?.let { enabledComponent ->
        TextUtils.equals(enabledComponent.packageName, componentName.packageName) &&
            TextUtils.equals(enabledComponent.className, componentName.className)
      } ?: false
    }
  }

  private companion object {
    private const val TAG = "MainActivity"
  }
}
