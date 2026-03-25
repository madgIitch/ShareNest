import { View, StyleSheet, ViewStyle } from "react-native";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  rounded?: boolean;
  style?: ViewStyle;
}

export default function Skeleton({ width, height = 16, rounded = false, style }: SkeletonProps) {
  return (
    <View
      style={[
        styles.base,
        rounded ? styles.rounded : styles.rect,
        typeof width === "number" ? { width } : width ? { width } : undefined,
        { height },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: "#2A2A2A" },
  rounded: { borderRadius: 9999 },
  rect: { borderRadius: 8 },
});
