import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { UserAvatar } from "../../src/components/ui/UserAvatar";
import { useMyListings, useUpdateListingStatus } from "../../src/hooks/useListings";
import { useReceivedRequests } from "../../src/hooks/useRequests";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, fontSize, radius, spacing } from "../../src/theme";
import type { ListingStatus } from "../../src/types/database";
import type { ListingWithProperty } from "../../src/types/listingWithProperty";

type Listing = ListingWithProperty;

// ─── Metric card ──────────────────────────────────────────────────────────────

function MetricCard({
  value,
  label,
  color,
  amber,
}: {
  value: string | number;
  label: string;
  color?: string;
  amber?: boolean;
}) {
  return (
    <View style={[styles.metric, amber && styles.metricAmber]}>
      <Text style={[styles.metricValue, amber && styles.metricValueAmber]}>{value}</Text>
      <Text style={[styles.metricLabel, amber && styles.metricLabelAmber]}>{label}</Text>
    </View>
  );
}

// ─── Room card ────────────────────────────────────────────────────────────────

function RoomCard({
  listing,
  pendingCount,
  onEdit,
  onCandidates,
  onMarkFree,
  onChat,
}: {
  listing: Listing;
  pendingCount: number;
  onEdit: () => void;
  onCandidates: () => void;
  onMarkFree: () => void;
  onChat: () => void;
}) {
  const isOccupied = listing.status === "rented";
  const isFree = listing.status === "active";

  const statusColor = isOccupied ? colors.verify : colors.success;
  const statusLabel = isOccupied ? "Ocupada" : isFree ? "Libre" : "Borrador";

  return (
    <View style={styles.roomCard}>
      {/* Header */}
      <View style={styles.roomCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.roomTitle} numberOfLines={1}>{listing.title}</Text>
          <Text style={styles.roomMeta}>
            {listing.price} €/mes
            {listing.size_m2 ? ` · ${listing.size_m2} m²` : ""}
            {listing.description ? ` · ${listing.description.split(".")[0]}` : ""}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}>
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Occupant info (if occupied) */}
      {isOccupied && listing.owner_id && (
        <View style={styles.occupantRow}>
          <Text style={styles.occupantText}>Inquilino asignado</Text>
        </View>
      )}

      {/* Pending requests (if free) */}
      {isFree && pendingCount > 0 && (
        <View style={styles.pendingRow}>
          <View style={styles.pendingDot} />
          <Text style={styles.pendingText}>
            {pendingCount} solicitud{pendingCount !== 1 ? "es" : ""} pendiente{pendingCount !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.roomActions}>
        {isFree && (
          <>
            <Pressable style={styles.roomAction} onPress={onEdit}>
              <Text style={styles.roomActionText}>Editar</Text>
            </Pressable>
            <Pressable style={styles.roomAction} onPress={() => {}}>
              <Text style={styles.roomActionText}>Invitar</Text>
            </Pressable>
            <Pressable
              style={[styles.roomAction, styles.roomActionPrimary, pendingCount > 0 && styles.roomActionAmber]}
              onPress={onCandidates}
            >
              <Text style={[styles.roomActionText, styles.roomActionPrimaryText]}>
                Candidatos{pendingCount > 0 ? ` (${pendingCount})` : ""}
              </Text>
            </Pressable>
          </>
        )}
        {isOccupied && (
          <>
            <Pressable style={styles.roomAction} onPress={() => {}}>
              <Text style={styles.roomActionText}>Ver perfil</Text>
            </Pressable>
            <Pressable style={styles.roomAction} onPress={onMarkFree}>
              <Text style={styles.roomActionText}>Marcar libre</Text>
            </Pressable>
            <Pressable style={[styles.roomAction, styles.roomActionPrimary]} onPress={onChat}>
              <Text style={[styles.roomActionText, styles.roomActionPrimaryText]}>Chat</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

// ─── Expense row ──────────────────────────────────────────────────────────────

function ExpenseRow({
  icon,
  description,
  amount,
  perPerson,
  settled,
}: {
  icon: string;
  description: string;
  amount: number;
  perPerson: number;
  settled: boolean;
}) {
  return (
    <View style={styles.expenseRow}>
      <View style={[styles.expenseIcon, settled && styles.expenseIconSettled]}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.expenseDescription}>{description}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.expenseAmount}>{amount} €</Text>
        <Text style={styles.expensePer}>{perPerson} €/p.</Text>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PropertyDashboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const myId = session?.user?.id;

  // We use the owner's listings as proxy for "rooms in this property"
  // When property_id is available, filter by property_id instead
  const { data: allListings = [], isLoading } = useMyListings(myId);
  const { data: receivedRequests = [] } = useReceivedRequests(myId);
  const updateStatus = useUpdateListingStatus();

  // Filter listings that belong to this property (by property_id or all if id === 'mine')
  const rooms = id === "mine"
    ? allListings
    : allListings.filter((l) => l.property_id === id || (!l.property_id && allListings.indexOf(l) >= 0));

  // Metrics
  const occupied = rooms.filter((r) => r.status === "rented").length;
  const free = rooms.filter((r) => r.status === "active").length;
  const pendingTotal = receivedRequests.filter((r) => r.status === "pending").length;
  const monthlyIncome = rooms
    .filter((r) => r.status === "rented")
    .reduce((sum, r) => sum + r.price, 0);

  // Property info (from first listing for now)
  const first = rooms[0];
  const address = first
    ? (first.address?.trim()
      || `${first.street ?? ""} ${first.street_number ?? ""}`.trim()
      || first.city_name
      || first.city)
    : "Mi piso";
  const cityLabel = first?.city_name ?? first?.city ?? "";
  const editablePropertyId = id === "mine" ? rooms[0]?.property_id ?? null : id;

  const handleMarkFree = (listing: Listing) => {
    Alert.alert("Marcar como libre", "El inquilino actual será desasignado.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Confirmar",
        onPress: () => updateStatus.mutateAsync({ id: listing.id, status: "active" }),
      },
    ]);
  };

  const handleBack = () => {
    if (typeof router.canGoBack === "function" && router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/household");
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerBack} onPress={handleBack}>
          <Text style={styles.headerBackText}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mi piso · {cityLabel}</Text>
        </View>
        <Pressable
          style={styles.editPisoBtn}
          onPress={() => {
            if (!editablePropertyId) return;
            router.push(`/(tabs)/property/${editablePropertyId}/edit`);
          }}
        >
          <Text style={styles.editPisoBtnText}>Editar piso</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Address */}
        <View style={styles.addressRow}>
          <Text style={styles.addressText}>
            {address} · {first?.district_name ?? first?.district ?? cityLabel}
          </Text>
          <Text style={styles.addressMeta}>
            {rooms.filter((r) => r.size_m2).length > 0
              ? `${rooms.reduce((s, r) => s + (r.size_m2 ?? 0), 0)} m² totales`
              : ""}{" "}
            · {rooms.length} habitaciones
          </Text>
        </View>

        {/* Metrics */}
        <View style={styles.metricsRow}>
          <MetricCard value={occupied} label="Ocupadas" />
          <MetricCard value={free} label="Libre" />
          <MetricCard value={pendingTotal} label="Solicitudes" amber={pendingTotal > 0} />
          <MetricCard value={`${monthlyIncome}€`} label="Ingresos/mes" />
        </View>

        {/* Rooms */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>HABITACIONES</Text>
            <Pressable
              onPress={() => {
                if (!editablePropertyId) return;
                router.push({ pathname: "/listing/new", params: { propertyId: editablePropertyId } });
              }}
            >
              <Text style={styles.addRoomText}>+ Añadir habitación</Text>
            </Pressable>
          </View>

          {rooms.map((listing) => {
            const pendingForRoom = receivedRequests.filter(
              (r) => r.listing_id === listing.id && r.status === "pending",
            ).length;
            return (
              <RoomCard
                key={listing.id}
                listing={listing}
                pendingCount={pendingForRoom}
                onEdit={() => router.push(`/listing/${listing.id}/edit`)}
                onCandidates={() => router.push(`/listing/${listing.id}/candidates`)}
                onMarkFree={() => handleMarkFree(listing)}
                onChat={() => {}}
              />
            );
          })}

          {rooms.length === 0 && (
            <View style={styles.emptyRooms}>
              <Text style={styles.emptyRoomsText}>
                No hay habitaciones publicadas aún.
              </Text>
              <Pressable
                style={styles.addFirstRoomBtn}
                onPress={() => {
                  if (!editablePropertyId) return;
                  router.push({ pathname: "/listing/new", params: { propertyId: editablePropertyId } });
                }}
              >
                <Text style={styles.addFirstRoomBtnText}>Publicar primera habitación</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Expenses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>GASTOS DEL MES</Text>
            <Pressable>
              <Text style={styles.seeAllText}>Ver todos →</Text>
            </Pressable>
          </View>

          {/* Placeholder expenses */}
          <ExpenseRow
            icon="⚡"
            description="Factura luz"
            amount={87}
            perPerson={29}
            settled={true}
          />
          <ExpenseRow
            icon="💧"
            description="Agua"
            amount={42}
            perPerson={14}
            settled={false}
          />

          <Pressable style={styles.addExpenseBtn}>
            <Text style={styles.addExpenseBtnText}>+ Añadir gasto</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: spacing[6],
  },
  headerBack: {
    width: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing[2],
  },
  headerBackText: { fontSize: 26, color: colors.text, fontWeight: "700" },
  headerTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  editPisoBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editPisoBtnText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: "600" },

  // Content
  content: { padding: spacing[4], gap: spacing[4] },

  // Address
  addressRow: { gap: 2 },
  addressText: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  addressMeta: { fontSize: fontSize.sm, color: colors.textSecondary },

  // Metrics
  metricsRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  metric: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing[3],
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricAmber: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning + "44",
  },
  metricValue: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    color: colors.text,
  },
  metricValueAmber: { color: colors.warning },
  metricLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  metricLabelAmber: { color: colors.warning },

  // Section
  section: { gap: spacing[3] },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
  addRoomText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: "700" },
  seeAllText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: "600" },

  // Room card
  roomCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[3],
  },
  roomCardHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing[3] },
  roomTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.text },
  roomMeta: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  statusBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
  },
  statusBadgeText: { fontSize: fontSize.xs, fontWeight: "700" },
  occupantRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  occupantText: { fontSize: fontSize.sm, color: colors.textSecondary },
  pendingRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning,
  },
  pendingText: { fontSize: fontSize.sm, color: colors.warning, fontWeight: "600" },
  roomActions: { flexDirection: "row", gap: spacing[2] },
  roomAction: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  roomActionPrimary: { backgroundColor: colors.text, borderColor: colors.text },
  roomActionAmber: { backgroundColor: colors.warning, borderColor: colors.warning },
  roomActionText: { fontSize: fontSize.xs, fontWeight: "600", color: colors.text },
  roomActionPrimaryText: { color: colors.white },

  // Expense
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
  },
  expenseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray100,
    justifyContent: "center",
    alignItems: "center",
  },
  expenseIconSettled: { backgroundColor: colors.successLight },
  expenseDescription: { fontSize: fontSize.sm, fontWeight: "600", color: colors.text },
  expenseAmount: { fontSize: fontSize.sm, fontWeight: "700", color: colors.text },
  expensePer: { fontSize: fontSize.xs, color: colors.textSecondary },

  addExpenseBtn: {
    paddingVertical: spacing[3],
    alignItems: "center",
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.border,
  },
  addExpenseBtnText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: "600" },

  // Empty
  emptyRooms: {
    alignItems: "center",
    paddingVertical: spacing[6],
    gap: spacing[3],
  },
  emptyRoomsText: { fontSize: fontSize.sm, color: colors.textSecondary },
  addFirstRoomBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  addFirstRoomBtnText: { color: colors.white, fontWeight: "700", fontSize: fontSize.sm },
});
