import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";

import { BalanceCard } from "../../src/components/expenses/BalanceCard";
import { ExpenseItem } from "../../src/components/expenses/ExpenseItem";
import { UserAvatar } from "../../src/components/ui/UserAvatar";
import { useBalances, useExpenses } from "../../src/hooks/useExpenses";
import {
  useHouseholdById,
  useHouseholdMembers,
  useMyHousehold,
  useMyHouseholdMemberships,
  useOwnedHouseholds,
} from "../../src/hooks/useHousehold";
import { useMyListings } from "../../src/hooks/useListings";
import { useMyProperties } from "../../src/hooks/useProperties";
import { ACTIVE_REQUEST_STATUSES, useReceivedRequests, useSentRequests } from "../../src/hooks/useRequests";
import { useAuth } from "../../src/providers/AuthProvider";
import { requestHouseholdAddExpense } from "../../src/state/householdIntents";
import { colors, fontSize, radius, spacing } from "../../src/theme";

type WorkspaceTab = "seeking" | "owner" | "household";

const FREE_PLAN_SLOTS = 3;

function isActiveRequest(status: string) {
  return ACTIVE_REQUEST_STATUSES.includes(status as (typeof ACTIVE_REQUEST_STATUSES)[number]);
}

function formatMonth(ym: string) {
  const [year, month] = ym.split("-");
  const names = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return `${names[Math.max(0, Math.min(11, Number(month) - 1))]} ${year}`;
}

function statusPill(status: string) {
  if (status === "accepted") return { label: "Aceptada", style: styles.pillAccepted };
  if (status === "offered") return { label: "Oferta", style: styles.pillOffered };
  if (status === "invited") return { label: "Chat activo", style: styles.pillInvited };
  if (status === "pending") return { label: "Pendiente", style: styles.pillPending };
  return { label: status, style: styles.pillDefault };
}

export default function WorkspaceScreen() {
  const { session } = useAuth();
  const myId = session?.user?.id;

  const { data: sent = [] } = useSentRequests(myId);
  const { data: received = [] } = useReceivedRequests(myId);
  const { data: listings = [] } = useMyListings(myId);
  const { data: properties = [] } = useMyProperties(myId);
  const { data: myHousehold } = useMyHousehold();
  const { data: memberships = [] } = useMyHouseholdMemberships(myId);
  const { data: ownedHouseholds = [] } = useOwnedHouseholds(myId);

  const sentActive = sent.filter((r) => isActiveRequest(r.status));
  const pendingReceived = received.filter((r) => r.status === "pending");

  const ownerHouseholdIds = Array.from(
    new Set(properties.map((p) => p.household_id).filter((v): v is string => !!v)),
  );
  const memberHouseholdIds = Array.from(
    new Set(memberships.map((m) => m.household_id).filter((v): v is string => !!v)),
  );
  const householdIds = Array.from(
    new Set([
      ...(myHousehold?.id ? [myHousehold.id] : []),
      ...ownerHouseholdIds,
      ...memberHouseholdIds,
      ...ownedHouseholds.map((h) => h.id),
    ]),
  );
  const defaultHouseholdId = householdIds[0] ?? null;
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(defaultHouseholdId);
  const defaultPropertyId = properties[0]?.id ?? null;
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(defaultPropertyId);

  useEffect(() => {
    if (!selectedHouseholdId || !householdIds.includes(selectedHouseholdId)) {
      setSelectedHouseholdId(defaultHouseholdId);
    }
  }, [defaultHouseholdId, householdIds, selectedHouseholdId]);
  useEffect(() => {
    const ids = properties.map((p) => p.id);
    if (!selectedPropertyId || !ids.includes(selectedPropertyId)) {
      setSelectedPropertyId(defaultPropertyId);
    }
  }, [defaultPropertyId, properties, selectedPropertyId]);

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId) ?? properties[0] ?? null;
  const ownerHouseholdId = selectedProperty?.household_id ?? null;
  const activeProperty =
    properties.find((p) => p.household_id === selectedHouseholdId) ?? selectedProperty ?? properties[0] ?? null;

  const { data: ownerHousehold } = useHouseholdById(ownerHouseholdId ?? undefined);
  const { data: activeHousehold } = useHouseholdById(selectedHouseholdId ?? undefined);
  const { data: members = [] } = useHouseholdMembers(selectedHouseholdId ?? undefined);
  const { data: balancesData } = useBalances(selectedHouseholdId ?? undefined);
  const { data: expenses = [] } = useExpenses(selectedHouseholdId ?? undefined);

  const hasSeekingTab = sent.length > 0;
  const hasOwnerTab = listings.length > 0 || properties.length > 0 || ownedHouseholds.length > 0;
  const hasHouseholdTab = householdIds.length > 0;

  const tabs = useMemo(() => {
    const out: Array<{ key: WorkspaceTab; label: string }> = [];
    if (hasSeekingTab) out.push({ key: "seeking", label: "Buscando" });
    if (hasOwnerTab) out.push({ key: "owner", label: "Mis pisos" });
    if (hasHouseholdTab) out.push({ key: "household", label: "Mi piso" });
    if (out.length === 0) out.push({ key: "seeking", label: "Buscando" });
    return out;
  }, [hasHouseholdTab, hasOwnerTab, hasSeekingTab]);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(tabs[0].key);
  useEffect(() => {
    if (!tabs.some((t) => t.key === activeTab)) {
      setActiveTab(tabs[0].key);
    }
  }, [activeTab, tabs]);

  const monthExpenses = useMemo(() => {
    const grouped: Record<string, typeof expenses> = {};
    for (const e of expenses) {
      const key = e.date.slice(0, 7);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    }
    return grouped;
  }, [expenses]);

  const pendingByListing = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of pendingReceived) {
      map.set(r.listing_id, (map.get(r.listing_id) ?? 0) + 1);
    }
    return map;
  }, [pendingReceived]);

  const listingsForProperty = useMemo(() => {
    if (!selectedProperty) return listings;
    const withProperty = listings.filter((l) => l.property_id === selectedProperty.id);
    if (withProperty.length > 0) return withProperty;
    if (properties.length === 1) return listings;
    return [];
  }, [listings, properties.length, selectedProperty]);

  const occupied = listingsForProperty.filter((l) => l.status === "rented").length;
  const free = listingsForProperty.filter((l) => l.status === "active").length;
  const pendingForProperty = listingsForProperty.reduce((sum, l) => sum + (pendingByListing.get(l.id) ?? 0), 0);
  const ownerIsMemberOfSelectedHousehold = !!ownerHouseholdId && memberships.some((m) => m.household_id === ownerHouseholdId);

  const handleOpenInvite = () => {
    if (!selectedHouseholdId) {
      Alert.alert("Sin household", "Primero unete al piso o crea household para generar codigo.");
      return;
    }
    router.push({ pathname: "/household/invite", params: { householdId: selectedHouseholdId } });
  };
  const handleShareCode = async (code: string | undefined | null) => {
    if (!code) {
      Alert.alert("Sin codigo", "Este piso aun no tiene codigo de invitacion.");
      return;
    }
    await Share.share({ message: `Unete a mi piso en ShareNest con este codigo: ${code}` });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mi espacio</Text>

      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      {activeTab === "seeking" ? (
        <View style={styles.block}>
          <Text style={styles.helper}>
            Tienes {sentActive.length} solicitudes activas - limite del plan free.
          </Text>

          {sentActive.slice(0, 4).map((r) => {
            const pill = statusPill(r.status);
            return (
              <Pressable key={r.id} style={styles.requestCard} onPress={() => router.push(`/requests/${r.id}`)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.requestTitle}>{r.listing?.title ?? "Anuncio"}</Text>
                  <Text style={styles.requestMeta}>{r.listing?.city ?? "Ciudad"} - {r.listing?.price ?? "-"} EUR/mes</Text>
                </View>
                <Text style={[styles.pill, pill.style]}>{pill.label}</Text>
              </Pressable>
            );
          })}

          {sentActive.length < FREE_PLAN_SLOTS && (
            <Pressable style={styles.slotCard} onPress={() => router.push("/(tabs)/explore")}>
              <Text style={styles.slotPlus}>+</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.slotTitle}>Slot disponible</Text>
                <Text style={styles.slotSub}>Explora mas pisos</Text>
              </View>
            </Pressable>
          )}

          {sent.length === 0 && (
            <Text style={styles.empty}>Todavia no has enviado solicitudes. Explora y envia tu primera solicitud.</Text>
          )}

          <Text style={styles.planText}>
            {Math.min(FREE_PLAN_SLOTS, sent.length)} de {FREE_PLAN_SLOTS} slots - Solicitudes ilimitadas con Superfriendz
          </Text>
        </View>
      ) : null}

      {activeTab === "owner" ? (
        <View style={styles.block}>
          {properties.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorRow}>
              {properties.map((p) => {
                const active = p.id === selectedProperty?.id;
                return (
                  <Pressable
                    key={p.id}
                    style={[styles.selectorChip, active && styles.selectorChipActive]}
                    onPress={() => setSelectedPropertyId(p.id)}
                  >
                    <Text style={[styles.selectorChipText, active && styles.selectorChipTextActive]} numberOfLines={1}>
                      {p.address}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable style={[styles.selectorChip, styles.selectorChipDashed]} onPress={() => router.push("/household/create")}>
                <Text style={styles.selectorChipAction}>+ Nuevo piso</Text>
              </Pressable>
            </ScrollView>
          ) : null}

          {selectedProperty ? (
            <View style={styles.addressCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.addressMain}>
                  {selectedProperty.address}
                  {selectedProperty.street_number ? `, ${selectedProperty.street_number}` : ""}
                </Text>
                <Pressable onPress={() => router.push(`/(tabs)/property/${selectedProperty.id}/edit`)}>
                  <Text style={styles.link}>Editar piso</Text>
                </Pressable>
              </View>
              <Text style={styles.addressSub}>
                {selectedProperty.city?.name ?? "Ciudad"}{selectedProperty.postal_code ? ` - ${selectedProperty.postal_code}` : ""}
              </Text>
            </View>
          ) : null}

          <View style={styles.kpiRow}>
            <Stat value={occupied} label="Ocupadas" />
            <Stat value={free} label="Libres" />
            <Stat value={pendingForProperty} label="Solicitudes" highlight={pendingForProperty > 0} />
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Habitaciones</Text>
            <Pressable
              onPress={() =>
                selectedProperty?.id
                  ? router.push({ pathname: "/listing/new", params: { propertyId: selectedProperty.id } })
                  : router.push("/listing/new")
              }
            >
              <Text style={styles.link}>+ Anadir</Text>
            </Pressable>
          </View>

          {listingsForProperty.slice(0, 5).map((l) => {
            const pending = pendingByListing.get(l.id) ?? 0;
            return (
              <Pressable key={l.id} style={styles.listItem} onPress={() => router.push(`/listing/${l.id}`)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{l.title}</Text>
                  <Text style={styles.listMeta}>
                    {l.price} EUR/mes
                    {pending > 0 ? ` - ${pending} solicitudes` : ""}
                  </Text>
                </View>
                <Text style={[styles.listStatus, l.status === "active" ? styles.pillAccepted : styles.pillDefault]}>
                  {l.status === "active" ? "Libre" : l.status === "rented" ? "Ocupada" : "Borrador"}
                </Text>
              </Pressable>
            );
          })}

          {listingsForProperty.length === 0 && (
            <View style={[styles.entryCard, styles.entryCardDashed, styles.emptyRoomCard]}>
              <Text style={styles.emptyRoomIcon}>+</Text>
              <Text style={styles.emptyRoomTitle}>Sin habitaciones publicadas</Text>
              <Text style={styles.emptyRoomSub}>Anade una habitacion para que los buscadores puedan encontrarla.</Text>
              <Pressable
                style={styles.primaryBtn}
                onPress={() =>
                  selectedProperty?.id
                    ? router.push({ pathname: "/listing/new", params: { propertyId: selectedProperty.id } })
                    : router.push("/listing/new")
                }
              >
                <Text style={styles.primaryBtnText}>+ Anadir primera habitacion</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.inviteUtilityCard}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inviteUtilityTitle}>Codigo de invitacion</Text>
                <Text style={styles.inviteUtilitySub}>Para anadir companeros sin anuncio</Text>
              </View>
              <Text style={styles.inviteUtilityCode}>{ownerHousehold?.invite_code ?? "------"}</Text>
            </View>
            <View style={styles.inviteUtilityActions}>
              <Pressable style={styles.utilityBtnPrimary} onPress={() => handleShareCode(ownerHousehold?.invite_code)}>
                <Text style={styles.utilityBtnPrimaryText}>Compartir codigo</Text>
              </Pressable>
              <Pressable
                style={styles.utilityBtn}
                onPress={() =>
                  ownerHouseholdId
                    ? router.push({ pathname: "/household/invite", params: { householdId: ownerHouseholdId } })
                    : Alert.alert("Sin household", "Primero anadete al piso para generar codigo.")
                }
              >
                <Text style={styles.utilityBtnText}>Gestionar</Text>
              </Pressable>
            </View>
            {!ownerIsMemberOfSelectedHousehold && (
              <Pressable style={styles.utilityBtnOwnerJoin} onPress={() => router.push("/(tabs)/household")}>
                <Text style={styles.utilityBtnOwnerJoinText}>Anadirme al piso</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.entryCardMiniWrap}>
            <Pressable style={styles.entryCardMini} onPress={() => router.push("/household/join")}>
              <Text style={styles.entryMiniTitle}>Unirme yo al piso</Text>
              <Text style={styles.entryMiniSub}>Si aun no eres miembro, entra con codigo.</Text>
            </Pressable>
            <Pressable style={styles.entryCardMini} onPress={() => router.push("/household/create")}>
              <Text style={styles.entryMiniTitle}>Crear household sin anuncio</Text>
              <Text style={styles.entryMiniSub}>Solo direccion. Sin wizard completo.</Text>
            </Pressable>
          </View>

          <Pressable style={styles.primaryBtn} onPress={() => router.push("/(tabs)/household")}>
            <Text style={styles.primaryBtnText}>Abrir panel de pisos</Text>
          </Pressable>
        </View>
      ) : null}

      {activeTab === "household" ? (
        <View style={styles.block}>
          {householdIds.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorRow}>
              {householdIds.map((id) => {
                const membership = memberships.find((m) => m.household_id === id);
                const property = properties.find((p) => p.household_id === id);
                const owned = ownedHouseholds.find((h) => h.id === id);
                const label = membership?.households?.name ?? owned?.name ?? property?.address ?? "Piso";
                const active = selectedHouseholdId === id;
                return (
                  <Pressable
                    key={id}
                    style={[styles.selectorChip, active && styles.selectorChipActive]}
                    onPress={() => setSelectedHouseholdId(id)}
                  >
                    <Text style={[styles.selectorChipText, active && styles.selectorChipTextActive]} numberOfLines={1}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.addressCard}>
            <Text style={styles.addressMain}>{activeHousehold?.name ?? "Mi piso"}</Text>
            <Text style={styles.addressSub}>
              {activeProperty?.address ?? "Direccion sin definir"}
              {activeProperty?.postal_code ? ` - Codigo postal: ${activeProperty.postal_code}` : ""}
            </Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Balance del mes</Text>
            <Pressable onPress={() => router.push("/(tabs)/household")}>
              <Text style={styles.link}>Ver historial</Text>
            </Pressable>
          </View>
          {balancesData ? (
            <BalanceCard data={balancesData} currentUserId={myId ?? ""} />
          ) : (
            <Text style={styles.empty}>Todavia no hay balance calculado.</Text>
          )}

          <Text style={styles.sectionTitle}>Companeros</Text>
          {members.map((m) => (
            <View key={m.user_id} style={styles.memberRow}>
              <UserAvatar
                avatarUrl={m.profiles?.avatar_url}
                name={m.profiles?.full_name ?? m.profiles?.username ?? "Usuario"}
                size="sm"
              />
              <Text style={styles.memberName}>
                {m.profiles?.full_name ?? m.profiles?.username ?? "Usuario"}
                {m.role === "admin" ? " (Admin)" : ""}
              </Text>
            </View>
          ))}
          {members.length === 0 && <Text style={styles.empty}>No hay companeros cargados.</Text>}

          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Gastos</Text>
            <Pressable
              onPress={() => {
                requestHouseholdAddExpense();
                router.push("/(tabs)/household");
              }}
            >
              <Text style={styles.link}>+ Anadir</Text>
            </Pressable>
          </View>
          {Object.keys(monthExpenses).length === 0 ? (
            <Text style={styles.empty}>No hay gastos en este household.</Text>
          ) : (
            Object.entries(monthExpenses)
              .slice(0, 1)
              .map(([month, items]) => (
                <View key={month} style={styles.monthBlock}>
                  <Text style={styles.monthTitle}>{formatMonth(month)}</Text>
                  {items.slice(0, 3).map((e) => (
                    <ExpenseItem key={e.id} expense={e} currentUserId={myId ?? ""} householdId={selectedHouseholdId ?? ""} />
                  ))}
                </View>
              ))
          )}

          <Text style={styles.sectionTitle}>Normas</Text>
          {Array.isArray(activeProperty?.house_rules) && activeProperty?.house_rules.length ? (
            activeProperty.house_rules.map((rule) => (
              <Text key={rule} style={styles.ruleItem}>
                - {String(rule)}
              </Text>
            ))
          ) : (
            <Text style={styles.empty}>No hay normas definidas todavia.</Text>
          )}

          <View style={styles.inviteUtilityCard}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inviteUtilityTitle}>Codigo de invitacion</Text>
                <Text style={styles.inviteUtilitySub}>Comparte para anadir companeros</Text>
              </View>
              <Text style={styles.inviteUtilityCode}>{activeHousehold?.invite_code ?? "------"}</Text>
            </View>
            <View style={styles.inviteUtilityActions}>
              <Pressable style={styles.utilityBtnPrimary} onPress={() => handleShareCode(activeHousehold?.invite_code)}>
                <Text style={styles.utilityBtnPrimaryText}>Compartir codigo</Text>
              </Pressable>
              <Pressable style={styles.utilityBtn} onPress={handleOpenInvite}>
                <Text style={styles.utilityBtnText}>Gestionar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

function Stat({ value, label, highlight = false }: { value: string | number; label: string; highlight?: boolean }) {
  return (
    <View style={[styles.stat, highlight && styles.statHighlight]}>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  title: { fontSize: fontSize["2xl"], fontWeight: "800", color: colors.text },
  tabs: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    padding: 4,
    gap: 4,
    backgroundColor: colors.surface,
  },
  tabBtn: {
    flex: 1,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  tabBtnActive: { backgroundColor: colors.text },
  tabText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.textSecondary },
  tabTextActive: { color: colors.white },

  block: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
    gap: spacing[2],
  },
  helper: { color: colors.textSecondary, fontSize: fontSize.sm },
  requestCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing[3],
    backgroundColor: colors.gray50,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  requestTitle: { fontSize: fontSize.md, color: colors.text, fontWeight: "700" },
  requestMeta: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  pill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    overflow: "hidden",
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  pillAccepted: { backgroundColor: colors.successLight, color: colors.success },
  pillOffered: { backgroundColor: colors.verifyLight, color: colors.verify },
  pillInvited: { backgroundColor: colors.gray100, color: colors.textSecondary },
  pillPending: { backgroundColor: colors.warningLight, color: colors.warning },
  pillDefault: { backgroundColor: colors.gray100, color: colors.textSecondary },

  slotCard: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing[3],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    backgroundColor: colors.gray50,
  },
  slotPlus: { fontSize: 24, color: colors.textTertiary, fontWeight: "700", width: 24, textAlign: "center" },
  slotTitle: { color: colors.text, fontWeight: "700", fontSize: fontSize.sm },
  slotSub: { color: colors.textSecondary, fontSize: fontSize.xs },
  planText: { color: colors.purple, fontSize: fontSize.xs, fontWeight: "600" },

  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: colors.textTertiary, fontSize: fontSize.xs, fontWeight: "700", textTransform: "uppercase" },
  link: { color: colors.verify, fontSize: fontSize.sm, fontWeight: "700" },
  entryCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing[3],
    backgroundColor: colors.gray50,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  entryCardDashed: { borderStyle: "dashed" },
  entryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  entryIcon: { color: colors.textSecondary, fontWeight: "800", fontSize: fontSize.md },
  entryTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: "700" },
  entrySub: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },

  kpiRow: { flexDirection: "row", gap: spacing[2] },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing[2],
    alignItems: "center",
    backgroundColor: colors.gray50,
  },
  statHighlight: { backgroundColor: colors.warningLight, borderColor: `${colors.warning}66` },
  statValue: { fontSize: fontSize.xl, fontWeight: "800", color: colors.text },
  statValueHighlight: { color: colors.warning },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },

  listItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing[3],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    backgroundColor: colors.gray50,
  },
  listTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  listMeta: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  listStatus: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    overflow: "hidden",
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  addressCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing[3],
    backgroundColor: colors.gray50,
  },
  addressMain: { color: colors.text, fontSize: fontSize.md, fontWeight: "700" },
  addressSub: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  primaryBtn: {
    borderRadius: radius.full,
    backgroundColor: colors.text,
    paddingVertical: spacing[2],
    alignItems: "center",
  },
  primaryBtnText: { color: colors.white, fontWeight: "700", fontSize: fontSize.sm },

  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingVertical: spacing[1],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  memberName: { fontSize: fontSize.sm, color: colors.text, fontWeight: "600" },
  selectorRow: { gap: spacing[2], paddingRight: spacing[1] },
  selectorChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    backgroundColor: colors.gray50,
    maxWidth: 180,
  },
  selectorChipActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}1A`,
  },
  selectorChipDashed: {
    borderStyle: "dashed",
  },
  selectorChipAction: {
    color: colors.verify,
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  selectorChipText: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: "700" },
  selectorChipTextActive: { color: colors.primary },
  emptyRoomCard: {
    alignItems: "center",
    textAlign: "center",
    gap: spacing[2],
  },
  emptyRoomIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    textAlign: "center",
    textAlignVertical: "center",
    color: colors.textTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    lineHeight: 36,
    fontWeight: "800",
  },
  emptyRoomTitle: { color: colors.text, fontWeight: "700", fontSize: fontSize.md },
  emptyRoomSub: { color: colors.textSecondary, fontSize: fontSize.sm, textAlign: "center" },
  inviteUtilityCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing[3],
    backgroundColor: colors.gray50,
    gap: spacing[2],
  },
  inviteUtilityTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: "700" },
  inviteUtilitySub: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  inviteUtilityCode: { color: colors.text, fontSize: fontSize.lg, fontWeight: "800", letterSpacing: 1 },
  inviteUtilityActions: { flexDirection: "row", gap: spacing[2] },
  utilityBtnPrimary: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing[2],
    backgroundColor: colors.text,
    alignItems: "center",
  },
  utilityBtnPrimaryText: { color: colors.white, fontSize: fontSize.sm, fontWeight: "700" },
  utilityBtn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  utilityBtnText: { color: colors.text, fontSize: fontSize.sm, fontWeight: "700" },
  utilityBtnOwnerJoin: {
    borderRadius: radius.md,
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    backgroundColor: colors.primaryLight,
  },
  utilityBtnOwnerJoinText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: "800",
  },
  entryCardMiniWrap: { gap: spacing[2] },
  entryCardMini: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing[2],
    backgroundColor: colors.surface,
  },
  entryMiniTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: "700" },
  entryMiniSub: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  monthBlock: { gap: spacing[2] },
  monthTitle: { color: colors.textTertiary, fontSize: fontSize.xs, fontWeight: "700" },
  ruleItem: { color: colors.text, fontSize: fontSize.sm },
  empty: { color: colors.textSecondary, fontSize: fontSize.sm, fontStyle: "italic" },
});
