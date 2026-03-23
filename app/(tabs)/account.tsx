import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "../../src/components/ui/UserAvatar";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, fontSize, radius, spacing } from "../../src/theme";

function yesNo(value: boolean | null | undefined, yes = "Si", no = "No") {
  if (value == null) return "-";
  return value ? yes : no;
}

function scheduleLabel(value: string | null | undefined) {
  if (value === "madrugador") return "Madrugador";
  if (value === "nocturno") return "Nocturno";
  if (value === "flexible") return "Flexible";
  return "-";
}

function guestsLabel(value: string | null | undefined) {
  if (value === "nunca") return "Nunca";
  if (value === "a veces") return "A veces";
  if (value === "frecuente") return "Frecuente";
  return "-";
}

function lookingForLabel(value: string | null | undefined) {
  if (value === "room") return "Habitacion";
  if (value === "flat") return "Piso";
  if (value === "both") return "Ambos";
  return "-";
}

export default function AccountScreen() {
  const { session, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const birthYear = profile?.birth_year;
  const age = birthYear ? String(new Date().getFullYear() - birthYear) : "-";
  const userId = session?.user?.id;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <UserAvatar
          avatarUrl={profile?.avatar_url}
          name={profile?.full_name ?? profile?.username ?? "Usuario"}
          size="xl"
          verified={!!profile?.verified_at}
        />
        <Text style={styles.name}>{profile?.full_name ?? "Sin nombre"}</Text>
        {!!profile?.username && <Text style={styles.username}>@{profile.username}</Text>}

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{age !== "-" ? `${age} anos` : "Edad sin definir"}</Text>
          {!!profile?.occupation && <Text style={styles.metaText}>· {profile.occupation}</Text>}
          {!!profile?.city && <Text style={styles.metaText}>· {profile.city}</Text>}
        </View>

        <View style={styles.headerActions}>
          <Pressable style={styles.editBtn} onPress={() => router.push("/profile")}>
            <Text style={styles.editBtnText}>Editar perfil</Text>
          </Pressable>
          {!!userId && (
            <Pressable style={styles.secondaryBtn} onPress={() => router.push(`/profile/${userId}`)}>
              <Text style={styles.secondaryBtnText}>Ver perfil publico</Text>
            </Pressable>
          )}
        </View>
      </View>

      {!!profile?.bio && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sobre mi</Text>
          <Text style={styles.bodyText}>{profile.bio}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Estilo de vida</Text>
        <View style={styles.grid}>
          <InfoCell label="Horario" value={scheduleLabel(profile?.schedule)} />
          <InfoCell label="Limpieza" value={profile?.cleanliness ? `${profile.cleanliness}/5` : "-"} />
          <InfoCell label="Ruido" value={profile?.noise_level ? `${profile.noise_level}/5` : "-"} />
          <InfoCell label="Teletrabajo" value={yesNo(profile?.works_from_home)} />
          <InfoCell label="Mascotas" value={yesNo(profile?.has_pets, "Con mascotas", "Sin mascotas")} />
          <InfoCell label="Fuma" value={yesNo(profile?.smokes, "Si", "No")} />
          <InfoCell label="Visitas" value={guestsLabel(profile?.guests_frequency)} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Busqueda</Text>
        <View style={styles.grid}>
          <InfoCell label="Busco" value={lookingForLabel(profile?.looking_for)} />
          <InfoCell
            label="Presupuesto"
            value={
              profile?.budget_min || profile?.budget_max
                ? `${profile?.budget_min ?? "-"} - ${profile?.budget_max ?? "-"} €/mes`
                : "-"
            }
          />
          <InfoCell label="Disponible" value={profile?.move_in_date ?? "-"} />
        </View>

        {!!profile?.preferred_cities?.length && (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Ciudades preferidas</Text>
            <View style={styles.chipsWrap}>
              {profile.preferred_cities.map((city) => (
                <View key={city} style={styles.chip}>
                  <Text style={styles.chipText}>{city}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {!!profile?.languages?.length && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Idiomas</Text>
          <View style={styles.chipsWrap}>
            {profile.languages.map((lang) => (
              <View key={lang} style={styles.chip}>
                <Text style={styles.chipText}>{lang.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Pressable style={styles.row} onPress={() => router.push("/settings")}>
          <Text style={styles.rowLabel}>Configuracion</Text>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Pressable style={styles.row} onPress={handleSignOut}>
          <Text style={styles.rowLabelDanger}>Cerrar sesion</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoCell}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
    backgroundColor: colors.background,
    flexGrow: 1,
    gap: spacing[3],
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    alignItems: "center",
    gap: spacing[1],
  },
  name: { fontSize: fontSize.xl, fontWeight: "800", color: colors.text, marginTop: spacing[1] },
  username: { fontSize: fontSize.sm, color: colors.textSecondary },
  metaRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 4 },
  metaText: { fontSize: fontSize.sm, color: colors.textSecondary },
  headerActions: { width: "100%", gap: spacing[2], marginTop: spacing[3] },
  editBtn: {
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: spacing[2],
    alignItems: "center",
  },
  editBtnText: { color: colors.primary, fontWeight: "700" },
  secondaryBtn: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing[2],
    alignItems: "center",
  },
  secondaryBtnText: { color: colors.textSecondary, fontWeight: "600" },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    gap: spacing[2],
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bodyText: { fontSize: fontSize.md, color: colors.text, lineHeight: 22 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  infoCell: {
    width: "48%",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.gray50,
    padding: spacing[2],
  },
  infoLabel: { fontSize: fontSize.xs, color: colors.textTertiary, fontWeight: "600" },
  infoValue: { fontSize: fontSize.sm, color: colors.text, fontWeight: "700", marginTop: 2 },

  block: { marginTop: spacing[2], gap: spacing[1] },
  blockTitle: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: "600" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  chip: {
    borderRadius: radius.full,
    backgroundColor: colors.verifyLight,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
  },
  chipText: { color: colors.verify, fontSize: fontSize.xs, fontWeight: "700" },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing[1],
  },
  rowLabel: { fontSize: fontSize.md, color: colors.text },
  arrow: { fontSize: 24, color: colors.textTertiary },
  rowLabelDanger: {
    fontSize: fontSize.md,
    color: colors.error,
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },
});
