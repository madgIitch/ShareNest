// src/components/ui/MiniMapView.tsx
// Mini mapa no interactivo para la pantalla de detalle de listing.
// Usa Leaflet via WebView — OSM, sin Google ni API key.
// El PrivacyEngine se aplica en RN antes de pasar las coords al HTML.
import WebView from "react-native-webview";
import { StyleSheet, Text, View } from "react-native";
import { applyPrivacy, type PrivacyLevel } from "../../core/PrivacyEngine";
import { colors, fontSize, radius, spacing } from "../../theme";
import { buildMiniMapHTML } from "../../lib/leafletHTML";

// Zoom de Leaflet por nivel de privacidad (más preciso = más zoom)
const ZOOM: Record<PrivacyLevel, number> = {
  1: 12, // zona amplia (sin calle exacta)
  2: 15, // manzana
  3: 17, // calle
};

type Props = {
  lat: number;
  lng: number;
  privacyLevel: PrivacyLevel;
  height?: number;
};

export function MiniMapView({ lat, lng, privacyLevel, height = 200 }: Props) {
  const display = applyPrivacy({ lat, lng }, privacyLevel);
  const zoom = ZOOM[privacyLevel];
  const html = buildMiniMapHTML(
    display.lat,
    display.lng,
    zoom,
    display.accuracyRadius ?? undefined,
  );

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        style={StyleSheet.absoluteFill}
        source={{ html }}
        javaScriptEnabled
        scrollEnabled={false}
        originWhitelist={["*"]}
      />

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
