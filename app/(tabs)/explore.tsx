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
import { getSavedListingIds, toggleSavedListing } from "../../src/lib/savedListings";
import { colors, fontSize, radius, spacing } from "../../src/theme";
import { DEFAULT_FILTERS, countActiveFilters } from "../../src/types/filters";
import type { ListingFilters } from "../../src/types/filters";
import { COMMON_AREA_LABELS, type CommonAreaType } from "../../src/types/room";
import type { ListingWithProperty } from "../../src/types/listingWithProperty";

type ListingRow = ListingWithProperty & {
  city_name?: string | null;
  room_photos?: unknown;
  property_photos?: unknown;
  images?: string[] | null;
};

type ViewMode = "list" | "map";

function readImageUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && typeof (item as Record<string, unknown>).url === "string") {
        return String((item as Record<string, unknown>).url);
      }
      return "";
    })
    .filter(Boolean);
}

function getCoverImage(row: ListingRow): string | null {
  return readImageUrls(row.room_photos)[0] ?? readImageUrls(row.property_photos)[0] ?? row.images?.[0] ?? null;
}

export default function ExploreScreen() {
  const { session } = useAuth();
  const { data: friendz = [] } = useMyFriendz(session?.user?.id);
  const friendzIds = new Set(friendz.map((f) => f.id));

  const [filters, setFilters] = useState<ListingFilters>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [queryInput, setQueryInput] = useState("");
  const [savedListingIds, setSavedListingIds] = useState<string[]>([]);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleQueryChange = (text: string) => {
    setQueryInput(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setFilters((f) => ({ ...f, query: text }));
    }, 400);
  };

  useEffect(() => {
    loadFilters().then((saved) => {
      const normalized = {
        ...DEFAULT_FILTERS,
        ...saved,
        commonAreas: saved.commonAreas ?? [],
      };
      setFilters(normalized);
      setQueryInput(normalized.query);
    });
    getSavedListingIds().then(setSavedListingIds);
  }, []);

  const handleToggleSaved = async (listingId: string) => {
    const { ids } = await toggleSavedListing(listingId);
    setSavedListingIds(ids);
  };

  const activeFilterCount = countActiveFilters(filters);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useSearchListings(filters);
  const allListings = data?.pages.flatMap((p) => p.items) ?? [];

  const { data: mapListings = [] } = useListingsForMap(filters, viewMode === "map");

  const mapPins: ListingPinData[] = mapListings
    .filter((l) => l.lat != null && l.lng != null)
    .map((l) => {
      const row = l as ListingRow;
      return {
        id: l.id,
        privacyLevel: 1,
        location: { lat: l.lat!, lng: l.lng! },
        price: l.price,
        currency: "€",
        metadata: {
          title: l.title,
          city: row.city_name ?? row.city ?? "",
          type: l.type,
          image_url: getCoverImage(row),
        },
      };
    });

  const handleApplyFilters = (newFilters: ListingFilters) => {
    setFilters(newFilters);
    setQueryInput(newFilters.query);
    saveFilters(newFilters);
  };

  const removeFilter = (key: keyof ListingFilters) => {
    const updated =
      key === "city"
        ? { ...filters, city: "", cityId: undefined, placeId: undefined }
        : key === "lat"
          ? { ...filters, lat: undefined, lng: undefined }
        : { ...filters, [key]: DEFAULT_FILTERS[key] };
    setFilters(updated);
    saveFilters(updated);
    if (key === "query") setQueryInput("");
  };

  const removeCommonArea = (area: CommonAreaType) => {
    const updated = {
      ...filters,
      commonAreas: filters.commonAreas.filter((item) => item !== area),
    };
    setFilters(updated);
    saveFilters(updated);
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
            <Pressable
              onPress={() => {
                setQueryInput("");
                setFilters((f) => ({ ...f, query: "" }));
              }}
              hitSlop={8}
            >
              <Text style={styles.clearIcon}>×</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => setFilterSheetOpen(true)}
        >
          <Text style={styles.filterBtnIcon}>⚙</Text>
          <Text style={[styles.filterBtnLabel, activeFilterCount > 0 && styles.filterBtnLabelActive]}>
            Filtrar
          </Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.viewToggle}>
          <Pressable
            style={[styles.toggleBtn, viewMode === "list" && styles.toggleBtnActive]}
            onPress={() => setViewMode("list")}
          >
            <Text style={[styles.toggleText, viewMode === "list" && styles.toggleTextActive]}>📋 Lista</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, viewMode === "map" && styles.toggleBtnActive]}
            onPress={() => setViewMode("map")}
          >
            <Text style={[styles.toggleText, viewMode === "map" && styles.toggleTextActive]}>🗺 Mapa</Text>
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
              📍 {filters.radiusKm} km ×
            </Text>
          </Pressable>
        )}
      </View>

      {activeFilterCount > 0 && (
        <ActiveChips
          filters={filters}
          onRemove={removeFilter}
          onRemoveCommonArea={removeCommonArea}
        />
      )}

      {viewMode === "list" ? (
        <>
          {isLoading ? (
            <View style={styles.list}>
              {[1, 2, 3].map((i) => (
                <ListingCardSkeleton key={i} />
              ))}
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
              renderItem={({ item }) => {
                const row = item as ListingRow;
                return (
                  <ListingCard
                    listing={{
                      id: item.id,
                      owner_id: item.owner_id,
                      title: item.title,
                      price: item.price,
                      city: row.city_name ?? row.city ?? "",
                      type: item.type,
                      image_url: getCoverImage(row),
                    }}
                    viewerId={session?.user?.id}
                    connectionDegree={
                      item.owner_id === session?.user?.id
                        ? null
                        : friendzIds.has(item.owner_id)
                          ? 1
                          : null
                    }
                    isSaved={savedListingIds.includes(item.id)}
                    onToggleSaved={handleToggleSaved}
                    onPress={() => router.push(`/listing/${item.id}`)}
                  />
                );
              }}
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
        <ListingsMap listings={mapPins} onPinPress={(pin) => router.push(`/listing/${pin.id}`)} />
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

function ActiveChips({
  filters,
  onRemove,
  onRemoveCommonArea,
}: {
  filters: ListingFilters;
  onRemove: (key: keyof ListingFilters) => void;
  onRemoveCommonArea: (area: CommonAreaType) => void;
}) {
  const chips: { key: string; label: string; onPress: () => void }[] = [];

  if (filters.city) {
    chips.push({ key: "city", label: `📍 ${filters.city}`, onPress: () => onRemove("city") });
  }
  if (filters.type) {
    chips.push({
      key: "type",
      label: filters.type === "offer" ? "Ofrezco" : "Busco",
      onPress: () => onRemove("type"),
    });
  }
  if (filters.priceMin !== undefined) {
    chips.push({
      key: "priceMin",
      label: `≥ €${filters.priceMin}`,
      onPress: () => onRemove("priceMin"),
    });
  }
  if (filters.priceMax !== undefined) {
    chips.push({
      key: "priceMax",
      label: `≤ €${filters.priceMax}`,
      onPress: () => onRemove("priceMax"),
    });
  }
  if (filters.sizeMin !== undefined) {
    chips.push({
      key: "sizeMin",
      label: `≥ ${filters.sizeMin} m²`,
      onPress: () => onRemove("sizeMin"),
    });
  }
  if (filters.availableFrom) {
    chips.push({
      key: "availableFrom",
      label: `Hasta ${filters.availableFrom}`,
      onPress: () => onRemove("availableFrom"),
    });
  }
  if (filters.petsAllowed !== undefined) {
    chips.push({
      key: "petsAllowed",
      label: filters.petsAllowed ? "🐾 Mascotas" : "🚫 Sin mascotas",
      onPress: () => onRemove("petsAllowed"),
    });
  }
  if (filters.smokersAllowed !== undefined) {
    chips.push({
      key: "smokersAllowed",
      label: filters.smokersAllowed ? "🚬 Fumadores" : "🚭 No fumadores",
      onPress: () => onRemove("smokersAllowed"),
    });
  }

  if (chips.length === 0 && filters.commonAreas.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {chips.map(({ key, label, onPress }) => (
        <Pressable key={key} style={styles.chip} onPress={onPress}>
          <Text style={styles.chipText}>{label}</Text>
          <Text style={styles.chipX}> ×</Text>
        </Pressable>
      ))}
      {filters.commonAreas.map((area) => {
        const meta = COMMON_AREA_LABELS[area];
        return (
          <Pressable key={area} style={styles.chip} onPress={() => onRemoveCommonArea(area)}>
            <Text style={styles.chipText}>
              {meta.icon} {meta.label}
            </Text>
            <Text style={styles.chipX}> ×</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
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
  searchIcon: { fontSize: 14 },
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
    minWidth: 92,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing[3],
    flexDirection: "row",
    gap: spacing[1],
    justifyContent: "center",
    alignItems: "center",
  },
  filterBtnActive: {
    backgroundColor: colors.primaryLight,
  },
  filterBtnIcon: {
    fontSize: 16,
  },
  filterBtnLabel: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  filterBtnLabelActive: {
    color: colors.primaryDark,
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
  list: {
    padding: spacing[4],
    gap: spacing[3],
  },
});
