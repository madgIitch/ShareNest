import { StyleSheet, Text, View } from "react-native";

import { colors, fontSize, radius, spacing } from "../../theme";

type Variant = "default" | "primary" | "success" | "warning" | "error";

const VARIANT_STYLES: Record<Variant, { bg: string; text: string }> = {
  default: { bg: colors.gray100, text: colors.gray700 },
  primary: { bg: colors.primaryLight, text: colors.primary },
  success: { bg: colors.successLight, text: colors.success },
  warning: { bg: colors.warningLight, text: colors.warning },
  error: { bg: colors.errorLight, text: colors.error },
};

type Props = {
  label: string;
  variant?: Variant;
};

export function TagBadge({ label, variant = "default" }: Props) {
  const { bg, text } = VARIANT_STYLES[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: spacing[1],
    alignSelf: "flex-start",
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
});
