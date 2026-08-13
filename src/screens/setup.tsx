import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppState,
  NativeModules,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  check,
  checkNotifications,
  openSettings,
  request,
  requestNotifications,
  RESULTS,
  PERMISSIONS,
} from 'react-native-permissions';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { S10, S12, S16, S20, S24, S30, S8, normalize } from '../utils';
import { deviceStore } from '../store';
import { SafeAreaView } from 'react-native-safe-area-context';

type SetupStackParamList = {
  NotificationListener: undefined;
  Notification: undefined;
  Bluetooth: undefined;
  PhoneState: undefined;
  Finish: undefined;
};

type SetupStepKey =
  | 'notificationListen'
  | 'notificationStatus'
  | 'bluetoothPermission'
  | 'phoneState';

type SetupStatus = Record<SetupStepKey, boolean>;

type SetupStep = {
  name: keyof SetupStackParamList;
  title: string;
  description: string;
  buttonLabel: string;
  statusKey: SetupStepKey;
  action: () => Promise<void>;
  next: keyof SetupStackParamList;
};

const Stack = createNativeStackNavigator<SetupStackParamList>();

type NotificationListenerPermissionModule = {
  getPermissionStatus: () => Promise<'authorized' | 'denied'>;
  requestPermission: () => Promise<void>;
};

const NotificationListenerPermission: NotificationListenerPermissionModule =
  NativeModules.NotificationListenerPermission;

const Setup = () => {
  const [permissionStatus, setPermissionStatus] = useState<SetupStatus>({
    notificationListen: false,
    notificationStatus: false,
    bluetoothPermission: false,
    phoneState: false,
  });

  const updateStatus = useCallback((key: SetupStepKey, value: boolean) => {
    setPermissionStatus(prev => ({ ...prev, [key]: value }));
  }, []);

  const refreshPermissionStatus = useCallback(async () => {
    const notificationListenerStatus =
      (await NotificationListenerPermission?.getPermissionStatus()) || 'denied';

    const notificationPermission =
      Number(Platform.Version) < 33
        ? RESULTS.GRANTED
        : (await checkNotifications()).status;

    const bluetoothConnectStatus =
      Number(Platform.Version) < 31
        ? RESULTS.GRANTED
        : await check(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
    const bluetoothScanStatus =
      Number(Platform.Version) < 31
        ? RESULTS.GRANTED
        : await check(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);

    const phoneStateStatus = await check(PERMISSIONS.ANDROID.READ_PHONE_STATE);

    setPermissionStatus({
      notificationListen: notificationListenerStatus === 'authorized',
      notificationStatus: notificationPermission === RESULTS.GRANTED,
      bluetoothPermission:
        bluetoothConnectStatus === RESULTS.GRANTED &&
        bluetoothScanStatus === RESULTS.GRANTED,
      phoneState: phoneStateStatus === RESULTS.GRANTED,
    });
  }, []);

  const checkNotificationListen = useCallback(async () => {
    const status = await NotificationListenerPermission.getPermissionStatus();
    if (status !== 'authorized') {
      updateStatus('notificationListen', false);
      await (NotificationListenerPermission?.requestPermission() ||
        openSettings());
      return;
    }
    updateStatus('notificationListen', true);
  }, [updateStatus]);

  const checkNotification = useCallback(async () => {
    const granted =
      Number(Platform.Version) < 33
        ? RESULTS.GRANTED
        : (await requestNotifications(['alert', 'sound'])).status;

    if (granted !== RESULTS.GRANTED) {
      updateStatus('notificationStatus', false);
      if (granted === RESULTS.BLOCKED) {
        await openSettings('notifications');
      }
      return;
    }
    updateStatus('notificationStatus', true);
  }, [updateStatus]);

  const checkBluetoothPermission = useCallback(async () => {
    if (Number(Platform.Version) < 31) {
      updateStatus('bluetoothPermission', true);
      return;
    }

    const connectStatus = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
    const scanStatus = await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);

    if (connectStatus !== RESULTS.GRANTED || scanStatus !== RESULTS.GRANTED) {
      updateStatus('bluetoothPermission', false);
      await openSettings();
      return;
    }
    updateStatus('bluetoothPermission', true);
  }, [updateStatus]);

  const checkPhoneState = useCallback(async () => {
    const granted = await request(PERMISSIONS.ANDROID.READ_PHONE_STATE);
    if (granted !== RESULTS.GRANTED) {
      updateStatus('phoneState', false);
      await openSettings();
      return;
    }
    updateStatus('phoneState', true);
  }, [updateStatus]);

  const steps = useMemo<SetupStep[]>(
    () => [
      {
        name: 'NotificationListener',
        title: 'Access Notification',
        description:
          'Cho phep app doc thong bao tu dien thoai de gui sang dong ho.',
        buttonLabel: 'Mo cai dat cap quyen doc thong bao',
        statusKey: 'notificationListen',
        action: checkNotificationListen,
        next: 'Notification',
      },
      {
        name: 'Notification',
        title: 'Notification',
        description:
          'Cho phep app hien thong bao va canh bao khi can ket noi lai.',
        buttonLabel: 'Cap quyen thong bao',
        statusKey: 'notificationStatus',
        action: checkNotification,
        next: 'Bluetooth',
      },
      {
        name: 'Bluetooth',
        title: 'Access Bluetooth',
        description: 'Cho phep app ket noi Bluetooth voi thiet bi dong ho.',
        buttonLabel: 'Cap quyen Bluetooth',
        statusKey: 'bluetoothPermission',
        action: checkBluetoothPermission,
        next: 'PhoneState',
      },
      {
        name: 'PhoneState',
        title: 'Phone State',
        description:
          'Cho phep app nhan trang thai cuoc goi khi co ung dung ho tro.',
        buttonLabel: 'Cap quyen trang thai dien thoai',
        statusKey: 'phoneState',
        action: checkPhoneState,
        next: 'Finish',
      },
    ],
    [
      checkBluetoothPermission,
      checkNotification,
      checkNotificationListen,
      checkPhoneState,
    ],
  );

  useEffect(() => {
    refreshPermissionStatus();
    const appListener = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refreshPermissionStatus();
      }
    });
    return () => appListener.remove();
  }, [refreshPermissionStatus]);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: styles.screen,
      }}
    >
      {steps.map((step, index) => (
        <Stack.Screen key={step.name} name={step.name}>
          {props => (
            <PermissionStep
              {...props}
              step={step}
              stepIndex={index}
              stepCount={steps.length}
              isGranted={permissionStatus[step.statusKey]}
              refreshPermissionStatus={refreshPermissionStatus}
            />
          )}
        </Stack.Screen>
      ))}
      <Stack.Screen name="Finish">
        {props => (
          <FinishStep
            {...props}
            permissionStatus={permissionStatus}
            stepCount={steps.length}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

type PermissionStepProps = NativeStackScreenProps<
  SetupStackParamList,
  keyof SetupStackParamList
> & {
  step: SetupStep;
  stepIndex: number;
  stepCount: number;
  isGranted: boolean;
  refreshPermissionStatus: () => Promise<void>;
};

const PermissionStep = ({
  navigation,
  step,
  stepIndex,
  stepCount,
  isGranted,
  refreshPermissionStatus,
}: PermissionStepProps) => {
  const onRequestPermission = async () => {
    await step.action();
    await refreshPermissionStatus();
  };

  return (
    <StepLayout
      currentStep={stepIndex + 1}
      stepCount={stepCount}
      title={step.title}
      description={step.description}
      isGranted={isGranted}
    >
      <Pressable onPress={onRequestPermission} style={styles.primaryButton}>
        <Text style={styles.buttonText}>{step.buttonLabel}</Text>
      </Pressable>
      <Pressable
        disabled={!isGranted}
        onPress={() => navigation.navigate(step.next)}
        style={[styles.secondaryButton, !isGranted && styles.disabledButton]}
      >
        <Text style={styles.buttonText}>Tiep tuc</Text>
      </Pressable>
    </StepLayout>
  );
};

type FinishStepProps = NativeStackScreenProps<SetupStackParamList, 'Finish'> & {
  permissionStatus: SetupStatus;
  stepCount: number;
};

const FinishStep = ({
  navigation,
  permissionStatus,
  stepCount,
}: FinishStepProps) => {
  const changeSetupStatus = deviceStore(state => state.changeSetupStatus);
  const isReady =
    permissionStatus.notificationListen &&
    permissionStatus.notificationStatus &&
    permissionStatus.bluetoothPermission &&
    permissionStatus.phoneState;

  return (
    <StepLayout
      currentStep={stepCount}
      stepCount={stepCount}
      title="Hoan tat setup"
      description="Tat ca quyen can thiet da san sang. Ban co the bat dau cau hinh app."
      isGranted={isReady}
    >
      <Pressable
        disabled={!isReady}
        onPress={() => changeSetupStatus(true)}
        style={[styles.primaryButton, !isReady && styles.disabledButton]}
      >
        <Text style={styles.buttonText}>Start</Text>
      </Pressable>
      {!isReady && (
        <Pressable
          onPress={() => navigation.navigate('NotificationListener')}
          style={styles.secondaryButton}
        >
          <Text style={styles.buttonText}>Kiem tra lai</Text>
        </Pressable>
      )}
    </StepLayout>
  );
};

type StepLayoutProps = {
  currentStep: number;
  stepCount: number;
  title: string;
  description: string;
  isGranted: boolean;
  children: React.ReactNode;
};

const StepLayout = ({
  currentStep,
  stepCount,
  title,
  description,
  isGranted,
  children,
}: StepLayoutProps) => (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <Text style={styles.stepText}>
        Step {currentStep}/{stepCount}
      </Text>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressValue,
            { width: `${(currentStep / stepCount) * 100}%` },
          ]}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text
          style={[styles.status, isGranted ? styles.granted : styles.pending]}
        >
          {isGranted ? 'Da cap quyen' : 'Chua cap quyen'}
        </Text>
      </View>
      <View style={styles.actionGroup}>{children}</View>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: S24,
  },
  stepText: {
    color: '#555',
    fontSize: S12,
    marginBottom: S8,
  },
  progressTrack: {
    height: normalize(6),
    borderRadius: normalize(3),
    backgroundColor: '#e6e6e6',
    overflow: 'hidden',
  },
  progressValue: {
    height: '100%',
    backgroundColor: '#2e7d32',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    rowGap: S16,
  },
  title: {
    color: '#000',
    fontSize: S30,
    fontWeight: '600',
  },
  description: {
    color: '#333',
    fontSize: S16,
    lineHeight: normalize(23),
  },
  status: {
    alignSelf: 'flex-start',
    color: '#fff',
    fontSize: S16,
    paddingHorizontal: S16,
    paddingVertical: S10,
    borderRadius: S8,
    overflow: 'hidden',
  },
  granted: {
    backgroundColor: '#2e7d32',
  },
  pending: {
    backgroundColor: '#c62828',
  },
  actionGroup: {
    rowGap: S10,
  },
  primaryButton: {
    minHeight: normalize(48),
    borderRadius: S8,
    backgroundColor: '#1565c0',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: S20,
  },
  secondaryButton: {
    minHeight: normalize(48),
    borderRadius: S8,
    backgroundColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: S20,
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: S16,
    fontWeight: '500',
  },
});

export default Setup;
