import { router } from "expo-router";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { useUpdateNotifPrefs } from "../src/hooks/useNotificationPrefs";
import { useAuth } from "../src/providers/AuthProvider";
import { colors, fontSize, radius, spacing } from "../src/theme";

export default function SettingsScreen() {
  const { session, profile, signOut } = useAuth();
  const updatePrefs = useUpdateNotifPrefs();

  const handleSignOut = async () => {
    Alert.alert("Cerrar sesion", "¿Seguro que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesion",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/login");
        },
      },
    ]);
  };

  const toggle = (key: "notif_messages" | "notif_requests" | "notif_friendz", value: boolean) => {
    updatePrefs.mutate({ [key]: value });
  };

  const email = session?.user?.email ?? "-";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.userCard}>
        <View style={styles.avatarWrap}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{(profile?.full_name ?? email)[0].toUpperCase()}</Text>
            </View>
          )}
          {!!profile?.verified_at && (
            <View style={styles.avatarVerifiedBadge}>
              <Text style={styles.avatarVerifiedBadgeText}>✓</Text>
            </View>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{profile?.full_name ?? "Sin nombre"}</Text>
          <Text style={styles.userEmail}>{email}</Text>
          {!!profile?.verified_at && <Text style={styles.verifiedHint}>Numero verificado</Text>}
        </View>
      </View>

      <Text style={styles.sectionHeader}>Cuenta</Text>
      <View style={styles.section}>
        <Pressable style={styles.row} onPress={() => router.push("/profile")}>
          <Text style={styles.rowLabel}>Editar perfil</Text>
          <Text style={styles.rowArrow}>›</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionHeader}>Notificaciones</Text>
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Mensajes</Text>
            <Text style={styles.rowSubtitle}>Nuevos mensajes en tus chats</Text>
          </View>
          <Switch
            value={profile?.notif_messages ?? true}
            onValueChange={(v) => toggle("notif_messages", v)}
            trackColor={{ true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        <View style={[styles.row, styles.rowBorder]}>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Solicitudes</Text>
            <Text style={styles.rowSubtitle}>Cuando aceptan o deniegan tu solicitud</Text>
          </View>
          <Switch
            value={profile?.notif_requests ?? true}
            onValueChange={(v) => toggle("notif_requests", v)}
            trackColor={{ true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        <View style={[styles.row, styles.rowBorder]}>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Friendz</Text>
            <Text style={styles.rowSubtitle}>Nuevas solicitudes de conexion</Text>
          </View>
          <Switch
            value={profile?.notif_friendz ?? true}
            onValueChange={(v) => toggle("notif_friendz", v)}
            trackColor={{ true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Pressable style={[styles.row, styles.rowCenter]} onPress={handleSignOut}>
          <Text style={styles.rowLabelDanger}>Cerrar sesion</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[5],
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius["2xl"],
    padding: spacing[4],
    marginBottom: spacing[5],
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[4],
  },
  avatarWrap: { width: 84, height: 84 },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: { fontSize: 30, fontWeight: "700", color: colors.primary },
  avatarVerifiedBadge: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.verify,
    borderWidth: 2,
    borderColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarVerifiedBadgeText: { color: colors.white, fontSize: 12, fontWeight: "800" },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  userEmail: { fontSize: fontSize.sm, color: colors.textSecondary },
  verifiedHint: { marginTop: 4, color: colors.verify, fontWeight: "700", fontSize: fontSize.xs },

  sectionHeader: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing[2],
    marginLeft: spacing[1],
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[4],
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3] + 2,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowCenter: { justifyContent: "center" },
  rowContent: { flex: 1, gap: 2 },
  rowLabel: { fontSize: fontSize.md, color: colors.text },
  rowSubtitle: { fontSize: fontSize.xs, color: colors.textSecondary },
  rowArrow: { fontSize: 20, color: colors.textTertiary },
  rowLabelDanger: { fontSize: fontSize.md, color: colors.error, fontWeight: "600" },
});
