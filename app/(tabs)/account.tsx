import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { useAuth } from "../../src/providers/AuthProvider";
import { colors, fontSize, radius, spacing } from "../../src/theme";

export default function AccountScreen() {
  const { session, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const email = session?.user?.email ?? "";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Tarjeta de perfil */}
      <Pressable style={styles.profileCard} onPress={() => router.push("/profile")}>
        <View style={styles.profileLeft}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {(profile?.full_name ?? email)[0]?.toUpperCase() ?? "?"}
              </Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {profile?.full_name ?? "Sin nombre"}
            </Text>
            {profile?.username && (
              <Text style={styles.username}>@{profile.username}</Text>
            )}
            {profile?.city && (
              <Text style={styles.city}>📍 {profile.city}</Text>
            )}
            {profile?.verified_at && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>✓ Verificado</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>

      {/* Acciones */}
      <View style={styles.section}>
        <Pressable style={styles.row} onPress={() => router.push("/profile")}>
          <Text style={styles.rowLabel}>Editar perfil</Text>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable style={styles.row} onPress={() => router.push("/settings")}>
          <Text style={styles.rowLabel}>Configuración</Text>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable style={styles.row} onPress={() => router.push("/components-demo")}>
          <Text style={styles.rowLabel}>UI Components Demo</Text>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Pressable style={styles.row} onPress={handleSignOut}>
          <Text style={styles.rowLabelDanger}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
    backgroundColor: colors.background,
    flexGrow: 1,
    gap: spacing[3],
  },
  profileCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primary,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
  },
  username: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  city: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  badge: {
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: colors.successLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.success,
    fontWeight: "700",
    fontSize: fontSize.xs,
  },
  arrow: {
    fontSize: 22,
    color: colors.textTertiary,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing[4],
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  rowLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  rowLabelDanger: {
    fontSize: fontSize.md,
    color: colors.error,
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },
});
