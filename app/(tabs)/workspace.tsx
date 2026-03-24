import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BalanceCard } from "../../src/components/expenses/BalanceCard";
import { ExpenseItem } from "../../src/components/expenses/ExpenseItem";
import { UserAvatar } from "../../src/components/ui/UserAvatar";
import { useBalances, useExpenses } from "../../src/hooks/useExpenses";
import { useHouseholdById, useHouseholdMembers, useMyHousehold, useMyHouseholdMemberships } from "../../src/hooks/useHousehold";
import { useMyListings } from "../../src/hooks/useListings";
import { useMyProperties } from "../../src/hooks/useProperties";
import { ACTIVE_REQUEST_STATUSES, useReceivedRequests, useSentRequests } from "../../src/hooks/useRequests";
import { useAuth } from "../../src/providers/AuthProvider";
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

  const sentActive = sent.filter((r) => isActiveRequest(r.status));
  const pendingReceived = received.filter((r) => r.status === "pending");

  const ownerHouseholdId = properties.find((p) => Boolean(p.household_id))?.household_id ?? null;
  const memberHouseholdId = memberships[0]?.household_id ?? null;
  const activeHouseholdId = myHousehold?.id ?? ownerHouseholdId ?? memberHouseholdId ?? null;

  const activeProperty =
    properties.find((p) => p.household_id === activeHouseholdId) ??
    properties[0] ??
    null;

  const { data: activeHousehold } = useHouseholdById(activeHouseholdId ?? undefined);
  const { data: members = [] } = useHouseholdMembers(activeHouseholdId ?? undefined);
  const { data: balancesData } = useBalances(activeHouseholdId ?? undefined);
  const { data: expenses = [] } = useExpenses(activeHouseholdId ?? undefined);

  const hasSeekingTab = sent.length > 0;
  const hasOwnerTab = listings.length > 0;
  const hasHouseholdTab = Boolean(myHousehold?.id || ownerHouseholdId || memberHouseholdId);

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

  const occupied = listings.filter((l) => l.status === "rented").length;
  const free = listings.filter((l) => l.status === "active").length;

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
          <View style={styles.kpiRow}>
            <Stat value={occupied} label="Ocupadas" />
            <Stat value={free} label="Libres" />
            <Stat value={pendingReceived.length} label="Solicitudes" highlight={pendingReceived.length > 0} />
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Habitaciones</Text>
            <Pressable onPress={() => router.push("/listing/new")}>
              <Text style={styles.link}>+ Anadir</Text>
            </Pressable>
          </View>

          {listings.slice(0, 5).map((l) => {
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

          {listings.length === 0 && <Text style={styles.empty}>No tienes habitaciones publicadas.</Text>}

          {activeProperty ? (
            <View style={styles.addressCard}>
              <Text style={styles.sectionTitle}>Direccion</Text>
              <Text style={styles.addressMain}>
                {activeProperty.address}
                {activeProperty.street_number ? `, ${activeProperty.street_number}` : ""}
              </Text>
              <Text style={styles.addressSub}>
                {activeProperty.city?.name ?? "Ciudad"}{activeProperty.postal_code ? ` - ${activeProperty.postal_code}` : ""}
              </Text>
            </View>
          ) : null}

          <Pressable style={styles.primaryBtn} onPress={() => router.push("/(tabs)/household")}>
            <Text style={styles.primaryBtnText}>Abrir panel de pisos</Text>
          </Pressable>
        </View>
      ) : null}

      {activeTab === "household" ? (
        <View style={styles.block}>
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
            <Pressable onPress={() => router.push("/(tabs)/household")}>
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
                    <ExpenseItem key={e.id} expense={e} currentUserId={myId ?? ""} householdId={activeHouseholdId ?? ""} />
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
  monthBlock: { gap: spacing[2] },
  monthTitle: { color: colors.textTertiary, fontSize: fontSize.xs, fontWeight: "700" },
  ruleItem: { color: colors.text, fontSize: fontSize.sm },
  empty: { color: colors.textSecondary, fontSize: fontSize.sm, fontStyle: "italic" },
});
