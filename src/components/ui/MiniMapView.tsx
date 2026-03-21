// src/components/ui/MiniMapView.tsx
// Mini mapa no interactivo para la pantalla de detalle de listing.
// Aplica el PrivacyEngine según el nivel del usuario.
import MapView, { Circle, Marker, UrlTile, PROVIDER_DEFAULT } from "react-native-maps";
import { StyleSheet, Text, View } from "react-native";
import { applyPrivacy, type PrivacyLevel } from "../../core/PrivacyEngine";
import { colors, fontSize, radius, spacing } from "../../theme";

// Zoom (latitudeDelta) por nivel: más preciso = más zoom
const DELTA: Record<PrivacyLevel, number> = {
  1: 0.025, // barrio
  2: 0.012, // manzana
  3: 0.004, // calle
};

type Props = {
  lat: number;
  lng: number;
  privacyLevel: PrivacyLevel;
  height?: number;
};

export function MiniMapView({ lat, lng, privacyLevel, height = 200 }: Props) {
  const display = applyPrivacy({ lat, lng }, privacyLevel);
  const delta = DELTA[privacyLevel];

  const region = {
    latitude: display.lat,
    longitude: display.lng,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        mapType="none"
        region={region}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          shouldReplaceMapContent
        />

        {display.accuracyRadius != null && (
          <Circle
            center={{ latitude: display.lat, longitude: display.lng }}
            radius={display.accuracyRadius}
            fillColor="rgba(99,102,241,0.08)"
            strokeColor="rgba(99,102,241,0.40)"
            strokeWidth={1.5}
          />
        )}

        <Marker
          coordinate={{ latitude: display.lat, longitude: display.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View style={styles.pin} />
        </Marker>
      </MapView>

      {/* Pill de privacidad */}
      {privacyLevel < 3 && (
        <View style={styles.pill}>
          <Text style={styles.pillText}>
            {privacyLevel === 1 ? "📍 Zona orientativa" : "📍 Ubicación aproximada"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: colors.gray100,
  },
  pin: {
    width: 14,
    height: 14,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pill: {
    position: "absolute",
    bottom: spacing[3],
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  pillText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
});
