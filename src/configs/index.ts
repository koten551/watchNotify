import PushNotification from 'react-native-push-notification';
import { deviceStore } from '../store';
import _ from 'lodash';
import BackgroundTimer from 'react-native-background-timer';

export const channelConfig = {
  id: 'watchNotifyByPiser',
  name: 'Notifications',
};

export const callableApps = [
  {
    id: 'com.zing.zalo',
    name: 'Zalo',
    callingMessage: [
      'Đang gọi đến',
      'Đang gọi video đến',
      'Incoming voice call',
      'Incoming video call',
    ],
    hideNotify: [
      'Đang gọi...',
      'Calling...',
      'Đang xử lý video...',
      'Processing video...',
    ],
  },
  {
    id: 'com.facebook.orca',
    name: 'Messenger',
    callingMessage: [
      'Cuộc gọi thoại trên Messenger',
      'Gọi từ Messenger',
      'Audio call from Messenger',
      'Cuộc gọi video trên Messenger',
      'Video call from Messenger',
      'Audio call',
      'Video call',
    ],
    hideNotify: ['lại cuộc gọi', 'Calling…'],
  },
  {
    id: 'com.Slack',
    name: 'Slack',
    callingMessage: [],
    hideNotify: [],
  },
];

export const gMaps = {
  id: 'com.google.android.apps.maps',
  name: 'Maps',
  distances: [10, 50, 100, 200, 300, 500],
  here: '0',
};

export const notificationListener = async ({ notification }) => {
  console.log('notificationListener received', notification);

  try {
    const data = JSON.parse(notification);
    console.log({ data });

    const { setNotificationData, appNotify } = deviceStore.getState();
    const isEnableApp = appNotify?.find(app => app.id === data?.app);
    if (!isEnableApp) {
      console.log('notificationListener ignored app', data?.app);
      return;
    }
    const notificationData = {
      text: data?.text || '',
      title: data?.title || '',
      app: data.app,
      time: data.time,
    };

    setNotificationData(notificationData);
  } catch (e) {
    console.log({ e });
  }
};
let notificationCount = 0;
export const appService = () => {
  deviceStore.subscribe((state, preState) => {
    //handle app notification
    if (_.isEqual(state?.notificationData, preState?.notificationData)) return;
    if (!state?.lockStatus && state.notificationWhenLock) return;

    const currentAppSetting = state.appNotify.find(
      app => app.id === state.notificationData?.app,
    );
    if (!currentAppSetting) return;

    // gmap notification
    // if (state?.notificationData?.app === gMaps.id) {
    // 	handleMapNotification(state, currentAppSetting)
    // 	return
    // }

    //other notification
    if (
      state?.notificationData?.text?.length > 0 &&
      !_.isEqual(state?.notificationData, preState?.notificationData)
    ) {
      const appData = callableApps.find(
        app => app.id === state?.notificationData?.app,
      );
      const callNotify = isCalling(state?.notificationData, appData);

      if (currentAppSetting?.call && callNotify) {
        if (
          state?.notificationData.text === preState?.notificationData?.text &&
          state?.notificationData?.app === preState?.notificationData?.app
        ) {
          return;
        }

        pushNotify(state?.notificationData, appData?.name, 1300);

        BackgroundTimer.setTimeout(() => {
          pushNotify(state?.notificationData, appData?.name, 1300);
        }, 2000);

        BackgroundTimer.setTimeout(() => {
          pushNotify(state?.notificationData, appData?.name, 1300);
        }, 3400);

        BackgroundTimer.setTimeout(() => {
          pushNotify(state?.notificationData, appData?.name, 1300);
        }, 4800);

        BackgroundTimer.setTimeout(() => {
          pushNotify(state?.notificationData, appData?.name);
        }, 6200);

        return;
      }
      const isHideNotify =
        appData?.hideNotify.some(mess =>
          state?.notificationData.text?.includes(mess),
        ) ||
        state?.notificationData?.title?.includes('...') ||
        state?.notificationData?.title?.includes('…');
      if (!callNotify && currentAppSetting?.message && !isHideNotify) {
        const now = new Date().getTime();
        if (now - state?.notificationData?.time < 10000) {
          if (
            state?.notificationData?.text ===
              preState?.notificationData?.text &&
            state?.notificationData?.time - preState?.notificationData?.time <
              3000
          ) {
            return;
          }
          if (!state.watchStatus.connected) {
            notificationCount++;
          }
          if (state.watchStatus.connected) {
            notificationCount = 0;
          }
          pushNotify(
            state?.notificationData,
            appData?.name,
            undefined,
            currentAppSetting.nameBefore,
          );
        }
        return;
      }
    }
  });
};

export const pushNotify = (
  finalData: any,
  appName?: string,
  deleteAfterPush?: number,
  nameBefore = 'title',
) => {
  const pushData: any =
    nameBefore === 'message'
      ? {
          channelId: channelConfig.id,
          vibrate: false,
          visibility: 'private',
          ignoreInForeground: false,
          timeoutAfter: deleteAfterPush,
          title: appName,
          message: `${appName ? appName : ''}(${finalData?.title}): ${
            finalData?.text
          }`,
          playSound: false,
        }
      : {
          channelId: channelConfig.id,
          vibrate: false,
          visibility: 'private',
          ignoreInForeground: false,
          timeoutAfter: deleteAfterPush,
          title: appName ? `${appName}: ${finalData?.title}` : finalData?.title,
          message: finalData?.text || '',
          playSound: false,
        };
  PushNotification.localNotification(pushData);
};

export const isCalling = (current, appData) => {
  if (appData?.callingMessage.includes(current?.text)) {
    return true;
  }
  return false;
};

const handleReconnect = (bluetoothLog, prevBluetoothLog) => {
  if (bluetoothLog?.event === prevBluetoothLog?.event) return;
  const { reconnectNotify, setWatchStatus, watchStatus, setBluetoothLog } =
    deviceStore.getState();
  if (
    reconnectNotify?.enable &&
    reconnectNotify?.watchInformation?.address === bluetoothLog?.address
  ) {
    if (
      bluetoothLog?.event === 'android.bluetooth.device.action.ACL_CONNECTED'
    ) {
      const timestamp = new Date().getTime();
      if (timestamp - watchStatus?.timestamp > 10000) {
        const data = {
          text:
            notificationCount > 0
              ? `Đã kết nối lại với thiết bị, bạn có (${notificationCount}) thông báo mới!`
              : 'Đã kết nối lại với thiết bị!',
          title: '',
        };

        BackgroundTimer.setTimeout(() => {
          pushNotify(data, 'Đã kết nối', 6000);
        }, 10000);
      }
      setWatchStatus({
        connected: true,
        timestamp,
      });
    }
    if (
      bluetoothLog?.event === 'android.bluetooth.device.action.ACL_DISCONNECTED'
    ) {
      setWatchStatus({
        connected: false,
        timestamp: new Date().getTime(),
      });
    }
    setBluetoothLog(bluetoothLog);
  }
};

export const backgroundTask = async data => {
  console.log('backgroundTask received', data);

  if (data?.type === 'notification') {
    await notificationListener({ notification: data.notification });
    return;
  }

  if (data?.type === 'bluetooth') {
    const bluetoothLog = {
      address: data?.address,
      event: data?.event,
      timestamp: new Date().getTime(),
    };
    const preBluetoothLog = deviceStore.getState().bluetoothLog;
    handleReconnect(bluetoothLog, preBluetoothLog);
  }
  if (data?.type === 'deviceState') {
    const { setLockStatus } = deviceStore.getState();
    setLockStatus(data?.lockStatus);
  }
};

export const registerChannel = () => {
  PushNotification.channelExists(channelConfig.id, exists => {
    if (!exists) {
      PushNotification.createChannel(
        {
          channelId: channelConfig.id,
          channelName: channelConfig.name,
          importance: 1,
          vibrate: false,
          playSound: false,
        },
        () => null,
      );
    }
  });
};

// const checkGmapNotification = (notificationData, mapNotification) => {
// 	return (
// 		notificationData?.title?.length > 0 &&
// 		(notificationData?.title !== mapNotification?.title || notificationData?.text !== mapNotification?.text)
// 	)
// }

// const handleMapNotification = (state, currentAppSetting) => {
// 	if (checkGmapNotification(state?.notificationData, globalData.mapNotifcation)) {
// 		const regex = /\d+/g
// 		const matches = state?.notificationData?.title?.match(regex)
// 		if (state?.notificationData?.text === globalData.mapNotifcation?.text) {
// 			const flag = matches?.some(distance => gMaps.distances.includes(Number(distance)))
// 			if (!flag) {
// 				return
// 			}
// 			const oldMatches = globalData.mapNotifcation?.title?.match(regex)
// 			if (oldMatches?.length > 0) {
// 				const oldDistance = Number(oldMatches[0])
// 				const currentDistance = Number(matches[0])
// 				if (Math.abs(currentDistance - oldDistance) < 50) {
// 					return
// 				}
// 			}
// 		}
// 		const rightHere = matches?.includes(gMaps.here)
// 		globalData.mapNotifcation = rightHere
// 			? {...state?.notificationData, tilte: "hiện tại"}
// 			: {...state?.notificationData}
// 		pushNotify(globalData.mapNotifcation, gMaps.name, undefined, currentAppSetting.nameBefore)
// 	}
// }
