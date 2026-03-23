import { router } from "expo-router";
import { useState } from "react";
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
import { useMyListings, useUpdateListingStatus } from "../../src/hooks/useListings";
import { useMyProperties } from "../../src/hooks/useProperties";
import { useIsSuperfriendz } from "../../src/hooks/useSubscription";
import { useAuth } from "../../src/providers/AuthProvider";
import { colors, fontSize, radius, spacing } from "../../src/theme";
import type { Database, ListingStatus } from "../../src/types/database";

type Listing = Database["public"]["Tables"]["listings"]["Row"];
type Tab = ListingStatus;

const TABS: { key: Tab; label: string }[] = [
  { key: "active", label: "Activos" },
  { key: "paused", label: "Pausados" },
  { key: "rented", label: "Archivados" },
];

export default function MyListingsScreen() {
  const { session } = useAuth();
  const [tab, setTab] = useState<Tab>("active");
  const { data: listings, isLoading } = useMyListings(session?.user?.id);
  const { data: myProperties = [] } = useMyProperties(session?.user?.id);
  const updateStatus = useUpdateListingStatus();
  const { data: isSuper = false } = useIsSuperfriendz();

  const freeHasOneProperty = !isSuper && myProperties.length >= 1;
  const filtered = (listings ?? []).filter((l) => l.status === tab);

  return (
    <View style={styles.screen}>
      <View style={styles.tabs}>
        {TABS.map((t) => {
          const count = (listings ?? []).filter((l) => l.status === t.key).length;
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

      {isLoading ? (
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
              onPress={() => router.push(`/listing/${item.id}`)}
              onEdit={() => router.push(`/listing/${item.id}/edit`)}
              onToggleStatus={() =>
                updateStatus.mutateAsync({
                  id: item.id,
                  status: item.status === "active" ? "paused" : "active",
                })
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={tab === "active" ? "[]" : tab === "paused" ? "||" : "H"}
              title={
                tab === "active"
                  ? "No tienes anuncios activos"
                  : tab === "paused"
                    ? "No tienes anuncios pausados"
                    : "Sin anuncios archivados"
              }
              subtitle={tab === "active" ? "Publica tu primer anuncio." : undefined}
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

      <Pressable
        style={styles.fab}
        onPress={() => {
          router.push("/listing/new");
        }}
        accessibilityLabel="Nuevo anuncio"
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

function MyListingRow({
  listing,
  onPress,
  onEdit,
  onToggleStatus,
}: {
  listing: Listing;
  onPress: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
}) {
  const cover = (listing.images as string[])[0];
  const canToggle = listing.status === "active" || listing.status === "paused";

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
        <Text style={styles.rowCity}>{listing.city}</Text>
        <Text style={styles.rowPrice}>EUR {listing.price}/mes</Text>
        <View style={styles.rowTags}>
          <TagBadge
            label={listing.type === "offer" ? "Ofrezco" : "Busco"}
            variant="primary"
          />
        </View>
      </View>

      <View style={styles.rowActions}>
        <Pressable style={styles.actionBtn} onPress={onEdit}>
          <Text style={styles.actionBtnText}>E</Text>
        </Pressable>
        {canToggle && (
          <Pressable style={styles.actionBtn} onPress={onToggleStatus}>
            <Text style={styles.actionBtnText}>{listing.status === "active" ? "||" : ">"}</Text>
          </Pressable>
        )}
      </View>
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
    width: 88,
    height: 88,
  },
  thumbPlaceholder: {
    width: 88,
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
  actionBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  fab: {
    position: "absolute",
    bottom: spacing[6],
    right: spacing[5],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: colors.white, fontSize: 28, lineHeight: 32 },
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
