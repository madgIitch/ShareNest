import { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
  StyleSheet,
  TextInput,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoomListings } from "../../src/hooks/useRoomListings";
import { useFiltersStore } from "../../src/stores/filtersStore";
import RoomCard from "../../src/components/listing/RoomCard";
import RoomCardSkeleton from "../../src/components/listing/RoomCardSkeleton";
import type { RoomListing } from "../../src/types";
import { DEFAULT_CENTER } from "../../src/constants/config";
import MapView from "../../src/components/map/MapView";

type ViewMode = "map" | "list";

const QUICK_FILTERS = [
  { key: "madrid", label: "Madrid" },
  { key: "price", label: "≤700€" },
  { key: "pets", label: "Mascotas" },
  { key: "available", label: "Disponible ya" },
  { key: "nosmoking", label: "No fumadores" },
];

export default function ExploreScreen() {
  const [mode, setMode] = useState<ViewMode>("list");
  const [selectedListing, setSelectedListing] = useState<RoomListing | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(["madrid"]));
  const [search, setSearch] = useState("");
  const filters = useFiltersStore();

  const { data, isLoading, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useRoomListings({
      p_city_id: filters.city_id ?? undefined,
      p_place_id: filters.place_id ?? undefined,
      p_price_min: filters.price_min ?? undefined,
      p_price_max: filters.price_max ?? undefined,
      p_allows_pets: filters.allows_pets ?? undefined,
      p_allows_smoking: filters.allows_smoking ?? undefined,
      p_available_from: filters.available_from ?? undefined,
    });

  const listings = useMemo(() => data?.pages.flatMap((p) => p) ?? [], [data]);

  const mapMarkers = useMemo(
    () =>
      listings
        .filter((l) => l.lat && l.lng)
        .map((l) => ({
          id: l.id,
          latitude: l.lat!,
          longitude: l.lng!,
          price: l.price,
          selected: selectedListing?.id === l.id,
          onPress: () => setSelectedListing(l),
        })),
    [listings, selectedListing]
  );

  const toggleFilter = (key: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#111111" />

      {/* ── Header ── */}
      <SafeAreaView style={s.safeTop} edges={["top"]}>
        <View style={s.header}>
          <Text style={s.logo}>homimatch</Text>
          <TouchableOpacity style={s.avatarBtn} activeOpacity={0.7}>
            <Ionicons name="person-circle-outline" size={30} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={s.searchRow}>
          <View style={s.searchBar}>
            <Ionicons name="search-outline" size={17} color="#555" />
            <TextInput
              style={s.searchInput}
              placeholder="Busca por ciudad o barrio..."
              placeholderTextColor="#444"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color="#555" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={s.filterIconBtn} activeOpacity={0.7}>
            <Ionicons name="options-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Quick filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipsScroll}
        >
          {QUICK_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[s.chip, activeFilters.has(f.key) && s.chipActive]}
              onPress={() => toggleFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[s.chipText, activeFilters.has(f.key) && s.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Map / Lista segmented toggle */}
        <View style={s.segmentRow}>
          <View style={s.segment}>
            <TouchableOpacity
              style={[s.segBtn, mode === "map" && s.segBtnActive]}
              onPress={() => setMode("map")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="map-outline"
                size={14}
                color={mode === "map" ? "#fff" : "#666"}
              />
              <Text style={[s.segText, mode === "map" && s.segTextActive]}>Mapa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.segBtn, mode === "list" && s.segBtnActive]}
              onPress={() => setMode("list")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="list-outline"
                size={14}
                color={mode === "list" ? "#fff" : "#666"}
              />
              <Text style={[s.segText, mode === "list" && s.segTextActive]}>Lista</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Content ── */}
      {mode === "list" ? (
        <FlatList
          style={s.list}
          contentContainerStyle={s.listContent}
          data={isLoading ? (Array(5).fill(null) as null[]) : listings}
          keyExtractor={(item, index) => item?.id ?? String(index)}
          renderItem={({ item }) =>
            item ? (
              <RoomCard listing={item} onPress={() => setSelectedListing(item)} />
            ) : (
              <RoomCardSkeleton />
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={isLoading && !!data}
              onRefresh={refetch}
              tintColor="#F36A39"
              colors={["#F36A39"]}
            />
          }
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            !isLoading && listings.length > 0 ? (
              <Text style={s.countText}>
                {listings.length} habitaciones · Madrid
              </Text>
            ) : null
          }
          ListFooterComponent={isFetchingNextPage ? <RoomCardSkeleton /> : null}
          ListEmptyComponent={
            !isLoading ? (
              <View style={s.empty}>
                <Ionicons name="home-outline" size={44} color="#333" />
                <Text style={s.emptyTitle}>Sin resultados</Text>
                <Text style={s.emptySubtitle}>
                  Prueba a cambiar los filtros o buscar otra zona
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        <View style={s.mapWrap}>
          {Platform.OS !== "web" ? (
            <MapView
              initialRegion={{
                latitude: DEFAULT_CENTER.lat,
                longitude: DEFAULT_CENTER.lng,
              }}
              markers={mapMarkers}
              style={{ flex: 1 }}
            />
          ) : (
            <View style={s.mapPlaceholder}>
              <Ionicons name="map-outline" size={40} color="#333" />
              <Text style={s.mapPlaceholderText}>Mapa no disponible en web</Text>
            </View>
          )}

          {/* Bottom panel — selected listing */}
          {selectedListing && (
            <View style={s.mapPanel}>
              <View style={s.mapPanelHandle} />
              <View style={s.mapPanelHeader}>
                <Text style={s.mapPanelLabel}>Seleccionada</Text>
                <TouchableOpacity onPress={() => setSelectedListing(null)} hitSlop={12}>
                  <Ionicons name="close" size={18} color="#666" />
                </TouchableOpacity>
              </View>
              <RoomCard listing={selectedListing} compact onPress={() => {}} />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#111111" },

  // Header
  safeTop: { backgroundColor: "#111111" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  logo: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1E1E1E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },

  // Search
  searchRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    height: 44,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#fff",
    height: "100%",
  },
  filterIconBtn: {
    width: 44,
    height: 44,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
  },

  // Chips
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  chipActive: {
    backgroundColor: "#F36A39",
    borderColor: "#F36A39",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#777",
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },

  // Segment
  segmentRow: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    alignItems: "flex-start",
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: "#222",
  },
  segBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
  },
  segBtnActive: {
    backgroundColor: "#2A2A2A",
  },
  segText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#555",
  },
  segTextActive: {
    color: "#fff",
    fontWeight: "600",
  },

  // List view
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 4,
  },
  countText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#555",
    marginBottom: 16,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#444",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    paddingHorizontal: 40,
  },

  // Map view
  mapWrap: { flex: 1, position: "relative" },
  mapPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  mapPlaceholderText: { color: "#444", fontSize: 14 },
  mapPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#111111",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#222",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 16,
  },
  mapPanelHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#333",
    alignSelf: "center",
    marginBottom: 14,
  },
  mapPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  mapPanelLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
