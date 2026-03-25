import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "../../src/hooks/useAuth";
import { useAuthStore } from "../../src/stores/authStore";
import Avatar from "../../src/components/ui/Avatar";
import Button from "../../src/components/ui/Button";

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { user } = useAuthStore();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar size={80} name={user?.email} />
        <Text style={styles.name}>{user?.email ?? "Usuario"}</Text>
      </View>
      <Button title="Cerrar sesión" onPress={signOut} variant="outline" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", paddingTop: 64, paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 32 },
  name: { marginTop: 16, fontSize: 20, fontWeight: "700", color: "#111827" },
});
