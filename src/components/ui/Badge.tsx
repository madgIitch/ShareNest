import { View, Text, StyleSheet } from "react-native";

interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "error";
}

const variantStyles = {
  default: { bg: "#F3F4F6", text: "#374151" },
  success: { bg: "#F0FDF4", text: "#15803D" },
  warning: { bg: "#FFFBEB", text: "#B45309" },
  error: { bg: "#FEF2F2", text: "#B91C1C" },
};

export default function Badge({ label, variant = "default" }: BadgeProps) {
  const v = variantStyles[variant];
  return (
    <View style={[styles.wrap, { backgroundColor: v.bg }]}>
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 2 },
  text: { fontSize: 12, fontWeight: "500" },
});
