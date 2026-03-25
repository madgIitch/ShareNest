import { View, Text } from "react-native";
import { router } from "expo-router";
import Button from "../../src/components/ui/Button";

export default function OnboardingScreen() {
  return (
    <View className="flex-1 bg-white justify-center px-6">
      <Text className="text-3xl font-bold text-gray-900 mb-4">
        Bienvenido a HomiMatch
      </Text>
      <Text className="text-gray-500 mb-8">
        El marketplace de habitaciones con componente social.
        Encuentra habitaciones con amigos en común.
      </Text>
      <Button title="Empezar" onPress={() => router.replace("/(tabs)")} />
    </View>
  );
}
