// src/components/explore/ListingsMap.tsx
// Map using MapLibre GL + OpenFreeMap tiles — no account, no API key.
// Install: npx expo install @maplibre/maplibre-react-native
// In app.config.ts plugins add: "@maplibre/maplibre-react-native"
import MapLibreGL from "@maplibre/maplibre-react-native";
import { useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Supercluster from "supercluster";
import { router } from "expo-router";
import { ListingCard } from "../ui/ListingCard";
import { colors, fontSize, radius, spacing } from "../../theme";
import type { Database } from "../../types/database";

type Listing = Database["public"]["Tables"]["listings"]["Row"];
type PointProps = { listing: Listing };

// No API key needed — OpenFreeMap is free and open source
MapLibreGL.setAccessToken(null);

// CARTO free vector styles — no account, no API key, Mapbox-quality visuals
// Options (swap to taste):
//   Voyager  (colorful, similar to Mapbox Streets): https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json
//   Positron (clean white, minimal):                https://basemaps.cartocdn.com/gl/positron-gl-style/style.json
//   Dark Matter (dark mode):                        https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

// Spain center
const SPAIN_CENTER: [number, number] = [-3.70379, 40.416775];

type Props = { listings: Listing[] };

export function ListingsMap({ listings }: Props) {
  const cameraRef = useRef<MapLibreGL.Camera>(null);
  const [zoom, setZoom] = useState(5);
  const [bounds, setBounds] = useState<[number, number, number, number]>([-9.5, 35.8, 4.5, 43.8]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const geoListings = useMemo(
    () => listings.filter((l) => l.lat != null && l.lng != null),
    [listings],
  );

  const sc = useMemo(() => {
    const cluster = new Supercluster<PointProps>({ radius: 60, maxZoom: 20 });
    cluster.load(
      geoListings.map((l) => ({
        type: "Feature" as const,
        properties: { listing: l },
        geometry: { type: "Point" as const, coordinates: [l.lng!, l.lat!] },
      })),
    );
    return cluster;
  }, [geoListings]);

  const clusters = useMemo(
    () => sc.getClusters(bounds, Math.max(0, Math.min(Math.round(zoom), 20))),
    [sc, bounds, zoom],
  );

  const handleCameraChanged = (state: { properties: { zoom: number; bounds?: { ne: [number, number]; sw: [number, number] } } }) => {
    if (state.properties.zoom != null) setZoom(state.properties.zoom);
    const b = state.properties.bounds;
    if (b) setBounds([b.sw[0], b.sw[1], b.ne[0], b.ne[1]]);
  };

  const handleClusterPress = (clusterId: number, lat: number, lng: number) => {
    const expansionZoom = Math.min(sc.getClusterExpansionZoom(clusterId), 20);
    cameraRef.current?.setCamera({
      centerCoordinate: [lng, lat],
      zoomLevel: expansionZoom,
      animationDuration: 400,
    });
  };

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        styleURL={MAP_STYLE}
        logoEnabled={false}
        attributionEnabled={false}
        onCameraChanged={handleCameraChanged}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          centerCoordinate={SPAIN_CENTER}
          zoomLevel={5}
        />

        {clusters.map((point) => {
          const [lng, lat] = point.geometry.coordinates;

          if ("cluster" in point.properties && point.properties.cluster) {
            const { cluster_id, point_count } = point.properties as {
              cluster_id: number;
              point_count: number;
              cluster: boolean;
            };
            return (
              <MapLibreGL.MarkerView
                key={`cluster-${cluster_id}`}
                coordinate={[lng, lat]}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <Pressable
                  style={styles.cluster}
                  onPress={() => handleClusterPress(cluster_id, lat, lng)}
                  accessibilityLabel={`Grupo de ${point_count} anuncios`}
                >
                  <Text style={styles.clusterText}>{point_count}</Text>
                </Pressable>
              </MapLibreGL.MarkerView>
            );
          }

          const { listing } = point.properties as PointProps;
          const isSelected = selectedListing?.id === listing.id;
          return (
            <MapLibreGL.MarkerView
              key={listing.id}
              coordinate={[lng, lat]}
              anchor={{ x: 0.5, y: 1 }}
            >
              <Pressable
                style={[styles.priceMarker, isSelected && styles.priceMarkerSelected]}
                onPress={() => setSelectedListing(isSelected ? null : listing)}
                accessibilityLabel={`${listing.title} €${listing.price}/mes`}
              >
                <Text style={[styles.priceText, isSelected && styles.priceTextSelected]}>
                  €{listing.price}
                </Text>
              </Pressable>
            </MapLibreGL.MarkerView>
          );
        })}
      </MapLibreGL.MapView>

      {/* Selected listing card */}
      {selectedListing && (
        <View style={styles.cardOverlay}>
          <Pressable
            style={styles.dismissBtn}
            onPress={() => setSelectedListing(null)}
            hitSlop={8}
            accessibilityLabel="Cerrar"
          >
            <Text style={styles.dismissText}>✕</Text>
          </Pressable>
          <ListingCard
            listing={{
              id: selectedListing.id,
              title: selectedListing.title,
              price: selectedListing.price,
              city: selectedListing.city,
              type: selectedListing.type,
              image_url: (selectedListing.images as string[])[0] ?? null,
            }}
            onPress={() => router.push(`/listing/${selectedListing.id}`)}
          />
        </View>
      )}

      {listings.length > 0 && geoListings.length === 0 && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>
            Los anuncios no tienen ubicación. Edítalos para añadir coordenadas.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  cluster: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  clusterText: { color: colors.white, fontWeight: "700", fontSize: fontSize.sm },

  priceMarker: {
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  priceMarkerSelected: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  priceText: { fontSize: 12, fontWeight: "700", color: colors.primary },
  priceTextSelected: { color: colors.white },

  cardOverlay: {
    position: "absolute",
    bottom: spacing[4],
    left: spacing[3],
    right: spacing[3],
  },
  dismissBtn: {
    alignSelf: "flex-end",
    backgroundColor: colors.white,
    borderRadius: radius.full,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[1],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  dismissText: { fontSize: 12, color: colors.textSecondary, fontWeight: "700" },

  hint: {
    position: "absolute",
    bottom: spacing[4],
    left: spacing[4],
    right: spacing[4],
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: radius.xl,
    padding: spacing[3],
  },
  hintText: { color: colors.white, fontSize: fontSize.xs, textAlign: "center" },
});
