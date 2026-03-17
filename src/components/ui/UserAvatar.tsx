import { Image, StyleSheet, Text, View } from "react-native";

import { colors, radius } from "../../theme";

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
  const initial = (name ?? "?")[0].toUpperCase();

  return (
    <View style={{ width: dim, height: dim }}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[styles.image, { width: dim, height: dim, borderRadius: dim / 2 }]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: dim, height: dim, borderRadius: dim / 2 },
          ]}
        >
          <Text style={[styles.initial, { fontSize: FONT_MAP[size] }]}>{initial}</Text>
        </View>
      )}
      {verified && (
        <View style={[styles.badge, { right: -2, bottom: -2 }]}>
          <Text style={styles.badgeText}>✓</Text>
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
    borderRadius: radius.full,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  badgeText: {
    fontSize: 8,
    color: colors.white,
    fontWeight: "700",
  },
});
