import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import type { ViewStyle } from "react-native";

import { colors, radius } from "../../theme";

type Props = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function Skeleton({ width = "100%", height = 16, borderRadius = radius.sm, style }: Props) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

// Skeleton precompuesto para ListingCard
export function ListingCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={200} borderRadius={0} />
      <View style={styles.body}>
        <Skeleton width="40%" height={12} />
        <Skeleton width="80%" height={16} />
        <Skeleton width="60%" height={16} />
        <View style={styles.row}>
          <Skeleton width={60} height={20} borderRadius={radius.full} />
          <Skeleton width={28} height={28} borderRadius={radius.full} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.gray200,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  body: {
    padding: 12,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
});
