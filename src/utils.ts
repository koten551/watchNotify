import {Dimensions, PixelRatio} from "react-native"
const {width, height} = Dimensions.get("window")

const ratio = width / 375 //iphone 12
export const normalize = (size: number | string) => {
	if (typeof size === "string") {
		size = Number(size)
	}
	const newSize = size * ratio
	return Math.ceil(PixelRatio.roundToNearestPixel(newSize))
}

export const S8 = normalize(8)
export const S10 = normalize(10)
export const S12 = normalize(12)
export const S14 = normalize(14)
export const S16 = normalize(16)
export const S18 = normalize(18)
export const S20 = normalize(20)
export const S22 = normalize(22)
export const S24 = normalize(24)
export const S30 = normalize(30)
export const S32 = normalize(32)
export const S36 = normalize(36)
export const S40 = normalize(32)
