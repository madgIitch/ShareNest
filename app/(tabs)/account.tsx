import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { UserAvatar } from "../../src/components/ui/UserAvatar";
import {
  useMyFriendz,
  usePendingReceived,
  usePendingSent,
  useRespondConnection,
  useSearchUsers,
} from "../../src/hooks/useConnections";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, fontSize, radius, spacing } from "../../src/theme";

type ProfileTab = "profile" | "friendz" | "settings";
type FriendzTab = "friendz" | "received" | "sent" | "search";

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

function capitalizeWords(value: string | null | undefined) {
  if (!value) return "";
  return value
    .trim()
    .split(/\s+/)
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : ""))
    .join(" ");
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
}

export default function AccountScreen() {
  const { session, profile } = useAuth();
  const [tab, setTab] = useState<ProfileTab>("profile");
  const [friendzTab, setFriendzTab] = useState<FriendzTab>("friendz");
  const [searchQuery, setSearchQuery] = useState("");

  const userId = session?.user?.id;
  const birthYear = profile?.birth_year;
  const age = birthYear ? String(new Date().getFullYear() - birthYear) : "-";

  const { data: friendz = [] } = useMyFriendz(userId);
  const { data: received = [] } = usePendingReceived(userId);
  const { data: sent = [] } = usePendingSent(userId);
  const { data: searchResults = [] } = useSearchUsers(searchQuery);
  const respondConnection = useRespondConnection();

  const tabs = useMemo(
    () => [
      { key: "profile" as const, label: "Mi perfil" },
      { key: "friendz" as const, label: "Friendz", badge: received.length || undefined },
      { key: "settings" as const, label: "Configuracion" },
    ],
    [received.length],
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topTabs}>
        {tabs.map((item) => (
          <Pressable
            key={item.key}
            style={[styles.topTab, tab === item.key && styles.topTabActive]}
            onPress={() => setTab(item.key)}
          >
            <Text style={[styles.topTabText, tab === item.key && styles.topTabTextActive]}>{item.label}</Text>
            {item.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>

      {tab === "profile" ? (
        <>
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
              {!!profile?.occupation && <Text style={styles.metaText}>- {profile.occupation}</Text>}
              {!!profile?.city && <Text style={styles.metaText}>- {profile.city}</Text>}
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
              <InfoCell label="Fuma" value={yesNo(profile?.smokes)} />
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
                    ? `${profile?.budget_min ?? "-"} - ${profile?.budget_max ?? "-"} EUR/mes`
                    : "No especificado"
                }
              />
              <InfoCell label="Disponible" value={profile?.move_in_date ?? "No especificado"} />
            </View>
          </View>
        </>
      ) : null}

      {tab === "friendz" ? (
        <View style={styles.card}>
          <View style={styles.friendzTabRow}>
            <MiniTab
              label="Friendz"
              active={friendzTab === "friendz"}
              onPress={() => setFriendzTab("friendz")}
            />
            <MiniTab
              label={`Recibidas${received.length ? ` (${received.length})` : ""}`}
              active={friendzTab === "received"}
              onPress={() => setFriendzTab("received")}
            />
            <MiniTab
              label="Enviadas"
              active={friendzTab === "sent"}
              onPress={() => setFriendzTab("sent")}
            />
            <MiniTab
              label="Buscar"
              active={friendzTab === "search"}
              onPress={() => setFriendzTab("search")}
            />
          </View>

          {friendzTab === "friendz" &&
            (friendz.length ? (
              <View style={styles.list}>
                {friendz.slice(0, 8).map((item) => (
                  <Pressable key={item.connectionId} style={styles.listRow} onPress={() => router.push(`/profile/${item.id}`)}>
                    <UserAvatar
                      avatarUrl={item.avatar_url}
                      name={item.full_name ?? item.username ?? "Usuario"}
                      size="md"
                      verified={!!item.verified_at}
                    />
                    <View style={styles.listRowBody}>
                      <Text style={styles.listRowTitle}>{capitalizeWords(item.full_name ?? item.username ?? "Usuario")}</Text>
                      <Text style={styles.listRowSub}>{item.city ?? "Sin ciudad"}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.empty}>Todavia no tienes friendz.</Text>
            ))}

          {friendzTab === "received" &&
            (received.length ? (
              <View style={styles.list}>
                {received.slice(0, 8).map((item) => (
                  <View key={item.id} style={styles.listRow}>
                    <Pressable style={styles.listRowMain} onPress={() => router.push(`/profile/${item.requester.id}`)}>
                      <UserAvatar
                        avatarUrl={item.requester.avatar_url}
                        name={item.requester.full_name ?? item.requester.username ?? "Usuario"}
                        size="md"
                        verified={!!item.requester.verified_at}
                      />
                      <View style={styles.listRowBody}>
                        <Text style={styles.listRowTitle}>
                          {capitalizeWords(item.requester.full_name ?? item.requester.username ?? "Usuario")}
                        </Text>
                        <Text style={styles.listRowSub}>Recibida {formatRelativeDate(item.created_at)}</Text>
                      </View>
                    </Pressable>
                    <View style={styles.rowActions}>
                      <Pressable
                        style={[styles.iconAction, styles.iconApprove]}
                        disabled={respondConnection.isPending || !userId}
                        onPress={() =>
                          userId &&
                          respondConnection.mutate({
                            connectionId: item.id,
                            accept: true,
                            myId: userId,
                            otherId: item.requester.id,
                          })
                        }
                      >
                        <Ionicons name="checkmark" size={16} color={colors.primaryDark} />
                      </Pressable>
                      <Pressable
                        style={[styles.iconAction, styles.iconReject]}
                        disabled={respondConnection.isPending || !userId}
                        onPress={() =>
                          userId &&
                          respondConnection.mutate({
                            connectionId: item.id,
                            accept: false,
                            myId: userId,
                            otherId: item.requester.id,
                          })
                        }
                      >
                        <Ionicons name="close" size={16} color={colors.error} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.empty}>No tienes solicitudes pendientes.</Text>
            ))}

          {friendzTab === "sent" &&
            (sent.length ? (
              <View style={styles.list}>
                {sent.slice(0, 8).map((item) => (
                  <Pressable key={item.id} style={styles.listRow} onPress={() => router.push(`/profile/${item.addressee.id}`)}>
                    <UserAvatar
                      avatarUrl={item.addressee.avatar_url}
                      name={item.addressee.full_name ?? item.addressee.username ?? "Usuario"}
                      size="md"
                      verified={!!item.addressee.verified_at}
                    />
                    <View style={styles.listRowBody}>
                      <Text style={styles.listRowTitle}>
                        {capitalizeWords(item.addressee.full_name ?? item.addressee.username ?? "Usuario")}
                      </Text>
                      <Text style={styles.listRowSub}>Enviada {formatRelativeDate(item.created_at)}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.empty}>No tienes solicitudes enviadas.</Text>
            ))}

          {friendzTab === "search" ? (
            <View style={styles.searchBlock}>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar por nombre o usuario"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.searchInput}
              />
              {searchQuery.trim().length < 2 ? (
                <Text style={styles.empty}>Escribe al menos 2 letras.</Text>
              ) : searchResults.length === 0 ? (
                <Text style={styles.empty}>No se encontraron usuarios.</Text>
              ) : (
                <View style={styles.list}>
                  {searchResults.slice(0, 8).map((item) => (
                    <Pressable key={item.id} style={styles.listRow} onPress={() => router.push(`/profile/${item.id}`)}>
                      <UserAvatar
                        avatarUrl={item.avatar_url}
                        name={item.full_name ?? item.username ?? "Usuario"}
                        size="md"
                        verified={!!item.verified_at}
                      />
                      <View style={styles.listRowBody}>
                        <Text style={styles.listRowTitle}>{capitalizeWords(item.full_name ?? item.username ?? "Usuario")}</Text>
                        <Text style={styles.listRowSub}>{item.username ? `@${item.username}` : item.city ?? "Sin ciudad"}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ) : null}

          <Pressable style={styles.secondaryBtn} onPress={() => router.push("/(tabs)/friendz")}>
            <Text style={styles.secondaryBtnText}>Abrir Friendz completo</Text>
          </Pressable>
        </View>
      ) : null}

      {tab === "settings" ? (
        <View style={styles.card}>
          <Pressable style={styles.settingRow} onPress={() => router.push("/settings")}>
            <View style={styles.settingLeft}>
              <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.settingText}>Preferencias y notificaciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>

          <Pressable style={styles.settingRow} onPress={() => router.push("/settings")}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.settingText}>Privacidad y seguridad</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>

        </View>
      ) : null}
    </ScrollView>
  );
}

function MiniTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.miniTab, active && styles.miniTabActive]} onPress={onPress}>
      <Text style={[styles.miniTabText, active && styles.miniTabTextActive]}>{label}</Text>
    </Pressable>
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
  topTabs: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
  },
  topTab: {
    flex: 1,
    minHeight: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing[1],
  },
  topTabActive: { backgroundColor: colors.text },
  topTabText: { color: colors.textSecondary, fontWeight: "700", fontSize: fontSize.xs },
  topTabTextActive: { color: colors.white },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.error,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: "700" },

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

  friendzTabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  miniTab: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  miniTabActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  miniTabText: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  miniTabTextActive: { color: colors.white },
  list: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[3],
    backgroundColor: colors.gray50,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  listRowMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    flex: 1,
  },
  listRowBody: { flex: 1, gap: 2 },
  listRowTitle: { fontSize: fontSize.sm, color: colors.text, fontWeight: "700" },
  listRowSub: { fontSize: fontSize.xs, color: colors.textSecondary },
  rowActions: { flexDirection: "row", gap: spacing[2] },
  iconAction: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  iconApprove: { backgroundColor: colors.primaryLight },
  iconReject: { backgroundColor: colors.error + "1A" },
  searchBlock: { gap: spacing[2] },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: fontSize.sm,
    color: colors.text,
    backgroundColor: colors.gray50,
  },
  empty: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontStyle: "italic",
    paddingVertical: spacing[1],
  },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    backgroundColor: colors.gray50,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  settingText: { color: colors.text, fontSize: fontSize.sm, fontWeight: "600" },
});
