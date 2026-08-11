import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { deviceStore } from '../store';
import { useShallow } from 'zustand/react/shallow';
import { InstalledApps } from 'react-native-launcher-kit';
import { S10, S12, S14, S20, S24, S8, normalize } from '../utils';
import Modal from 'react-native-modal';
import Settings from './appSetting';
import BluetoothSerial from 'react-native-bluetooth-serial-next';
import SelectDropdown from 'react-native-select-dropdown';
import DeviceInfo from 'react-native-device-info';
import { gMaps } from '../configs';
import Setup from './setup';
import { AppDetail } from 'react-native-launcher-kit/lib/typescript/interfaces/InstalledApps';

const App = () => {
  const { removeAppNotify, appNotify, setAppNotify, setupStatus } = deviceStore(
    useShallow(state => ({
      removeAppNotify: state.removeAppNotify,
      appNotify: state.appNotify,
      setAppNotify: state.setAppNotify,
      setupStatus: state.setupStatus,
    })),
  );

  const [modalData, setModalData] = useState<any>();
  const [showModal, setShowModal] = useState(false);
  const [onReHydrate, setOnReHydrate] = useState(false);
  const [renderApps, setRenderApps] = useState<AppDetail[]>([]);
  const handleGetInstalledApp = useCallback(async () => {
    const appList = await InstalledApps.getSortedApps();
    const bundleId = DeviceInfo.getBundleId();
    const finalApps = appList.filter(
      appData =>
        appData.packageName !== bundleId && appData.packageName !== gMaps.id,
    );
    setRenderApps(finalApps);
    if (setupStatus) {
      setOnReHydrate(true);
    }

    setTimeout(() => {
      setOnReHydrate(true);
    }, 3000);
  }, [setupStatus]);

  useEffect(() => {
    handleGetInstalledApp();
  }, [handleGetInstalledApp]);

  if (!onReHydrate)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    );

  if (!setupStatus) return <Setup />;
  return (
    <>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
        >
          <GeneralSetting />
          <Text style={styles.smallText}>Enable app to open setting</Text>
          {renderApps.map((appData, index) => {
            const isEnable = !!appNotify?.find(
              app => app.id === appData.packageName,
            );
            return (
              <Pressable
                key={index}
                style={styles.card}
                onPress={() => {
                  if (isEnable) {
                    setModalData({ ...appData });
                    setShowModal(true);
                  }
                }}
              >
                <View style={styles.appInfo}>
                  <Image
                    style={styles.appIcon}
                    source={{ uri: appData.icon }}
                  />
                  <Text style={styles.text}>{appData.label}</Text>
                </View>
                <Switch
                  value={isEnable}
                  onValueChange={value => {
                    if (value) {
                      setAppNotify({
                        id: appData.packageName,
                        message: true,
                        call: false,
                        nameBefore: 'title',
                        appName: appData.label,
                      });
                      return;
                    }
                    removeAppNotify(appData.packageName);
                  }}
                />
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.bottom}>
          <Pressable onPress={() => Linking.openURL('https://fb.com/koten551')}>
            <Text style={styles.bottomText}>Contact me!</Text>
          </Pressable>
        </View>
      </View>
      <View>
        <Modal
          isVisible={showModal}
          onBackButtonPress={() => setShowModal(false)}
          onBackdropPress={() => setShowModal(false)}
        >
          <Settings appData={modalData} />
        </Modal>
      </View>
    </>
  );
};

const GeneralSetting = () => {
  const [
    reconnectNotify,
    setReconnectNotifyStatus,
    setReconnectNotifyInfo,
    notificationWhenLock,
    setNotificationWhenLock,
  ] = deviceStore(
    useShallow(state => [
      state.reconnectNotify,
      state.setReconnectNotifyStatus,
      state.setReconnectNotifyInfo,
      state.notificationWhenLock,
      state.setNotificationWhenLock,
    ]),
  );

  const [bluetoothList, setBluetoothList] = useState<Array<any>>([]);
  const defaultValueIndex = bluetoothList.findIndex(
    device => device.address === reconnectNotify.watchInformation.address,
  );

  useEffect(() => {
    BluetoothSerial.list()
      .then(list => setBluetoothList(list))
      .catch(e => console.log(e));
  }, []);

  return (
    <View style={[styles.card, styles.colunm]}>
      <Text style={styles.title}>Cài đặt chung</Text>
      <View style={styles.row}>
        <Text style={styles.text}>
          {'Chỉ nhận thông báo khi \nkhoá màn hình:'}
        </Text>
        <Switch
          value={notificationWhenLock}
          onValueChange={value => setNotificationWhenLock(value)}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.text}>Thông báo kết nối lại:</Text>
        <Switch
          value={reconnectNotify?.enable}
          onValueChange={value => setReconnectNotifyStatus(value)}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.text}>Thiết bị:</Text>
        <SelectDropdown
          data={bluetoothList}
          defaultValue={
            defaultValueIndex >= 0
              ? bluetoothList[defaultValueIndex]
              : undefined
          }
          onSelect={value => setReconnectNotifyInfo(value)}
          renderButton={selectedItem => (
            <View style={styles.selectStyle}>
              <Text style={styles.selectText} numberOfLines={1}>
                {selectedItem?.name || 'Chọn thiết bị'}
              </Text>
            </View>
          )}
          renderItem={(item, _index, isSelected) => (
            <View
              style={[
                styles.selectItem,
                isSelected && styles.selectItemSelected,
              ]}
            >
              <Text style={styles.selectText} numberOfLines={1}>
                {`${item.name || 'Unknown'} ~ ${item.address || ''}`}
              </Text>
            </View>
          )}
          dropdownStyle={styles.dropdown}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: S24,
  },

  scroll: {
    flexGrow: 1,
  },

  header: {
    alignItems: 'center',
    marginBottom: S20,
  },

  headerText: {
    fontSize: normalize(28),
    color: '#000',
    fontWeight: '600',
  },

  selectStyle: {
    flex: 1,
    minWidth: normalize(210),
    height: normalize(42),
    borderRadius: S8,
    marginRight: S10,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    paddingHorizontal: S10,
  },

  selectText: {
    color: '#000',
    fontSize: normalize(15),
  },

  selectItem: {
    paddingVertical: S10,
    paddingHorizontal: S14,
    backgroundColor: '#fff',
  },

  selectItemSelected: {
    backgroundColor: '#e6e6e6',
  },

  dropdown: {
    backgroundColor: '#fff',
    borderRadius: S8,
  },

  card: {
    backgroundColor: '#ddd',
    paddingVertical: S8,
    paddingHorizontal: S14,
    marginBottom: S10,
    borderRadius: S8,
    justifyContent: 'space-between',
    flexDirection: 'row',
  },

  title: {
    color: '#000',
    fontSize: S24,
    fontWeight: '500',
  },

  text: {
    color: '#000',
    fontSize: normalize(15),
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: S10,
  },

  bottom: {
    paddingVertical: S10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bottomText: {
    color: 'blue',
    fontSize: normalize(15),
    textDecorationLine: 'underline',
  },

  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  modalStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0, 0.8)',
    zIndex: 100,
  },
  button: {
    backgroundColor: '#ccc',
    padding: S8,
    borderRadius: normalize(4),
    marginTop: normalize(15),
  },

  appIcon: {
    width: normalize(40),
    height: normalize(40),
    marginRight: S10,
  },
  colunm: { flexDirection: 'column' },
  smallText: {
    color: '#ccd',
    fontSize: S12,
  },
});

export default App;
