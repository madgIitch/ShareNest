import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../src/providers/AuthProvider";

export default function HomeScreen() {
  const { session, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sesión activa</Text>
      <Text style={styles.text}>Usuario: {session?.user?.email ?? session?.user?.phone}</Text>
      <Text style={styles.text}>Nombre: {profile?.full_name ?? "-"}</Text>
      <Text style={styles.text}>Username: {profile?.username ?? "-"}</Text>
      <Pressable style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
  },
  button: {
    marginTop: 18,
    backgroundColor: "#e74c3c",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
