import React, { useEffect, useState } from 'react';
import {
  AppState,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import RNAndroidNotificationListener from 'react-native-android-notification-listener';
import {
  check,
  checkNotifications,
  openSettings,
  request,
  requestNotifications,
  RESULTS,
} from 'react-native-permissions';
import { S10, S16, S20, S30, S8 } from '../utils';
import { deviceStore } from '../store';
import { PERMISSIONS } from 'react-native-permissions';

const Setup = () => {
  const changeSetupStatus = deviceStore(state => state.changeSetupStatus);
  const [notificationListen, setNotificationListen] = useState(false);
  const [bluetoothPermission, setBluetoothPermission] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(false);
  const [phoneState, setPhoneState] = useState(false);

  const refreshPermissionStatus = async () => {
    const notificationListenerStatus =
      await RNAndroidNotificationListener.getPermissionStatus();
    setNotificationListen(notificationListenerStatus === 'authorized');

    const notificationPermission =
      Number(Platform.Version) < 33
        ? RESULTS.GRANTED
        : (await checkNotifications()).status;
    setNotificationStatus(notificationPermission === RESULTS.GRANTED);

    const bluetoothConnectStatus =
      Number(Platform.Version) < 31
        ? RESULTS.GRANTED
        : await check(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
    const bluetoothScanStatus =
      Number(Platform.Version) < 31
        ? RESULTS.GRANTED
        : await check(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
    setBluetoothPermission(
      bluetoothConnectStatus === RESULTS.GRANTED &&
        bluetoothScanStatus === RESULTS.GRANTED,
    );

    const phoneStateStatus = await check(PERMISSIONS.ANDROID.READ_PHONE_STATE);
    setPhoneState(phoneStateStatus === RESULTS.GRANTED);
  };

  const checkBluetoothPermission = async () => {
    if (Number(Platform.Version) < 31) {
      setBluetoothPermission(true);
      return;
    }

    const connectStatus = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
    const scanStatus = await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);

    if (connectStatus !== RESULTS.GRANTED || scanStatus !== RESULTS.GRANTED) {
      setBluetoothPermission(false);
      await openSettings();
      return;
    }
    setBluetoothPermission(true);
  };
  const checkNotificationListen = async () => {
    const status = await RNAndroidNotificationListener.getPermissionStatus();
    if (status !== 'authorized') {
      setNotificationListen(false);
      RNAndroidNotificationListener.requestPermission();
      return;
    }
    setNotificationListen(true);
  };

  const checkNotification = async () => {
    const granted =
      Number(Platform.Version) < 33
        ? RESULTS.GRANTED
        : (await requestNotifications(['alert', 'sound'])).status;

    if (granted !== RESULTS.GRANTED) {
      setNotificationStatus(false);
      if (granted === RESULTS.BLOCKED) {
        await openSettings('notifications');
      }
      return;
    }
    setNotificationStatus(true);
  };

  const checkPhoneState = async () => {
    const granted = await request(PERMISSIONS.ANDROID.READ_PHONE_STATE);
    if (granted !== RESULTS.GRANTED) {
      setPhoneState(false);
      await openSettings();
      return;
    }
    setPhoneState(true);
  };

  useEffect(() => {
    refreshPermissionStatus();
    const appListener = AppState.addEventListener('change', async state => {
      if (state === 'active') {
        refreshPermissionStatus();
      }
    });
    return () => appListener.remove();
  }, []);
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, backgroundColor: '#fff', paddingBottom: 10 }}>
          <View style={styles.container}>
            <Text style={{ color: 'black', fontSize: S20, fontWeight: '500' }}>
              Accept permissions
            </Text>
            <Pressable
              onPress={checkNotificationListen}
              style={[
                styles.button,
                {
                  backgroundColor: !notificationStatus ? 'red' : 'green',
                },
              ]}
            >
              <Text style={styles.buttonText}>Access Notification</Text>
            </Pressable>

            <Pressable
              onPress={checkNotification}
              style={[
                styles.button,
                {
                  backgroundColor: !notificationListen ? 'red' : 'green',
                },
              ]}
            >
              <Text style={styles.buttonText}>Notification</Text>
            </Pressable>

            <Pressable
              onPress={checkBluetoothPermission}
              style={[
                styles.button,
                {
                  backgroundColor: !bluetoothPermission ? 'red' : 'green',
                },
              ]}
            >
              <Text style={styles.buttonText}>Access Bluetooth</Text>
            </Pressable>

            <Pressable
              onPress={checkPhoneState}
              style={[
                styles.button,
                {
                  backgroundColor: !phoneState ? 'red' : 'green',
                },
              ]}
            >
              <Text style={styles.buttonText}>Phone State</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => {
              changeSetupStatus(true);
            }}
            disabled={
              !notificationListen || !notificationStatus || !bluetoothPermission
            }
            style={[
              styles.button,
              {
                backgroundColor:
                  !notificationListen ||
                  !notificationStatus ||
                  !bluetoothPermission
                    ? 'red'
                    : 'green',
                alignSelf: 'center',
              },
            ]}
          >
            <Text style={styles.buttonText}>Start</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'red',
    padding: S10,
    borderRadius: S8,
    width: '90%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: S30,
  },

  buttonText: {
    color: '#fff',
    fontSize: S16,
  },
});

export default Setup;
