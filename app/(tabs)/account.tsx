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
      {/* Avatar + nombre */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarWrapper}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {(profile?.full_name ?? email)[0]?.toUpperCase() ?? "?"}
              </Text>
            </View>
          )}
          {profile?.verified_at && (
            <View style={styles.verifyDot}>
              <Text style={styles.verifyDotText}>✓</Text>
            </View>
          )}
        </View>

        <Text style={styles.name}>{profile?.full_name ?? "Sin nombre"}</Text>
        {profile?.username && (
          <Text style={styles.username}>@{profile.username}</Text>
        )}
        {profile?.city && (
          <Text style={styles.city}>📍 {profile.city}</Text>
        )}

        <Pressable style={styles.editProfileBtn} onPress={() => router.push("/profile")}>
          <Text style={styles.editProfileBtnText}>Editar perfil</Text>
        </Pressable>
      </View>

      {/* Acciones */}
      <View style={styles.section}>
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
  profileHeader: {
    backgroundColor: colors.surface,
    borderRadius: radius["2xl"],
    padding: spacing[5],
    alignItems: "center",
    gap: spacing[1],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrapper: {
    marginBottom: spacing[2],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarInitial: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.primary,
  },
  verifyDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.verify,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  verifyDotText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: "700",
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing[1],
  },
  username: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  city: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  editProfileBtn: {
    marginTop: spacing[3],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  editProfileBtnText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
  arrow: {
    fontSize: 22,
    color: colors.textTertiary,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: "hidden",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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
