import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
  loading?: boolean;
}

export default function Button({ title, onPress, variant = "primary", disabled, loading }: ButtonProps) {
  const btnStyle = [
    styles.base,
    variant === "primary" ? styles.primary : variant === "outline" ? styles.outline : styles.secondary,
    (disabled || loading) && styles.disabled,
  ];

  return (
    <TouchableOpacity style={btnStyle} onPress={onPress} disabled={disabled || loading}>
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? "#6366F1" : "white"} />
      ) : (
        <Text style={[styles.text, variant === "outline" ? styles.textOutline : styles.textSolid]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  primary: { backgroundColor: "#6366F1" },
  outline: { borderWidth: 1, borderColor: "#6366F1", backgroundColor: "transparent" },
  secondary: { backgroundColor: "#FBBF24" },
  disabled: { opacity: 0.5 },
  text: { fontWeight: "600", fontSize: 16 },
  textSolid: { color: "#fff" },
  textOutline: { color: "#6366F1" },
});
