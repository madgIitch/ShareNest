import { View, Text } from "react-native";
import { useAuth } from "../../src/hooks/useAuth";
import { useAuthStore } from "../../src/stores/authStore";
import Avatar from "../../src/components/ui/Avatar";
import Button from "../../src/components/ui/Button";

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { user } = useAuthStore();

  return (
    <View className="flex-1 bg-gray-50 pt-16 px-6">
      <View className="items-center mb-8">
        <Avatar size={80} name={user?.email} />
        <Text className="mt-4 text-xl font-bold text-gray-900">
          {user?.email ?? "Usuario"}
        </Text>
      </View>
      <Button title="Cerrar sesión" onPress={signOut} variant="outline" />
    </View>
  );
}
