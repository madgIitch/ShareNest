import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function SeekerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View className="flex-1 bg-white justify-center items-center">
      <Text>Buscador {id}</Text>
    </View>
  );
}
