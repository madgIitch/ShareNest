import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { EmptyState } from "../../src/components/ui/EmptyState";
import { ListingCard } from "../../src/components/ui/ListingCard";
import { ListingCardSkeleton } from "../../src/components/ui/Skeleton";
import { FilterSheet } from "../../src/components/explore/FilterSheet";
import { ListingsMap } from "../../src/components/explore/ListingsMap";
import type { ListingPinData } from "../../src/components/explore/ListingsMap";
import { useSearchListings, useListingsForMap } from "../../src/hooks/useSearchListings";
import { useMyFriendz } from "../../src/hooks/useConnections";
import { useAuth } from "../../src/providers/AuthProvider";
import { loadFilters, saveFilters } from "../../src/lib/filterStorage";
import { colors, fontSize, radius, spacing } from "../../src/theme";
import { DEFAULT_FILTERS, countActiveFilters } from "../../src/types/filters";
import type { ListingFilters } from "../../src/types/filters";
import type { Database } from "../../src/types/database";

type Listing = Database["public"]["Tables"]["listings"]["Row"];

type ViewMode = "list" | "map";

export default function ExploreScreen() {
  const { session } = useAuth();
  const { data: friendz = [] } = useMyFriendz(session?.user?.id);
  const friendzIds = new Set(friendz.map((f) => f.id));

  const [filters, setFilters] = useState<ListingFilters>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [queryInput, setQueryInput] = useState(""); // raw text input

  // Debounced query — fires 400ms after typing stops
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleQueryChange = (text: string) => {
    setQueryInput(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setFilters((f) => ({ ...f, query: text }));
    }, 400);
  };

  // Load saved filters on mount
  useEffect(() => {
    loadFilters().then((saved) => {
      setFilters(saved);
      setQueryInput(saved.query);
    });
  }, []);

  const activeFilterCount = countActiveFilters(filters);

  // List view: cursor-based infinite query
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useSearchListings(filters);

  const allListings = data?.pages.flatMap((p) => p.items) ?? [];

  // Map view: bulk geo query (only when map is visible)
  const { data: mapListings = [] } = useListingsForMap(filters, viewMode === "map");

  const mapPins: ListingPinData[] = mapListings
    .filter((l) => l.lat != null && l.lng != null)
    .map((l) => ({
      id: l.id,
      privacyLevel: 1,
      location: { lat: l.lat!, lng: l.lng! },
      price: l.price,
      currency: "€",
      metadata: {
        title: l.title,
        city: l.city,
        type: l.type,
        image_url: (l.images as string[])[0] ?? null,
      },
    }));

  const handleApplyFilters = (newFilters: ListingFilters) => {
    setFilters(newFilters);
    setQueryInput(newFilters.query);
    saveFilters(newFilters);
  };

  const removeFilter = (key: keyof ListingFilters) => {
    const updated = { ...filters, [key]: DEFAULT_FILTERS[key] };
    setFilters(updated);
    saveFilters(updated);
    if (key === "query") setQueryInput("");
  };

  const handleEnableGeo = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const updated = {
        ...filters,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        radiusKm: filters.radiusKm,
      };
      setFilters(updated);
      saveFilters(updated);
    } catch {
      // silently ignore
    }
  };

  return (
    <View style={styles.screen}>
      {/* ── Search bar + filter button ─────────────────────────────── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por título, ciudad..."
            placeholderTextColor={colors.textTertiary}
            value={queryInput}
            onChangeText={handleQueryChange}
            returnKeyType="search"
            autoCorrect={false}
          />
          {queryInput.length > 0 && (
            <Pressable onPress={() => { setQueryInput(""); setFilters((f) => ({ ...f, query: "" })); }} hitSlop={8}>
              <Text style={styles.clearIcon}>✕</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => setFilterSheetOpen(true)}
        >
          <Text style={styles.filterBtnIcon}>⚙</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* ── View toggle + geo button ───────────────────────────────── */}
      <View style={styles.toolbar}>
        <View style={styles.viewToggle}>
          <Pressable
            style={[styles.toggleBtn, viewMode === "list" && styles.toggleBtnActive]}
            onPress={() => setViewMode("list")}
          >
            <Text style={[styles.toggleText, viewMode === "list" && styles.toggleTextActive]}>
              📋 Lista
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, viewMode === "map" && styles.toggleBtnActive]}
            onPress={() => setViewMode("map")}
          >
            <Text style={[styles.toggleText, viewMode === "map" && styles.toggleTextActive]}>
              🗺 Mapa
            </Text>
          </Pressable>
        </View>

        {filters.lat == null && (
          <Pressable style={styles.geoBtn} onPress={handleEnableGeo}>
            <Text style={styles.geoBtnText}>📍 Cerca de mí</Text>
          </Pressable>
        )}
        {filters.lat != null && (
          <Pressable style={[styles.geoBtn, styles.geoBtnActive]} onPress={() => removeFilter("lat")}>
            <Text style={[styles.geoBtnText, styles.geoBtnTextActive]}>
              📍 {filters.radiusKm} km ✕
            </Text>
          </Pressable>
        )}
      </View>

      {/* ── Active filter chips ────────────────────────────────────── */}
      {activeFilterCount > 0 && (
        <ActiveChips filters={filters} onRemove={removeFilter} />
      )}

      {/* ── Content ───────────────────────────────────────────────── */}
      {viewMode === "list" ? (
        <>
          {isLoading ? (
            <View style={styles.list}>
              {[1, 2, 3].map((i) => <ListingCardSkeleton key={i} />)}
            </View>
          ) : (
            <FlatList
              data={allListings}
              keyExtractor={(item) => item.id}
              contentContainerStyle={allListings.length === 0 ? { flex: 1 } : styles.list}
              refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
              }
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) fetchNextPage();
              }}
              onEndReachedThreshold={0.3}
              renderItem={({ item }) => (
                <ListingCard
                  listing={{
                    id: item.id,
                    title: item.title,
                    price: item.price,
                    city: item.city,
                    type: item.type,
                    image_url: (item.images as string[])[0] ?? null,
                  }}
                  connectionDegree={
                    item.owner_id === session?.user?.id
                      ? null
                      : friendzIds.has(item.owner_id)
                        ? 1
                        : null
                  }
                  onPress={() => router.push(`/listing/${item.id}`)}
                />
              )}
              ListFooterComponent={
                isFetchingNextPage ? (
                  <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing[4] }} />
                ) : null
              }
              ListEmptyComponent={
                <EmptyState
                  icon="🏡"
                  title="Sin resultados"
                  subtitle={
                    activeFilterCount > 0
                      ? "Prueba a ajustar los filtros."
                      : "Aún no hay anuncios. ¡Sé el primero!"
                  }
                  action={
                    activeFilterCount > 0
                      ? { label: "Limpiar filtros", onPress: () => handleApplyFilters(DEFAULT_FILTERS) }
                      : undefined
                  }
                />
              }
            />
          )}
        </>
      ) : (
        <ListingsMap
          listings={mapPins}
          onPinPress={(pin) => router.push(`/listing/${pin.id}`)}
        />
      )}

      <FilterSheet
        visible={filterSheetOpen}
        filters={filters}
        onClose={() => setFilterSheetOpen(false)}
        onApply={handleApplyFilters}
      />
    </View>
  );
}

// ─── Active filter chips ───────────────────────────────────────────────────────

function ActiveChips({
  filters,
  onRemove,
}: {
  filters: ListingFilters;
  onRemove: (key: keyof ListingFilters) => void;
}) {
  const chips: { key: keyof ListingFilters; label: string }[] = [];

  if (filters.city) chips.push({ key: "city", label: `📍 ${filters.city}` });
  if (filters.type) chips.push({ key: "type", label: filters.type === "offer" ? "Ofrezco" : "Busco" });
  if (filters.priceMin !== undefined) chips.push({ key: "priceMin", label: `≥ €${filters.priceMin}` });
  if (filters.priceMax !== undefined) chips.push({ key: "priceMax", label: `≤ €${filters.priceMax}` });
  if (filters.sizeMin !== undefined) chips.push({ key: "sizeMin", label: `≥ ${filters.sizeMin} m²` });
  if (filters.availableFrom) chips.push({ key: "availableFrom", label: `Hasta ${filters.availableFrom}` });
  if (filters.petsAllowed !== undefined) chips.push({ key: "petsAllowed", label: filters.petsAllowed ? "🐾 Mascotas" : "🚫 Sin mascotas" });
  if (filters.smokersAllowed !== undefined) chips.push({ key: "smokersAllowed", label: filters.smokersAllowed ? "🚬 Fumadores" : "🚭 No fumadores" });

  if (chips.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
    >
      {chips.map(({ key, label }) => (
        <Pressable key={key} style={styles.chip} onPress={() => onRemove(key)}>
          <Text style={styles.chipText}>{label}</Text>
          <Text style={styles.chipX}> ✕</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  // Search row
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing[2],
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    padding: 0,
  },
  clearIcon: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: "700",
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.gray100,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBtnActive: {
    backgroundColor: colors.primaryLight,
  },
  filterBtnIcon: {
    fontSize: 16,
  },
  filterBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  filterBadgeText: {
    fontSize: 9,
    color: colors.white,
    fontWeight: "700",
  },

  // Toolbar
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing[2],
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: colors.gray100,
    borderRadius: radius.full,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 2,
    borderRadius: radius.full,
  },
  toggleBtnActive: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.text,
  },
  geoBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 2,
    borderRadius: radius.full,
    backgroundColor: colors.gray100,
  },
  geoBtnActive: {
    backgroundColor: colors.primaryLight,
  },
  geoBtnText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  geoBtnTextActive: {
    color: colors.primaryDark,
  },

  // Active filter chips
  chips: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    gap: spacing[2],
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  chipText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.primaryDark,
  },
  chipX: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: "700",
  },

  // List
  list: {
    padding: spacing[4],
    gap: spacing[3],
  },
});
