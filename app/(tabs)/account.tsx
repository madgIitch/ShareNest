import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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

function cleanlinessLabel(value: number | null | undefined) {
  if (!value) return "-";
  if (value >= 5) return "Muy ordenado";
  if (value >= 4) return "Bastante ordenado";
  if (value === 3) return "Ordenado";
  if (value === 2) return "Algo relajado";
  return "Relajado";
}

function noiseLabel(value: number | null | undefined) {
  if (!value) return "-";
  if (value <= 1) return "Muy tranquilo";
  if (value <= 2) return "Tranquilo";
  if (value === 3) return "Moderado";
  if (value === 4) return "Animado";
  return "Muy animado";
}

function lookingForLabel(value: string | null | undefined) {
  if (value === "room") return "Habitacion";
  if (value === "flat") return "Piso";
  if (value === "both") return "Ambos";
  return "-";
}

function languagesLabel(values: string[] | null | undefined) {
  const count = values?.length ?? 0;
  if (count === 0) return "-";
  return count === 1 ? "1 idioma" : `${count} idiomas`;
}

export default function AccountScreen() {
  const { session, profile } = useAuth();

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
          <Text style={styles.metaText}>{age !== "-" ? `${age} años` : "Edad sin definir"}</Text>
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
          <InfoCell label="Limpieza" value={cleanlinessLabel(profile?.cleanliness)} />
          <InfoCell label="Ruido" value={noiseLabel(profile?.noise_level)} />
          <InfoCell label="Teletrabajo" value={yesNo(profile?.works_from_home)} />
          <InfoCell label="Mascotas" value={yesNo(profile?.has_pets, "Con mascotas", "Sin mascotas")} />
          <InfoCell label="Fuma" value={yesNo(profile?.smokes, "Si", "No")} />
          <InfoCell label="Visitas" value={guestsLabel(profile?.guests_frequency)} />
          <InfoCell label="Idiomas" value={languagesLabel(profile?.languages)} />
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
                ? `${profile?.budget_min ?? "-"} - ${profile?.budget_max ?? "-"} EUR/mes`
                : "No especificado"
            }
          />
          <InfoCell label="Disponible" value={profile?.move_in_date ?? "No especificado"} />
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
          <View style={styles.rowLeft}>
            <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.rowLabel}>Configuracion</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </View>

    </ScrollView>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  const isPlaceholder = value === "-" || value === "No especificado";
  return (
    <View style={styles.infoCell}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, isPlaceholder && styles.infoValuePlaceholder]}>{value}</Text>
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
    backgroundColor: colors.text,
    paddingVertical: spacing[2],
    alignItems: "center",
  },
  editBtnText: { color: colors.white, fontWeight: "700" },
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
  infoValuePlaceholder: { color: colors.textTertiary, fontWeight: "600" },

  block: { marginTop: spacing[2], gap: spacing[1] },
  blockTitle: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: "600" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  chip: {
    borderRadius: radius.full,
    backgroundColor: colors.verifyLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { color: colors.verify, fontSize: 12, fontWeight: "700" },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing[1],
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  rowLabel: { fontSize: fontSize.md, color: colors.text },
  arrow: { fontSize: 24, color: colors.textTertiary },
});
