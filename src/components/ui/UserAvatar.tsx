import { Image, StyleSheet, Text, View } from "react-native";

import { colors } from "../../theme";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<Size, number> = {
  xs: 28,
  sm: 36,
  md: 48,
  lg: 72,
  xl: 96,
};

const FONT_MAP: Record<Size, number> = {
  xs: 11,
  sm: 13,
  md: 18,
  lg: 26,
  xl: 36,
};

type Props = {
  avatarUrl?: string | null;
  name?: string | null;
  size?: Size;
  verified?: boolean;
};

export function UserAvatar({ avatarUrl, name, size = "md", verified = false }: Props) {
  const dim = SIZE_MAP[size];
  const badgeSize = Math.max(16, Math.round(dim * 0.28));
  const badgeFontSize = Math.max(9, Math.round(dim * 0.16));
  const initial = (name ?? "?")[0].toUpperCase();

  return (
    <View style={{ width: dim, height: dim }}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={[styles.image, { width: dim, height: dim, borderRadius: dim / 2 }]} />
      ) : (
        <View style={[styles.placeholder, { width: dim, height: dim, borderRadius: dim / 2 }]}>
          <Text style={[styles.initial, { fontSize: FONT_MAP[size] }]}>{initial}</Text>
        </View>
      )}

      {verified && (
        <View
          style={[
            styles.badge,
            {
              right: 0,
              bottom: 0,
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
            },
          ]}
        >
          <Text style={[styles.badgeText, { fontSize: badgeFontSize }]}>✓</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.gray200,
  },
  placeholder: {
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  initial: {
    fontWeight: "700",
    color: colors.primary,
  },
  badge: {
    position: "absolute",
    backgroundColor: colors.verify,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    color: colors.white,
    fontWeight: "800",
  },
});
