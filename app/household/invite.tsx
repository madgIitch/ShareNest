import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "../../src/components/ui/UserAvatar";
import { useHouseholdInvite, useHouseholdMembers, useMyHousehold } from "../../src/hooks/useHousehold";
import { colors, fontSize, radius, spacing } from "../../src/theme";

export default function HouseholdInviteScreen() {
  const params = useLocalSearchParams<{ householdId?: string }>();
  const { data: myHousehold, isLoading: loadingMine } = useMyHousehold();
  const householdId = useMemo(
    () => (typeof params.householdId === "string" ? params.householdId : myHousehold?.id),
    [params.householdId, myHousehold?.id],
  );

  const { data: inviteData, isLoading: loadingInvite } = useHouseholdInvite(householdId);
  const { data: members = [], isLoading: loadingMembers } = useHouseholdMembers(householdId);

  const handleShareCode = async () => {
    if (!inviteData?.invite_code) return;
    const text = `Codigo de invitacion al piso "${inviteData.household_name}": ${inviteData.invite_code}`;
    try {
      await Share.share({ message: text });
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    }
  };

  if (loadingMine || loadingInvite || loadingMembers) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!householdId || !inviteData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Codigo de invitacion</Text>
        <Text style={styles.subtitle}>No hay household activo para compartir codigo.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.replace("/(tabs)/workspace")}>
          <Text style={styles.primaryBtnText}>Volver a Mi espacio</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>Atras</Text>
        </Pressable>
        <Text style={styles.title}>Codigo de invitacion</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.subtitle}>
        Comparte este codigo con tus companeros. Al introducirlo en su app se uniran directamente al household.
      </Text>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Codigo del piso - {inviteData.household_name}</Text>
        <Text style={styles.code}>{inviteData.invite_code}</Text>
        <Text style={styles.codeHelp}>Uso directo por codigo. Sin solicitud previa.</Text>

        <Pressable style={styles.primaryBtn} onPress={handleShareCode}>
          <Text style={styles.primaryBtnText}>Compartir codigo</Text>
        </Pressable>
      </View>

      <View style={styles.membersBlock}>
        <Text style={styles.membersTitle}>Miembros actuales</Text>
        {members.map((m) => (
          <View key={m.user_id} style={styles.memberRow}>
            <UserAvatar
              avatarUrl={m.profiles?.avatar_url}
              name={m.profiles?.full_name ?? m.profiles?.username ?? "Usuario"}
              size="sm"
            />
            <Text style={styles.memberName}>{m.profiles?.full_name ?? m.profiles?.username ?? "Usuario"}</Text>
            <View style={[styles.roleBadge, m.role === "admin" ? styles.roleAdmin : styles.roleMember]}>
              <Text style={[styles.roleText, m.role === "admin" ? styles.roleAdminText : styles.roleMemberText]}>
                {m.role === "admin" ? "Admin" : "Miembro"}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.warningBox}>
        <Ionicons name="warning-outline" size={16} color={colors.warning} />
        <Text style={styles.warningText}>
          Al entrar con codigo se salta el proceso de matching. Usalo solo con personas de confianza.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
    backgroundColor: colors.background,
    gap: spacing[3],
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[5],
    gap: spacing[2],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: { color: colors.verify, fontWeight: "700", fontSize: fontSize.sm },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: "800" },
  subtitle: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },

  codeCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing[4],
    gap: spacing[2],
  },
  codeLabel: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: "600" },
  code: {
    color: colors.text,
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: 8,
    textAlign: "center",
  },
  codeHelp: { color: colors.textTertiary, fontSize: fontSize.xs, textAlign: "center" },
  primaryBtn: {
    backgroundColor: colors.text,
    borderRadius: radius.full,
    paddingVertical: spacing[3],
    alignItems: "center",
  },
  primaryBtnText: { color: colors.white, fontWeight: "700", fontSize: fontSize.sm },

  membersBlock: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing[3],
    gap: spacing[2],
  },
  membersTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: "700" },
  memberRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  memberName: { flex: 1, color: colors.text, fontSize: fontSize.sm, fontWeight: "600" },
  roleBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
  },
  roleAdmin: { backgroundColor: colors.primaryLight },
  roleMember: { backgroundColor: colors.gray100 },
  roleText: { fontSize: fontSize.xs, fontWeight: "700" },
  roleAdminText: { color: colors.primaryDark },
  roleMemberText: { color: colors.textSecondary },

  warningBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warning + "55",
    backgroundColor: colors.warningLight,
    padding: spacing[3],
    flexDirection: "row",
    gap: spacing[2],
  },
  warningText: { flex: 1, color: colors.warning, fontSize: fontSize.xs, lineHeight: 18 },
});

