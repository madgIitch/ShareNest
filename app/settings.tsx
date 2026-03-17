import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { useAuth } from "../src/providers/AuthProvider";

export default function SettingsScreen() {
  const { session, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert("Cerrar sesión", "¿Seguro que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/login");
        },
      },
    ]);
  };

  const email = session?.user?.email ?? "-";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Cabecera de usuario */}
      <View style={styles.userCard}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {(profile?.full_name ?? email)[0].toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{profile?.full_name ?? "Sin nombre"}</Text>
          <Text style={styles.userEmail}>{email}</Text>
          {profile?.verified_at && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>✓ Número verificado</Text>
            </View>
          )}
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.section}>
        <Pressable style={styles.row} onPress={() => router.push("/profile")}>
          <Text style={styles.rowLabel}>Editar perfil</Text>
          <Text style={styles.rowArrow}>›</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Pressable style={[styles.row, styles.rowDanger]} onPress={handleSignOut}>
          <Text style={styles.rowLabelDanger}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f4f6fa",
    flexGrow: 1,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e6e9ef",
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#c7d7f0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f63f1",
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  userEmail: {
    fontSize: 13,
    color: "#6b7280",
  },
  badge: {
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  badgeText: {
    color: "#16a34a",
    fontWeight: "700",
    fontSize: 12,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e6e9ef",
    marginBottom: 12,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  rowDanger: {
    justifyContent: "center",
  },
  rowLabel: {
    fontSize: 16,
    color: "#111827",
  },
  rowArrow: {
    fontSize: 20,
    color: "#9ca3af",
  },
  rowLabelDanger: {
    fontSize: 16,
    color: "#dc2626",
    fontWeight: "600",
  },
});
