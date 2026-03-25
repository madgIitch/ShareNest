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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoomListings } from "../../src/hooks/useRoomListings";
import { useFiltersStore } from "../../src/stores/filtersStore";
import RoomCard from "../../src/components/listing/RoomCard";
import RoomCardSkeleton from "../../src/components/listing/RoomCardSkeleton";
import Sheet from "../../src/components/ui/Sheet";
import type { RoomListing } from "../../src/types";
import { DEFAULT_CENTER } from "../../src/constants/config";
import MapView from "../../src/components/map/MapView";

type ViewMode = "map" | "list";

export default function ExploreScreen() {
  const [mode, setMode] = useState<ViewMode>("list");
  const [selectedListing, setSelectedListing] = useState<RoomListing | null>(null);
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
          onPress: () => setSelectedListing(l),
        })),
    [listings]
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <FilterChip label="Ciudad" active={!!filters.city_id} onPress={() => {}} />
          <FilterChip label="Precio" active={!!(filters.price_min || filters.price_max)} onPress={() => {}} />
          <FilterChip
            label="Mascotas"
            active={filters.allows_pets === true}
            onPress={() => filters.setFilter("allows_pets", filters.allows_pets ? null : true)}
          />
          <FilterChip
            label="Fumadores"
            active={filters.allows_smoking === true}
            onPress={() => filters.setFilter("allows_smoking", filters.allows_smoking ? null : true)}
          />
        </ScrollView>
      </View>

      {mode === "list" ? (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={isLoading ? Array(6).fill(null) : listings}
          keyExtractor={(item, index) => item?.id ?? String(index)}
          renderItem={({ item }) =>
            item ? (
              <RoomCard listing={item} onPress={() => setSelectedListing(item)} />
            ) : (
              <RoomCardSkeleton />
            )
          }
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isFetchingNextPage ? <RoomCardSkeleton /> : null}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyState}>
                <Ionicons name="home-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No hay anuncios disponibles</Text>
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.list}>
          <MapViewLoader
            markers={mapMarkers}
            onMarkerPress={(id) => {
              const l = listings.find((x) => x.id === id);
              if (l) setSelectedListing(l);
            }}
          />
        </View>
      )}

      <TouchableOpacity
        style={styles.toggleBtn}
        onPress={() => setMode(mode === "list" ? "map" : "list")}
      >
        <Ionicons
          name={mode === "list" ? "map-outline" : "list-outline"}
          size={18}
          color="white"
        />
        <Text style={styles.toggleBtnText}>{mode === "list" ? "Mapa" : "Lista"}</Text>
      </TouchableOpacity>

      <Sheet visible={!!selectedListing} onClose={() => setSelectedListing(null)}>
        {selectedListing && <RoomCard listing={selectedListing} compact />}
      </Sheet>
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function MapViewLoader({ markers, onMarkerPress }: { markers: any[]; onMarkerPress: (id: string) => void }) {
  if (Platform.OS === "web" && !MapView) {
    return (
      <View style={styles.mapLoader}>
        <Text style={styles.mapLoaderText}>Cargando mapa...</Text>
      </View>
    );
  }
  return (
    <MapView
      initialRegion={{ latitude: DEFAULT_CENTER.lat, longitude: DEFAULT_CENTER.lng, zoom: 6 }}
      markers={markers.map((m) => ({ ...m, onPress: () => onMarkerPress(m.id) }))}
      style={{ flex: 1 }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  filterBar: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F3F4F6", paddingTop: 48, paddingBottom: 8 },
  filterScroll: { paddingHorizontal: 16 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingVertical: 16 },
  emptyState: { alignItems: "center", paddingVertical: 80 },
  emptyText: { color: "#9CA3AF", marginTop: 16, textAlign: "center" },
  toggleBtn: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#4F46E5",
    borderRadius: 9999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  toggleBtnText: { color: "#fff", fontWeight: "600" },
  chip: { marginRight: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, borderWidth: 1 },
  chipActive: { backgroundColor: "#6366F1", borderColor: "#6366F1" },
  chipInactive: { backgroundColor: "#fff", borderColor: "#E5E7EB" },
  chipText: { fontSize: 14, fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  chipTextInactive: { color: "#374151" },
  mapLoader: { flex: 1, alignItems: "center", justifyContent: "center" },
  mapLoaderText: { color: "#9CA3AF" },
});
