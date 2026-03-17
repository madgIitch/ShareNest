import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useProfile } from "../../src/hooks/useProfile";

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: profile, isLoading, isError } = useProfile(id);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1f63f1" />
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No se pudo cargar el perfil.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {(profile.full_name ?? profile.username ?? "?")[0].toUpperCase()}
            </Text>
          </View>
        )}

        {profile.verified_at && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✓ Verificado</Text>
          </View>
        )}
      </View>

      {/* Nombre y username */}
      <Text style={styles.fullName}>{profile.full_name ?? "Sin nombre"}</Text>
      {profile.username && <Text style={styles.username}>@{profile.username}</Text>}

      {/* Ciudad */}
      {profile.city && (
        <View style={styles.row}>
          <Text style={styles.rowIcon}>📍</Text>
          <Text style={styles.rowText}>{profile.city}</Text>
        </View>
      )}

      {/* Bio */}
      {profile.bio && (
        <View style={styles.bioCard}>
          <Text style={styles.bioText}>{profile.bio}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f6fa",
  },
  errorText: {
    color: "#6b7280",
    fontSize: 15,
  },
  container: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#f4f6fa",
    flexGrow: 1,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#c7d7f0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 38,
    fontWeight: "700",
    color: "#1f63f1",
  },
  badge: {
    marginTop: 8,
    backgroundColor: "#dcfce7",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: "#16a34a",
    fontWeight: "700",
    fontSize: 13,
  },
  fullName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    textAlign: "center",
  },
  username: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  rowIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  rowText: {
    fontSize: 15,
    color: "#374151",
  },
  bioCard: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: "#e6e9ef",
  },
  bioText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
});
