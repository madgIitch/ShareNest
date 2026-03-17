import { Platform } from "react-native";

export const fontFamily = {
  regular: Platform.select({ ios: "System", android: "Roboto", default: "System" }),
  medium: Platform.select({ ios: "System", android: "Roboto-Medium", default: "System" }),
  bold: Platform.select({ ios: "System", android: "Roboto-Bold", default: "System" }),
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
} as const;

export const fontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

export const lineHeight = {
  tight: 16,
  normal: 22,
  relaxed: 26,
} as const;
