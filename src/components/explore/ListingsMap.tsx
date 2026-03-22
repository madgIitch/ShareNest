// src/components/explore/ListingsMap.tsx
// API pública del mapa (§5.1 del doc). Usa react-native-maps + Stadia tiles.
// Toda la lógica de negocio está en ClusterEngine / PrivacyEngine (core puro).
import MapView, { Circle, Marker, UrlTile, PROVIDER_DEFAULT } from "react-native-maps";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useCluster } from "../../hooks/useCluster";
import { applyPrivacy } from "../../core/PrivacyEngine";
import { ListingPin } from "../ui/ListingPin";
import { ListingCluster } from "../ui/ListingCluster";
import { ListingCard } from "../ui/ListingCard";
import { colors, fontSize, radius, spacing } from "../../theme";
import type { ListingPinData, BBox } from "../../core/ClusterEngine";

export type { ListingPinData, BBox };

const SPAIN_REGION = {
  latitude: 40.416775,
  longitude: -3.70379,
  latitudeDelta: 10,
  longitudeDelta: 12,
};

function zoomToLatDelta(zoom: number) {
  return 360 / Math.pow(2, zoom);
}

type Props = {
  listings: ListingPinData[];
  onPinPress?: (pin: ListingPinData) => void;
  onBoundsChange?: (bounds: BBox) => void;
};

export function ListingsMap({ listings, onPinPress, onBoundsChange }: Props) {
  const mapRef = useRef<MapView>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { clusters, engine, handleRegionChange } = useCluster(listings);

  const handleRegion = (r: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => {
    handleRegionChange(r);
    if (onBoundsChange) {
      const b: BBox = [
        r.longitude - r.longitudeDelta / 2,
        r.latitude - r.latitudeDelta / 2,
        r.longitude + r.longitudeDelta / 2,
        r.latitude + r.latitudeDelta / 2,
      ];
      onBoundsChange(b);
    }
  };

  const selectedPin = selectedId
    ? listings.find((l) => l.id === selectedId) ?? null
    : null;

  const selectedDisplay = selectedPin
    ? applyPrivacy(selectedPin.location, selectedPin.privacyLevel)
    : null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        mapType="none"
        initialRegion={SPAIN_REGION}
        onRegionChangeComplete={handleRegion}
      >
        <UrlTile
          urlTemplate="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}@2x.png"
          maximumZ={20}
          tileSize={512}
          flipY={false}
        />

        {/* Círculo de precisión del pin seleccionado */}
        {selectedDisplay && selectedDisplay.accuracyRadius != null && (
          <Circle
            key={`circle-${selectedId}`}
            center={{ latitude: selectedDisplay.lat, longitude: selectedDisplay.lng }}
            radius={selectedDisplay.accuracyRadius}
            fillColor="rgba(99,102,241,0.08)"
            strokeColor="rgba(99,102,241,0.35)"
            strokeWidth={1.5}
          />
        )}

        {clusters.map((item) => {
          if (item.type === "cluster") {
            return (
              <Marker
                key={`cluster-${item.id}`}
                coordinate={{ latitude: item.lat, longitude: item.lng }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <ListingCluster
                  count={item.count}
                  onPress={() => {
                    const zoom = engine.expansionZoom(item.id);
                    mapRef.current?.animateToRegion(
                      {
                        latitude: item.lat,
                        longitude: item.lng,
                        latitudeDelta: zoomToLatDelta(zoom),
                        longitudeDelta: zoomToLatDelta(zoom),
                      },
                      400,
                    );
                  }}
                />
              </Marker>
            );
          }

          const isSelected = item.pin.id === selectedId;
          return (
            <Marker
              key={item.pin.id}
              coordinate={{ latitude: item.lat, longitude: item.lng }}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={false}
            >
              <ListingPin
                price={item.pin.price}
                currency={item.pin.currency}
                isSelected={isSelected}
                isHighlighted={item.pin.isHighlighted}
                onPress={() => {
                  const next = isSelected ? null : item.pin.id;
                  setSelectedId(next);
                  if (next && onPinPress) onPinPress(item.pin);
                }}
              />
            </Marker>
          );
        })}
      </MapView>

      {/* Tarjeta del pin seleccionado */}
      {selectedPin && (
        <View style={styles.cardOverlay}>
          <Pressable
            style={styles.dismissBtn}
            onPress={() => setSelectedId(null)}
            hitSlop={8}
            accessibilityLabel="Cerrar"
          >
            <Text style={styles.dismissText}>✕</Text>
          </Pressable>
          <ListingCard
            listing={{
              id: selectedPin.id,
              title: (selectedPin.metadata?.title as string) ?? selectedPin.id,
              price: selectedPin.price,
              city: (selectedPin.metadata?.city as string) ?? "",
              type: (selectedPin.metadata?.type as "offer" | "search") ?? "offer",
              image_url: (selectedPin.metadata?.image_url as string) ?? null,
            }}
            onPress={() => router.push(`/listing/${selectedPin.id}`)}
          />
        </View>
      )}

      {listings.length > 0 &&
        listings.every((l) => l.location.lat == null || l.location.lng == null) && (
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
