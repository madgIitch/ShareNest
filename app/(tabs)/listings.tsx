import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { EmptyState } from "../../src/components/ui/EmptyState";
import { ListingCardSkeleton } from "../../src/components/ui/Skeleton";
import { TagBadge } from "../../src/components/ui/TagBadge";
import { useListingsByIds, useMyListings, useUpdateListingStatus } from "../../src/hooks/useListings";
import { useMyProperties } from "../../src/hooks/useProperties";
import { useReceivedRequests } from "../../src/hooks/useRequests";
import { getSavedListingIds } from "../../src/lib/savedListings";
import { useIsSuperfriendz } from "../../src/hooks/useSubscription";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, fontSize, radius, spacing } from "../../src/theme";
import type { ListingStatus } from "../../src/types/database";
import type { ListingWithProperty } from "../../src/types/listingWithProperty";

type Tab = ListingStatus | "saved";

const TABS: { key: Tab; label: string }[] = [
  { key: "active", label: "Activos" },
  { key: "paused", label: "Pausados" },
  { key: "rented", label: "Archivados" },
  { key: "saved", label: "Guardados" },
];

export default function MyListingsScreen() {
  const { session } = useAuth();
  const [tab, setTab] = useState<Tab>("active");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [isSavedLoading, setIsSavedLoading] = useState(true);
  const { data: listings, isLoading } = useMyListings(session?.user?.id);
  const { data: myProperties = [] } = useMyProperties(session?.user?.id);
  const { data: receivedRequests = [] } = useReceivedRequests(session?.user?.id);
  const { data: savedListings = [], isLoading: isSavedListingsLoading } = useListingsByIds(savedIds);
  const updateStatus = useUpdateListingStatus();
  const { data: isSuper = false } = useIsSuperfriendz();

  const refreshSaved = useCallback(async () => {
    setIsSavedLoading(true);
    const ids = await getSavedListingIds();
    setSavedIds(ids);
    setIsSavedLoading(false);
  }, []);

  useEffect(() => {
    void refreshSaved();
  }, [refreshSaved]);

  useFocusEffect(
    useCallback(() => {
      void refreshSaved();
    }, [refreshSaved]),
  );

  const freeHasOneProperty = !isSuper && myProperties.length >= 1;
  const filtered = tab === "saved"
    ? savedListings
    : (listings ?? []).filter((l) => l.status === tab);

  return (
    <View style={styles.screen}>
      <View style={styles.tabs}>
        {TABS.map((t) => {
          const count = t.key === "saved"
            ? savedIds.length
            : (listings ?? []).filter((l) => l.status === t.key).length;
          return (
            <Pressable
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                {t.label}
                {count > 0 ? ` (${count})` : ""}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading || (tab === "saved" && (isSavedLoading || isSavedListingsLoading)) ? (
        <View style={styles.list}>
          {[1, 2].map((i) => <ListingCardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={filtered.length === 0 ? { flex: 1 } : styles.list}
          renderItem={({ item }) => (
            <MyListingRow
              listing={item}
              pendingRequests={receivedRequests.filter(
                (r) => r.listing_id === item.id && r.status === "pending",
              ).length}
              onPress={() => router.push(`/listing/${item.id}`)}
              onEdit={
                tab === "saved"
                  ? undefined
                  : () => router.push(`/listing/${item.id}/edit`)
              }
              onToggleStatus={
                tab === "saved"
                  ? undefined
                  : () =>
                    updateStatus.mutateAsync({
                      id: item.id,
                      status: item.status === "active" ? "paused" : "active",
                    })
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={tab === "active" ? "[]" : tab === "paused" ? "||" : tab === "saved" ? "<3" : "H"}
              title={
                tab === "active"
                  ? "No tienes anuncios activos"
                  : tab === "paused"
                    ? "No tienes anuncios pausados"
                    : tab === "saved"
                      ? "No tienes anuncios guardados"
                      : "Sin anuncios archivados"
              }
              subtitle={
                tab === "active"
                  ? "Publica tu primer anuncio."
                  : tab === "saved"
                    ? "Da like en Explorar para guardarlos aqui."
                    : undefined
              }
              action={
                tab === "active"
                  ? { label: "Publicar anuncio", onPress: () => router.push("/listing/new") }
                  : undefined
              }
            />
          }
        />
      )}

      {freeHasOneProperty && (
        <View style={styles.limitBanner}>
          <Text style={styles.limitInfoTitle}>Plan free: 1 piso</Text>
          <Text style={styles.limitInfoText}>
            Puedes crear todos los listings que quieras dentro de tu piso actual.
          </Text>
        </View>
      )}

      {tab !== "saved" && (
        <Pressable
          style={styles.fab}
          onPress={() => {
            router.push("/listing/new");
          }}
          accessibilityLabel="Nuevo anuncio"
        >
          <Text style={styles.fabText}>+</Text>
          <Text style={styles.fabLabel}>Nuevo anuncio</Text>
        </Pressable>
      )}
    </View>
  );
}

function MyListingRow({
  listing,
  pendingRequests,
  onPress,
  onEdit,
  onToggleStatus,
}: {
  listing: ListingWithProperty;
  pendingRequests: number;
  onPress: () => void;
  onEdit?: () => void;
  onToggleStatus?: () => void;
}) {
  const cover = (listing.images as string[])[0];
  const canToggle =
    !!onToggleStatus && (listing.status === "active" || listing.status === "paused");

  return (
    <Pressable style={styles.row} onPress={onPress}>
      {cover ? (
        <Image source={{ uri: cover }} style={styles.thumb} />
      ) : (
        <View style={styles.thumbPlaceholder}>
          <Text style={{ fontSize: 22 }}>H</Text>
        </View>
      )}

      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={1}>{listing.title}</Text>
        <Text style={styles.rowCity}>{listing.city_name ?? listing.city ?? ""}</Text>
        <Text style={styles.rowPrice}>EUR {listing.price}/mes</Text>
        <View style={styles.rowTags}>
          <TagBadge
            label={listing.type === "offer" ? "Ofrezco" : "Busco"}
            variant="primary"
          />
          {pendingRequests > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>
                {pendingRequests} {pendingRequests === 1 ? "solicitud" : "solicitudes"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {(onEdit || canToggle) && (
        <View style={styles.rowActions}>
          {onEdit && (
            <Pressable style={styles.actionBtn} onPress={onEdit} accessibilityLabel="Editar anuncio">
              <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
          {canToggle && onToggleStatus && (
            <Pressable
              style={styles.actionBtn}
              onPress={onToggleStatus}
              accessibilityLabel={listing.status === "active" ? "Pausar anuncio" : "Activar anuncio"}
            >
              <Ionicons
                name={listing.status === "active" ? "pause" : "play"}
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: colors.transparent,
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  list: {
    padding: spacing[4],
    gap: spacing[3],
  },
  row: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing[3],
  },
  thumb: {
    width: 120,
    height: 88,
  },
  thumbPlaceholder: {
    width: 120,
    height: 88,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  rowInfo: {
    flex: 1,
    padding: spacing[3],
    gap: 3,
  },
  rowTitle: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
  },
  rowCity: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  rowPrice: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.primary,
  },
  rowTags: {
    flexDirection: "row",
    gap: spacing[1],
    marginTop: 2,
    flexWrap: "wrap",
    alignItems: "center",
  },
  pendingBadge: {
    backgroundColor: colors.warningLight,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.warning + "55",
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  pendingBadgeText: {
    color: colors.warning,
    fontSize: fontSize.xs,
    fontWeight: "700",
  },
  rowActions: {
    padding: spacing[2],
    gap: spacing[2],
    justifyContent: "center",
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.gray100,
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    bottom: spacing[6],
    right: spacing[5],
    minHeight: 56,
    borderRadius: 28,
    paddingHorizontal: spacing[4],
    backgroundColor: colors.primary,
    flexDirection: "row",
    gap: spacing[2],
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: colors.white, fontSize: 24, lineHeight: 28, fontWeight: "700" },
  fabLabel: { color: colors.white, fontSize: fontSize.sm, fontWeight: "700" },
  limitBanner: {
    margin: spacing[4],
    marginBottom: 0,
    padding: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.purple + "44",
    backgroundColor: colors.purpleLight,
  },
  limitInfoTitle: { color: colors.purple, fontWeight: "700", fontSize: fontSize.sm },
  limitInfoText: { color: colors.purple, fontSize: fontSize.xs, marginTop: 2 },
});
