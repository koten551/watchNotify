import AsyncStorage from "@react-native-async-storage/async-storage"
import {create} from "zustand"
import {createJSONStorage, persist} from "zustand/middleware"

const initDeviceStore = {
	notificationData: null,
	setupStatus: false,
	appNotify: [
		{
			id: "com.zing.zalo",
			message: true,
			call: true,
			nameBefore: "title",
		},
		{
			id: "com.facebook.orca",
			message: false,
			call: true,
			nameBefore: "title",
		},
		{
			id: "com.Slack",
			message: true,
			call: false,
			nameBefore: "title",
		},
	],
	reconnectNotify: {
		enable: false,
		watchInformation: {
			address: null,
			name: null,
		},
	},
	watchStatus: {
		connected: true,
		timestamp: 0,
	},
	bluetoothLog: {},
	lockStatus: false,
	notificationWhenLock: false,
}

export const deviceStore = create(
	persist<any>(
		(set, get) => ({
			...initDeviceStore,
			setNotificationData: data => {
				set({
					notificationData: {
						text: data?.text || "",
						title: data?.title || "",
						app: data.app,
						time: data.time,
					},
				})
			},
			changeSetupStatus: status => {
				set({setupStatus: status})
			},
			setAppNotify: ({id, ...other}) => {
				const appNotify = [...get().appNotify]
				const currentAppIndex = appNotify.findIndex(app => app.id === id)
				if (currentAppIndex >= 0) {
					appNotify[currentAppIndex] = {
						id,
						...other,
					}
					set({appNotify})
					return
				}

				appNotify.push({
					id,
					...other,
				})
				set({appNotify})
			},
			removeAppNotify: appId => {
				const appNotify = get().appNotify
				const newData = appNotify.filter(app => app.id !== appId)
				set({appNotify: newData})
			},
			setReconnectNotifyStatus: enable => {
				if (typeof enable === "boolean") {
					set({
						reconnectNotify: {
							...get().reconnectNotify,
							enable,
						},
					})
				}
			},
			setReconnectNotifyInfo: info => {
				set({
					reconnectNotify: {
						...get().reconnectNotify,
						watchInformation: info,
					},
				})
			},
			setWatchStatus: watchStatus => {
				set({watchStatus})
			},
			setBluetoothLog: bluetoothLog => {
				set({bluetoothLog})
			},
			setLockStatus: lockStatus => {
				set({lockStatus})
			},
			setNotificationWhenLock: notificationWhenLock => {
				set({notificationWhenLock})
			},
		}),
		{
			storage: createJSONStorage(() => AsyncStorage),
			name: "deviceStore",
			partialize: state => ({
				setupStatus: state?.setupStatus,
				appNotify: state?.appNotify,
				watchStatus: state?.watchStatus,
				reconnectNotify: state?.reconnectNotify,
				notificationWhenLock: state?.notificationWhenLock,
				bluetoothLog: state?.bluetoothLog,
			}),
		},
	),
)
