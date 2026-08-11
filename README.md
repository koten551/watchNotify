# watchNotify

`watchNotify` is a React Native app for listening to Android system notifications, filtering them per app, and re-posting selected notifications locally so a watch or wearable device can receive them more reliably. The app also monitors Bluetooth connection state and can notify when the selected device reconnects.

## Key Features

- Guides the user through the required permissions on first launch.
- Lists installed apps and lets the user choose which apps can forward notifications.
- Provides per-app notification settings:
  - enable message notifications;
  - enable incoming call notifications for supported apps;
  - choose whether the app name is attached to the title or message.
- Optionally forwards notifications only when the screen is locked.
- Tracks a selected Bluetooth device and notifies when it reconnects.
- Handles notification and Bluetooth events with Android Headless JS tasks so events can be processed while the app is in the background.

## Tech Stack

- React Native `0.86.2`
- React `19.2.3`
- TypeScript
- Zustand + AsyncStorage for persisted settings
- Native Android Kotlin:
  - `NotificationListenerService`
  - `BroadcastReceiver`
  - `HeadlessJsTaskService`
- Yarn `4.18.0`

## Requirements

- Node.js `>= 22.11.0`
- Yarn `4.18.0`
- JDK and Android Studio configured for React Native development
- Android SDK, an emulator, or a physical Android device

The project includes an iOS scaffold, but the core features such as notification listening, Bluetooth receivers, and background tasks are currently implemented for Android.

## Installation

```sh
yarn install
```

If you need the iOS scaffold:

```sh
bundle install
bundle exec pod install --project-directory=ios
```

## Running The App

Start Metro:

```sh
yarn start
```

In another terminal, run the Android app:

```sh
yarn android
```

Available scripts:

```sh
yarn android
yarn ios
yarn start
yarn lint
yarn test
```

## Required Android Permissions

On the setup screen, grant the following permissions:

- Access Notification: allows the app to read system notifications.
- Notification: allows the app to create local notifications.
- Access Bluetooth: allows the app to access Bluetooth devices.
- Phone State: allows the app to read phone state.

After the required permissions are granted, tap `Start` to open the main settings screen.

## Usage

1. Open the app and grant permissions on the setup screen.
2. In `Cài đặt chung`, choose whether notifications should only be forwarded while the screen is locked.
3. Enable `Thông báo kết nối lại` if you want to be notified when the selected Bluetooth device reconnects.
4. Select a Bluetooth device from the paired devices list.
5. Toggle on the apps whose notifications should be forwarded.
6. Tap an enabled app to configure message notifications, call notifications, and app-name display behavior.

## Project Structure

```text
src/
  configs/        Notification, Bluetooth event, and local notification logic
  screens/        Setup screen, app list, and per-app settings modal
  store/          Zustand store persisted with AsyncStorage
  models/         Navigation/map icons
  utils.ts        Responsive sizing helpers

android/app/src/main/java/com/watchnotify/
  WatchNotificationListenerService.kt
  BackgroundEventReceiver.kt
  BackgroundTask.kt
  MainActivity.kt
  MainApplication.kt
```

## Development Notes

- `index.js` registers the React Native app, the notification channel, and the `backgroundTask` Headless JS task.
- `WatchNotificationListenerService` receives Android system notifications and sends their payload to JavaScript through `BackgroundTask`.
- `BackgroundEventReceiver` receives Bluetooth connect/disconnect events and forwards them to JavaScript so the app can update device state.
- App settings are persisted in `deviceStore` under the `deviceStore` storage key.
- Some packages use Yarn patches in `.yarn/patches`, so use Yarn instead of npm to avoid dependency drift.

## Checks

Run unit tests:

```sh
yarn test
```

Run lint:

```sh
yarn lint
```
