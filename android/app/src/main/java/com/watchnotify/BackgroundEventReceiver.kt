package com.watchnotify

import android.bluetooth.BluetoothDevice
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.Log
import com.facebook.react.HeadlessJsTaskService

class BackgroundEventReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action ?: return
    if (action !in BLUETOOTH_ACTIONS) {
      return
    }

    val device = intent.getBluetoothDeviceExtra()
    val address =
        device?.safeAddress()
            ?: run {
              Log.w(TAG, "bluetooth event ignored: action=$action, device/address unavailable")
              return
            }

    val params =
        Bundle().apply {
          putString("event", action)
          putString("address", address)
          putString("type", "bluetooth")
        }

    val service = Intent(context.applicationContext, BackgroundTask::class.java).apply { putExtras(params) }

    try {
      HeadlessJsTaskService.acquireWakeLockNow(context.applicationContext)
      context.applicationContext.startService(service)
      Log.d(TAG, "BackgroundTask service requested: action=$action, address=$address")
    } catch (error: IllegalStateException) {
      Log.e(TAG, "failed to start BackgroundTask service", error)
    }
  }

  private fun Intent.getBluetoothDeviceExtra(): BluetoothDevice? =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        getParcelableExtra(BluetoothDevice.EXTRA_DEVICE, BluetoothDevice::class.java)
      } else {
        @Suppress("DEPRECATION")
        getParcelableExtra(BluetoothDevice.EXTRA_DEVICE)
      }

  private fun BluetoothDevice.safeAddress(): String? =
      try {
        address
      } catch (_: SecurityException) {
        null
      }

  private companion object {
    private const val TAG = "BackgroundEventReceiver"
    val BLUETOOTH_ACTIONS =
        setOf(
            BluetoothDevice.ACTION_ACL_CONNECTED,
            BluetoothDevice.ACTION_ACL_DISCONNECTED,
            BluetoothDevice.ACTION_ACL_DISCONNECT_REQUESTED,
        )
  }
}
