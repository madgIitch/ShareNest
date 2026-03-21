// src/components/explore/ListingsMap.tsx
// Map using react-native-maps — Fabric/New Architecture compatible.
import MapView, { Circle, Marker, UrlTile, PROVIDER_DEFAULT } from "react-native-maps";
import { useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Supercluster from "supercluster";
import { router } from "expo-router";
import { ListingCard } from "../ui/ListingCard";
import { applyPrivacy } from "../../core/PrivacyEngine";
import { colors, fontSize, radius, spacing } from "../../theme";
import type { Database } from "../../types/database";

type Listing = Database["public"]["Tables"]["listings"]["Row"];
type PointProps = { listing: Listing };

// Spain bounding box
const SPAIN_REGION = {
  latitude: 40.416775,
  longitude: -3.70379,
  latitudeDelta: 10,
  longitudeDelta: 12,
};

// Zoom level (0-20) to latitudeDelta approximation
function zoomToLatDelta(zoom: number) {
  return 360 / Math.pow(2, zoom);
}

type Props = { listings: Listing[] };

export function ListingsMap({ listings }: Props) {
  const mapRef = useRef<MapView>(null);
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
      geoListings.map((l) => {
        // Nivel 1 para todos los pins públicos del mapa de búsqueda
        const display = applyPrivacy(
          { lat: l.lat!, lng: l.lng! },
          1,
        );
        return {
          type: "Feature" as const,
          properties: { listing: l },
          geometry: { type: "Point" as const, coordinates: [display.lng, display.lat] },
        };
      }),
    );
    return cluster;
  }, [geoListings]);

  const clusters = useMemo(
    () => sc.getClusters(bounds, Math.max(0, Math.min(Math.round(zoom), 20))),
    [sc, bounds, zoom],
  );

  const handleRegionChange = (region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => {
    // Approximate zoom from latitudeDelta
    const z = Math.round(Math.log2(360 / region.latitudeDelta));
    setZoom(Math.max(0, Math.min(z, 20)));

    const west = region.longitude - region.longitudeDelta / 2;
    const east = region.longitude + region.longitudeDelta / 2;
    const south = region.latitude - region.latitudeDelta / 2;
    const north = region.latitude + region.latitudeDelta / 2;
    setBounds([west, south, east, north]);
  };

  const handleClusterPress = (clusterId: number, lat: number, lng: number) => {
    const expansionZoom = Math.min(sc.getClusterExpansionZoom(clusterId), 20);
    const delta = zoomToLatDelta(expansionZoom);
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta },
      400,
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        mapType="none"
        initialRegion={SPAIN_REGION}
        onRegionChangeComplete={handleRegionChange}
      >
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          shouldReplaceMapContent
        />
        {/* Círculo de precisión nivel 1 (500 m) sobre el pin seleccionado */}
        {selectedListing?.lat != null && selectedListing?.lng != null && (() => {
          const display = applyPrivacy({ lat: selectedListing.lat!, lng: selectedListing.lng! }, 1);
          return (
            <Circle
              key={`circle-${selectedListing.id}`}
              center={{ latitude: display.lat, longitude: display.lng }}
              radius={display.accuracyRadius ?? 500}
              fillColor="rgba(99,102,241,0.08)"
              strokeColor="rgba(99,102,241,0.35)"
              strokeWidth={1.5}
            />
          );
        })()}

        {clusters.map((point) => {
          const [lng, lat] = point.geometry.coordinates;

          if ("cluster" in point.properties && point.properties.cluster) {
            const { cluster_id, point_count } = point.properties as {
              cluster_id: number;
              point_count: number;
              cluster: boolean;
            };
            return (
              <Marker
                key={`cluster-${cluster_id}`}
                coordinate={{ latitude: lat, longitude: lng }}
                anchor={{ x: 0.5, y: 0.5 }}
                onPress={() => handleClusterPress(cluster_id, lat, lng)}
                tracksViewChanges={false}
              >
                <View style={styles.cluster}>
                  <Text style={styles.clusterText}>{point_count}</Text>
                </View>
              </Marker>
            );
          }

          const { listing } = point.properties as PointProps;
          const isSelected = selectedListing?.id === listing.id;
          return (
            <Marker
              key={listing.id}
              coordinate={{ latitude: lat, longitude: lng }}
              anchor={{ x: 0.5, y: 1 }}
              onPress={() => setSelectedListing(isSelected ? null : listing)}
              tracksViewChanges={false}
            >
              <View style={[styles.priceMarker, isSelected && styles.priceMarkerSelected]}>
                <Text style={[styles.priceText, isSelected && styles.priceTextSelected]}>
                  €{listing.price}
                </Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

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
