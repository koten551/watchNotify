package com.watchnotify

import android.content.Intent
import android.util.Log
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

class BackgroundTask : HeadlessJsTaskService() {
  override fun onCreate() {
    super.onCreate()
    Log.d(TAG, "service created")
  }

  override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
    val extras =
        intent?.extras
            ?: run {
              Log.w(TAG, "ignored start: extras are null")
              return null
            }

    Log.d(
        TAG,
        "starting JS task: type=${extras.getString("type")}, event=${extras.getString("event")}, address=${extras.getString("address")}, lockStatus=${extras.get("lockStatus")}",
    )

    return HeadlessJsTaskConfig(
        TASK_NAME,
        Arguments.fromBundle(extras),
        TASK_TIMEOUT_MS,
        true,
    )
  }

  private companion object {
    private const val TAG = "BackgroundTask"
    private const val TASK_NAME = "backgroundTask"
    private const val TASK_TIMEOUT_MS = 15000L
  }
}
