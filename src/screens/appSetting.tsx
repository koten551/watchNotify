import React from "react"
import {StyleSheet, Switch, Text, View} from "react-native"
import {deviceStore} from "../store"
import {useShallow} from "zustand/react/shallow"

import SelectDropdown from "react-native-select-dropdown"
import {S10, S16, S20, S24, S8, normalize} from "../utils"
import {callableApps} from "../configs"

const Settings = ({appData}) => {
	const nameBeforeList = [
		{
			slug: "title",
			label: "Tiêu đề",
		},
		{
			slug: "message",
			label: "Tin nhắn",
		},
	]

	const [appNotify, setAppNotify] = deviceStore(useShallow(state => [state.appNotify, state.setAppNotify]))

	const changeSettingHandler = newData => {
		setAppNotify(newData)
	}
	const appSetting = appNotify.find(app => app.id === appData?.packageName)
	const currentValue = nameBeforeList.find(item => item.slug === appSetting?.nameBefore)

	const isCallable = !!callableApps.find(app => app.id === appData?.packageName)
	if (!appSetting) {
		return null
	}
	return (
		<View style={styles.card}>
			<Text style={styles.title}>{appData?.label}</Text>
			{isCallable && (
				<View style={styles.row}>
					<Text style={styles.text}>Thông báo cuộc gọi đến:</Text>
					<Switch
						value={appSetting.call}
						onValueChange={value => changeSettingHandler({...appSetting, call: value})}
					/>
				</View>
			)}
			<View style={styles.row}>
				<Text style={styles.text}>Nhận thông báo:</Text>
				<Switch
					value={appSetting.message}
					onValueChange={value => changeSettingHandler({...appSetting, message: value})}
				/>
			</View>
			<View style={styles.row}>
				<Text style={styles.text}>Gắn tên app vào:</Text>
				<SelectDropdown
					data={nameBeforeList}
					defaultValue={currentValue}
					onSelect={value =>
						changeSettingHandler({
							...appSetting,
							nameBefore: value.slug,
						})
					}
					renderButton={selectedItem => (
						<View style={styles.selectStyle}>
							<Text style={styles.selectText}>{selectedItem?.label || "Chọn"}</Text>
						</View>
					)}
					renderItem={(item, _index, isSelected) => (
						<View style={[styles.selectItem, isSelected && styles.selectItemSelected]}>
							<Text style={styles.selectText}>{item.label}</Text>
						</View>
					)}
					dropdownStyle={styles.dropdown}
				/>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		padding: S24,
	},

	scroll: {
		flexGrow: 1,
	},

	header: {
		alignItems: "center",
		marginBottom: S20,
	},

	headerText: {
		fontSize: normalize(28),
		color: "#000",
		fontWeight: "600",
	},

	card: {
		backgroundColor: "#ddd",
		paddingVertical: S8,
		paddingHorizontal: S16,
		marginBottom: S10,
		borderRadius: S8,
	},

	title: {
		color: "#000",
		fontSize: S24,
		fontWeight: "500",
	},

	text: {
		color: "#000",
		fontSize: normalize(15),
	},

	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: S10,
	},

	bottom: {
		paddingBottom: S10,
		justifyContent: "center",
		alignItems: "center",
	},

	bottomText: {
		color: "blue",
		fontSize: normalize(15),
		textDecorationLine: "underline",
	},

	selectStyle: {
		width: "auto",
		minWidth: 130,
		height: normalize(42),
		borderRadius: S8,
		backgroundColor: "#f5f5f5",
		justifyContent: "center",
		paddingHorizontal: S10,
	},
	selectText: {
		color: "#000",
		fontSize: normalize(15),
	},
	selectItem: {
		paddingVertical: S10,
		paddingHorizontal: S16,
		backgroundColor: "#fff",
	},
	selectItemSelected: {
		backgroundColor: "#e6e6e6",
	},
	dropdown: {
		backgroundColor: "#fff",
		borderRadius: S8,
	},
	modalStyle: {
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0, 0.8)",
		zIndex: 100,
	},
	button: {
		backgroundColor: "#ccc",
		padding: S8,
		borderRadius: normalize(4),
		marginTop: normalize(15),
	},
})

export default Settings
