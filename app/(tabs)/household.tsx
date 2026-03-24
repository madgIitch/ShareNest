import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AddExpenseSheet } from "../../src/components/expenses/AddExpenseSheet";
import { BalanceCard } from "../../src/components/expenses/BalanceCard";
import { ExpenseItem } from "../../src/components/expenses/ExpenseItem";
import { useBalances, useExpenses } from "../../src/hooks/useExpenses";
import {
  useCreateHousehold,
  useHouseholdById,
  useHouseholdMembers,
  useMyHouseholdMemberships,
  type MyHouseholdMembership,
} from "../../src/hooks/useHousehold";
import { useMyListings, useUpdateListingStatus } from "../../src/hooks/useListings";
import { useMyProperties, useUpdateProperty, type PropertyWithCity } from "../../src/hooks/useProperties";
import { useReceivedRequests, type RequestWithDetails } from "../../src/hooks/useRequests";
import { UserAvatar } from "../../src/components/ui/UserAvatar";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, fontSize, radius, spacing } from "../../src/theme";
import type { Database } from "../../src/types/database";

type Listing = Database["public"]["Tables"]["listings"]["Row"];

export default function HouseholdScreen() {
  const { session } = useAuth();
  const myId = session?.user?.id ?? "";

  const { data: myProperties = [], isLoading: loadingProperties } = useMyProperties(myId);
  const { data: myListings = [], isLoading: loadingListings } = useMyListings(myId);
  const { data: receivedRequests = [], isLoading: loadingRequests } = useReceivedRequests(myId);
  const { data: memberships = [], isLoading: loadingMemberships } = useMyHouseholdMemberships(myId);

  const residentMemberships = memberships.filter((m) => m.households?.created_by !== myId);

  const loading = loadingProperties || loadingListings || loadingRequests || loadingMemberships;
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (myProperties.length > 0) {
    return (
      <OwnerHomesDashboard
        userId={myId}
        properties={myProperties}
        listings={myListings}
        receivedRequests={receivedRequests}
      />
    );
  }

  if (residentMemberships.length > 0) {
    return <ResidentHomesView memberships={residentMemberships} />;
  }

  return <EmptyHomesView />;
}

function OwnerHomesDashboard({
  userId,
  properties,
  listings,
  receivedRequests,
}: {
  userId: string;
  properties: PropertyWithCity[];
  listings: Listing[];
  receivedRequests: RequestWithDetails[];
}) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);
  const updateStatus = useUpdateListingStatus();
  const createHousehold = useCreateHousehold();
  const updateProperty = useUpdateProperty();

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === selectedPropertyId) ?? properties[0],
    [properties, selectedPropertyId],
  );

  const selectedHouseholdId =
    (selectedProperty as unknown as { household_id?: string | null })?.household_id ?? null;
  const { data: selectedHousehold } = useHouseholdById(selectedHouseholdId ?? undefined);

  const { data: expenses = [], isLoading: loadingExp, refetch } = useExpenses(selectedHouseholdId ?? undefined);
  const { data: balancesData, isLoading: loadingBal } = useBalances(selectedHouseholdId ?? undefined);
  const { data: members = [] } = useHouseholdMembers(selectedHouseholdId ?? undefined);

  const [refreshing, setRefreshing] = useState(false);

  const filteredListings = useMemo(() => {
    if (!selectedProperty) return [];
    const withProperty = listings.filter((l) => l.property_id === selectedProperty.id);
    if (withProperty.length > 0) return withProperty;
    if (properties.length === 1) return listings;
    return [];
  }, [listings, properties.length, selectedProperty]);

  const occupied = filteredListings.filter((l) => l.status === "rented").length;
  const free = filteredListings.filter((l) => l.status === "active").length;
  const pending = receivedRequests.filter(
    (r) => r.status === "pending" && filteredListings.some((l) => l.id === r.listing_id),
  ).length;
  const income = filteredListings
    .filter((l) => l.status === "rented")
    .reduce((sum, l) => sum + Number(l.price ?? 0), 0);

  const occupantByListing = useMemo(() => {
    const out: Record<string, { name: string; avatarUrl: string | null; priority: number }> = {};
    const score = (status: string) => (status === "assigned" ? 2 : status === "accepted" ? 1 : 0);

    for (const req of receivedRequests) {
      if (!req.listing_id || !req.requester) continue;
      const priority = score(req.status);
      if (priority === 0) continue;
      const current = out[req.listing_id];
      if (current && current.priority >= priority) continue;
      out[req.listing_id] = {
        name: req.requester.full_name?.trim() || "Inquilino",
        avatarUrl: req.requester.avatar_url,
        priority,
      };
    }

    return out;
  }, [receivedRequests]);

  const byMonth = expenses.reduce<Record<string, typeof expenses>>((acc, e) => {
    const key = e.date.slice(0, 7);
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAddMeToFloor = async () => {
    if (!selectedProperty?.id) return;
    if (selectedHouseholdId) {
      Alert.alert("Ya existe convivencia", "Este piso ya tiene un hogar asociado.");
      return;
    }
    try {
      const name = selectedProperty.address?.trim() || "Piso compartido";
      const created = await createHousehold.mutateAsync({ name });
      await updateProperty.mutateAsync({
        id: selectedProperty.id,
        ownerId: userId,
        updates: { household_id: created.id },
      });
      Alert.alert("Listo", "Ya estas dentro del piso. Ahora puedes invitar a alguien.");
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    }
  };

  const handleInviteToFloor = async () => {
    if (!selectedHousehold?.invite_code) {
      Alert.alert("Sin codigo", "Primero anadete al piso para generar el codigo de invitacion.");
      return;
    }
    const message = `Unete a mi piso en ShareNest con este codigo: ${selectedHousehold.invite_code}`;
    try {
      await Share.share({ message });
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.pageTitle}>Tus pisos</Text>

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
                  Piso: {p.address}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.propertyHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.propertyTitle}>{selectedProperty?.address ?? "Piso"}</Text>
            <Text style={styles.propertyMeta}>{selectedProperty?.city?.name ?? "Ciudad"}</Text>
            {!selectedHouseholdId && (
              <Text style={styles.propertyHint}>Sin convivencia activa. Anadete para invitar companeros.</Text>
            )}
          </View>
          <View style={styles.propertyHeaderActions}>
            <Pressable
              style={[styles.outlineBtn, !selectedProperty?.id && styles.outlineBtnDisabled]}
              disabled={!selectedProperty?.id}
              onPress={() => selectedProperty?.id && router.push(`/(tabs)/property/${selectedProperty.id}/edit`)}
            >
              <Text style={styles.outlineBtnText}>Editar piso</Text>
            </Pressable>
            <Pressable style={styles.outlineBtn} onPress={() => router.push("/listing/new")}>
              <Text style={styles.outlineBtnText}>+ Habitacion</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.ownerFloorActions}>
          {!selectedHouseholdId && (
            <Pressable
              style={[styles.primaryBtn, (createHousehold.isPending || updateProperty.isPending) && styles.outlineBtnDisabled]}
              onPress={handleAddMeToFloor}
              disabled={createHousehold.isPending || updateProperty.isPending}
            >
              <Text style={styles.primaryBtnText}>
                {createHousehold.isPending || updateProperty.isPending ? "Anadiendo..." : "Anadirme al piso"}
              </Text>
            </Pressable>
          )}
          <Pressable style={styles.outlineBtnWide} onPress={handleInviteToFloor}>
            <View style={styles.inviteBtnContent}>
              <View style={styles.inviteIcon}>
                <Text style={styles.inviteIconText}>+</Text>
              </View>
              <Text style={styles.inviteBtnText}>Invitar a alguien al piso</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.metricsRow}>
          <Stat value={occupied} label="Ocupadas" />
          <Stat value={free} label="Libres" />
          <Stat value={pending} label="Solicitudes" highlight={pending > 0} />
          <Stat value={`EUR ${income}`} label="Ingresos/mes" />
        </View>

        <View style={styles.block}>
          <View style={styles.blockHeader}>
            <Text style={styles.blockTitle}>Habitaciones</Text>
          </View>

          {filteredListings.length === 0 ? (
            <Text style={styles.muted}>No hay habitaciones en este piso.</Text>
          ) : (
            filteredListings.map((listing) => {
              const pendingForRoom = receivedRequests.filter(
                (r) => r.status === "pending" && r.listing_id === listing.id,
              ).length;
              return (
                <View key={listing.id} style={styles.roomCard}>
                  <View style={styles.roomTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roomTitle}>{listing.title}</Text>
                      <Text style={styles.roomMeta}>
                        EUR {listing.price}/mes
                        {listing.size_m2 ? ` - ${listing.size_m2} m2` : ""}
                      </Text>
                    </View>
                    <Text style={[styles.roomStatus, listing.status === "rented" ? styles.statusRented : styles.statusActive]}>
                      {listing.status === "rented" ? "Ocupada" : listing.status === "active" ? "Libre" : "Borrador"}
                    </Text>
                  </View>
                  {listing.status === "rented" && occupantByListing[listing.id] && (
                    <View style={styles.tenantRow}>
                      <UserAvatar
                        avatarUrl={occupantByListing[listing.id].avatarUrl}
                        name={occupantByListing[listing.id].name}
                        size="xs"
                      />
                      <View style={styles.tenantTextWrap}>
                        <Text style={styles.tenantLabel}>Inquilino actual</Text>
                        <Text style={styles.tenantName}>{occupantByListing[listing.id].name}</Text>
                      </View>
                    </View>
                  )}
                  <View style={styles.roomActions}>
                    <Pressable style={styles.roomBtn} onPress={() => router.push(`/listing/${listing.id}/edit`)}>
                      <Text style={styles.roomBtnText}>Editar</Text>
                    </Pressable>
                    <Pressable style={styles.roomBtnPrimary} onPress={() => router.push(`/listing/${listing.id}/candidates`)}>
                      <Text style={styles.roomBtnPrimaryText}>Candidatos</Text>
                      {pendingForRoom > 0 && (
                        <View style={styles.roomBtnBadge}>
                          <Text style={styles.roomBtnBadgeText}>{pendingForRoom}</Text>
                        </View>
                      )}
                    </Pressable>
                    {listing.status === "rented" && (
                      <Pressable
                        style={styles.roomBtn}
                        onPress={() => updateStatus.mutate({ id: listing.id, status: "active" })}
                      >
                        <Text style={styles.roomBtnText}>Marcar libre</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.block}>
          <View style={styles.blockHeader}>
            <Text style={styles.blockTitle}>Gastos del piso</Text>
            {!selectedHouseholdId && <Text style={styles.muted}>Sin piso compartido</Text>}
          </View>

          {!selectedHouseholdId ? (
            <Text style={styles.muted}>Este piso aun no tiene convivencia activa.</Text>
          ) : (
            <>
              {loadingBal ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing[3] }} />
              ) : balancesData ? (
                <BalanceCard data={balancesData} currentUserId={userId} />
              ) : null}

              {loadingExp ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing[3] }} />
              ) : expenses.length === 0 ? (
                <Text style={styles.muted}>Aun no hay gastos cargados.</Text>
              ) : (
                Object.entries(byMonth).map(([month, items]) => (
                  <View key={month} style={styles.monthGroup}>
                    <Text style={styles.monthLabel}>{formatMonth(month)}</Text>
                    {items.map((e) => (
                      <ExpenseItem key={e.id} expense={e} currentUserId={userId} householdId={selectedHouseholdId} />
                    ))}
                  </View>
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>

      {selectedHouseholdId && (
        <>
          <Pressable style={styles.fab} onPress={() => setSheetOpen(true)} accessibilityLabel="Anadir gasto del piso">
            <Text style={styles.fabText}>+ Anadir gasto</Text>
          </Pressable>
          <AddExpenseSheet
            visible={sheetOpen}
            onClose={() => setSheetOpen(false)}
            householdId={selectedHouseholdId}
            currentUserId={userId}
            members={members}
          />
        </>
      )}
    </View>
  );
}

function ResidentHomesView({ memberships }: { memberships: MyHouseholdMembership[] }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Pisos donde vives</Text>
      {memberships.map((m) => (
        <View key={`${m.household_id}-${m.joined_at}`} style={styles.roomCard}>
          <Text style={styles.roomTitle}>{m.households?.name ?? "Piso compartido"}</Text>
          <Text style={styles.roomMeta}>Unido el {new Date(m.joined_at).toLocaleDateString("es-ES")}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function EmptyHomesView() {
  return (
    <ScrollView contentContainerStyle={styles.emptyState}>
      <Text style={styles.pageTitle}>Piso</Text>
      <Text style={styles.muted}>Aun no tienes pisos ni convivencias compartidas.</Text>
      <Pressable style={styles.primaryBtn} onPress={() => router.push("/listing/new")}> 
        <Text style={styles.primaryBtnText}>Crear primer piso</Text>
      </Pressable>
      <Pressable style={styles.outlineBtn} onPress={() => router.push("/household/join")}> 
        <Text style={styles.outlineBtnText}>Unirse con codigo</Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({ value, label, highlight }: { value: string | number; label: string; highlight?: boolean }) {
  return (
    <View style={[styles.stat, highlight && styles.statHighlight]}>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
      <Text style={[styles.statLabel, highlight && styles.statLabelHighlight]}>{label}</Text>
    </View>
  );
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
  return `${names[parseInt(month, 10) - 1]} ${year}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  content: { padding: spacing[4], paddingBottom: 110, gap: spacing[3] },
  pageTitle: { fontSize: fontSize["2xl"], fontWeight: "800", color: colors.text },

  selectorRow: { gap: spacing[2], paddingVertical: spacing[1] },
  selectorChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minWidth: 120,
  },
  selectorChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  selectorChipText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: "600" },
  selectorChipTextActive: { color: colors.primary },

  propertyHeader: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing[4],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  propertyHeaderActions: {
    flexDirection: "row",
    gap: spacing[2],
  },
  propertyTitle: { fontSize: fontSize.lg, fontWeight: "800", color: colors.text },
  propertyMeta: { color: colors.textSecondary, marginTop: 2 },
  propertyHint: { color: colors.textSecondary, marginTop: 6, fontSize: fontSize.xs },
  ownerFloorActions: { marginTop: -spacing[1], marginBottom: spacing[1], gap: spacing[2] },

  metricsRow: { flexDirection: "row", gap: spacing[2] },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing[3],
    alignItems: "center",
  },
  statHighlight: { backgroundColor: colors.warningLight, borderColor: colors.warning + "66" },
  statValue: { fontSize: fontSize.xl, fontWeight: "800", color: colors.text },
  statValueHighlight: { color: colors.warning },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  statLabelHighlight: { color: colors.warning },

  block: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing[4],
    gap: spacing[3],
  },
  blockHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  blockTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },

  roomCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing[3],
    gap: spacing[2],
    backgroundColor: colors.background,
  },
  roomTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing[2] },
  roomTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  roomMeta: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  roomStatus: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    overflow: "hidden",
  },
  statusActive: { color: colors.success, backgroundColor: colors.successLight },
  statusRented: { color: colors.verify, backgroundColor: colors.verifyLight },

  roomActions: { flexDirection: "row", gap: spacing[2], flexWrap: "wrap" },
  roomBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.surface,
  },
  roomBtnText: { fontSize: fontSize.xs, fontWeight: "700", color: colors.text },
  roomBtnPrimary: {
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.text,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  roomBtnPrimaryText: { fontSize: fontSize.xs, fontWeight: "700", color: colors.white },
  roomBtnBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: colors.warning,
    alignItems: "center",
    justifyContent: "center",
  },
  roomBtnBadgeText: { color: colors.white, fontSize: 11, fontWeight: "800" },
  tenantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingTop: spacing[1],
  },
  tenantTextWrap: { flex: 1 },
  tenantLabel: { fontSize: fontSize.xs, color: colors.textTertiary, fontWeight: "600" },
  tenantName: { fontSize: fontSize.sm, color: colors.text, fontWeight: "700" },

  monthGroup: { gap: spacing[2] },
  monthLabel: { fontSize: fontSize.xs, color: colors.textTertiary, fontWeight: "700" },

  muted: { color: colors.textSecondary, fontSize: fontSize.sm },

  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    alignItems: "center",
  },
  primaryBtnText: { color: colors.white, fontWeight: "700", fontSize: fontSize.sm },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  outlineBtnDisabled: {
    opacity: 0.5,
  },
  outlineBtnText: { color: colors.primary, fontWeight: "700", fontSize: fontSize.sm },
  outlineBtnWide: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.primaryLight,
    alignItems: "center",
  },
  inviteBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  inviteIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteIconText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 12,
  },
  inviteBtnText: { color: colors.primary, fontWeight: "800", fontSize: fontSize.sm },

  emptyState: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[6],
    gap: spacing[3],
    backgroundColor: colors.background,
  },

  fab: {
    position: "absolute",
    right: spacing[5],
    bottom: spacing[6],
    minHeight: 48,
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabText: { color: colors.white, fontSize: fontSize.sm, fontWeight: "800" },
});
