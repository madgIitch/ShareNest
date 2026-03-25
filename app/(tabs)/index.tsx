import { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoomListings } from "../../src/hooks/useRoomListings";
import { useFiltersStore } from "../../src/stores/filtersStore";
import RoomCard from "../../src/components/listing/RoomCard";
import RoomCardSkeleton from "../../src/components/listing/RoomCardSkeleton";
import Sheet from "../../src/components/ui/Sheet";
import type { RoomListing } from "../../src/types";
import { DEFAULT_CENTER } from "../../src/constants/config";

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

  const listings = useMemo(
    () => data?.pages.flatMap((p) => p) ?? [],
    [data]
  );

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
    <View className="flex-1 bg-gray-50">
      {/* Filter bar */}
      <View className="bg-white border-b border-gray-100 pt-12 pb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
          <FilterChip
            label="Ciudad"
            active={!!filters.city_id}
            onPress={() => {}}
          />
          <FilterChip
            label="Precio"
            active={!!(filters.price_min || filters.price_max)}
            onPress={() => {}}
          />
          <FilterChip
            label="Mascotas"
            active={filters.allows_pets === true}
            onPress={() =>
              filters.setFilter("allows_pets", filters.allows_pets ? null : true)
            }
          />
          <FilterChip
            label="Fumadores"
            active={filters.allows_smoking === true}
            onPress={() =>
              filters.setFilter("allows_smoking", filters.allows_smoking ? null : true)
            }
          />
        </ScrollView>
      </View>

      {/* Content */}
      {mode === "list" ? (
        <FlatList
          className="flex-1"
          contentContainerClassName="px-4 py-4"
          data={isLoading ? Array(6).fill(null) : listings}
          keyExtractor={(item, index) => item?.id ?? String(index)}
          renderItem={({ item }) =>
            item ? (
              <RoomCard listing={item} onPress={() => setSelectedListing(item)} />
            ) : (
              <RoomCardSkeleton />
            )
          }
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? <RoomCardSkeleton /> : null
          }
          ListEmptyComponent={
            !isLoading ? (
              <View className="items-center py-20">
                <Ionicons name="home-outline" size={48} color="#9CA3AF" />
                <Text className="text-gray-400 mt-4 text-center">
                  No hay anuncios disponibles
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        <View className="flex-1">
          <MapViewLoader
            markers={mapMarkers}
            onMarkerPress={(id) => {
              const l = listings.find((x) => x.id === id);
              if (l) setSelectedListing(l);
            }}
          />
        </View>
      )}

      {/* Toggle button */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-indigo-600 rounded-full px-5 py-3 flex-row items-center gap-2 shadow-lg"
        onPress={() => setMode(mode === "list" ? "map" : "list")}
      >
        <Ionicons
          name={mode === "list" ? "map-outline" : "list-outline"}
          size={18}
          color="white"
        />
        <Text className="text-white font-semibold">
          {mode === "list" ? "Mapa" : "Lista"}
        </Text>
      </TouchableOpacity>

      {/* Bottom sheet for selected listing */}
      <Sheet visible={!!selectedListing} onClose={() => setSelectedListing(null)}>
        {selectedListing && (
          <RoomCard listing={selectedListing} compact />
        )}
      </Sheet>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className={`mr-2 px-4 py-2 rounded-full border ${
        active ? "bg-indigo-500 border-indigo-500" : "bg-white border-gray-200"
      }`}
      onPress={onPress}
    >
      <Text
        className={`text-sm font-medium ${active ? "text-white" : "text-gray-700"}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function MapViewLoader({
  markers,
  onMarkerPress,
}: {
  markers: any[];
  onMarkerPress: (id: string) => void;
}) {
  const [MapViewComponent, setMapViewComponent] = useState<React.ComponentType<any> | null>(null);

  if (Platform.OS === "web" && !MapViewComponent) {
    import("../../src/components/map/MapView").then((m) =>
      setMapViewComponent(() => m.default)
    );
  }

  if (!MapViewComponent) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-400">Cargando mapa...</Text>
      </View>
    );
  }

  return (
    <MapViewComponent
      initialRegion={{
        latitude: DEFAULT_CENTER.lat,
        longitude: DEFAULT_CENTER.lng,
        zoom: 6,
      }}
      markers={markers.map((m) => ({
        ...m,
        onPress: () => onMarkerPress(m.id),
      }))}
      style={{ flex: 1 }}
    />
  );
}
