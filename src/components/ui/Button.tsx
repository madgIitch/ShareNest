import { TouchableOpacity, Text, ActivityIndicator } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
}: ButtonProps) {
  const baseClass = "rounded-xl px-4 py-3 items-center justify-center";
  const variantClass =
    variant === "primary"
      ? "bg-indigo-500"
      : variant === "outline"
        ? "border border-indigo-500 bg-transparent"
        : "bg-amber-400";

  return (
    <TouchableOpacity
      className={`${baseClass} ${variantClass} ${disabled || loading ? "opacity-50" : ""}`}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? "#6366F1" : "white"} />
      ) : (
        <Text
          className={`font-semibold text-base ${variant === "outline" ? "text-indigo-500" : "text-white"}`}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
