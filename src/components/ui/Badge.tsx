import { View, Text } from "react-native";

interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "error";
}

export default function Badge({ label, variant = "default" }: BadgeProps) {
  const variantClass = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    error: "bg-red-100 text-red-700",
  }[variant];

  return (
    <View className={`rounded-full px-2 py-0.5 ${variantClass.split(" ")[0]}`}>
      <Text className={`text-xs font-medium ${variantClass.split(" ")[1]}`}>
        {label}
      </Text>
    </View>
  );
}
