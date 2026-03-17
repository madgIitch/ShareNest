import { useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import Supercluster from "supercluster";
import { router } from "expo-router";

import { ListingCard } from "../ui/ListingCard";
import { colors, fontSize, radius, spacing } from "../../theme";
import type { Database } from "../../types/database";

type Listing = Database["public"]["Tables"]["listings"]["Row"];
type PointProps = { listing: Listing };

// Default: Spain center
const SPAIN_REGION: Region = {
  latitude: 40.416775,
  longitude: -3.70379,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

type Props = {
  listings: Listing[];
};

export function ListingsMap({ listings }: Props) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(SPAIN_REGION);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const geoListings = useMemo(
    () => listings.filter((l) => l.lat != null && l.lng != null),
    [listings],
  );

  // Build supercluster from geo-tagged listings
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

  // Recompute clusters on every region change
  const clusters = useMemo(() => {
    const zoom = Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2);
    const bbox: [number, number, number, number] = [
      region.longitude - region.longitudeDelta / 2,
      region.latitude  - region.latitudeDelta  / 2,
      region.longitude + region.longitudeDelta / 2,
      region.latitude  + region.latitudeDelta  / 2,
    ];
    return sc.getClusters(bbox, Math.max(0, Math.min(zoom, 20)));
  }, [sc, region]);

  const handleClusterPress = (clusterId: number, lat: number, lng: number) => {
    const expansionZoom = sc.getClusterExpansionZoom(clusterId);
    const delta = 360 / Math.pow(2, Math.min(expansionZoom, 20));
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: delta * 0.8, longitudeDelta: delta * 0.8 },
      400,
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={SPAIN_REGION}
        onRegionChangeComplete={setRegion}
      >
        {clusters.map((point) => {
          const [lng, lat] = point.geometry.coordinates;

          if ("cluster" in point.properties && point.properties.cluster) {
            const { cluster_id, point_count } = point.properties;
            return (
              <Marker
                key={`cluster-${cluster_id}`}
                coordinate={{ latitude: lat, longitude: lng }}
                onPress={() => handleClusterPress(cluster_id as number, lat, lng)}
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
              onPress={() => setSelectedListing(listing)}
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

      {/* Listing card overlay */}
      {selectedListing && (
        <View style={styles.cardOverlay}>
          <Pressable
            style={styles.dismissBtn}
            onPress={() => setSelectedListing(null)}
            hitSlop={8}
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

      {/* No geo listings hint */}
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

  // Cluster bubble
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
  clusterText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: fontSize.sm,
  },

  // Price marker
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
  priceMarkerSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  priceText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  priceTextSelected: {
    color: colors.white,
  },

  // Card overlay
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
  dismissText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "700",
  },

  // Hint
  hint: {
    position: "absolute",
    bottom: spacing[4],
    left: spacing[4],
    right: spacing[4],
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: radius.xl,
    padding: spacing[3],
  },
  hintText: {
    color: colors.white,
    fontSize: fontSize.xs,
    textAlign: "center",
  },
});
