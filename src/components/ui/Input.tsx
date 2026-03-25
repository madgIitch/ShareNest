import { TextInput, View, Text } from "react-native";

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  error,
  keyboardType = "default",
  autoCapitalize = "sentences",
}: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      )}
      <TextInput
        className={`border rounded-xl px-4 py-3 text-base bg-white ${error ? "border-red-400" : "border-gray-200"}`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
    </View>
  );
}
