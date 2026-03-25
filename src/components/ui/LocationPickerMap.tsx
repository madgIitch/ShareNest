import { StyleSheet, Text, View } from "react-native";
import WebView from "react-native-webview";

import { buildEditableMiniMapHTML } from "../../lib/leafletHTML";
import { colors, fontSize, radius, spacing } from "../../theme";

type Props = {
  lat: number;
  lng: number;
  height?: number;
  onChange: (coords: { lat: number; lng: number }) => void;
};

export function LocationPickerMap({ lat, lng, height = 200, onChange }: Props) {
  const html = buildEditableMiniMapHTML(lat, lng, 16);

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        style={StyleSheet.absoluteFill}
        source={{ html }}
        javaScriptEnabled
        originWhitelist={["*"]}
        onMessage={(event) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data ?? "{}");
            if (payload?.type === "PIN_MOVE" && typeof payload.lat === "number" && typeof payload.lng === "number") {
              onChange({ lat: payload.lat, lng: payload.lng });
            }
          } catch {
            // ignore malformed bridge messages
          }
        }}
      />
      <View style={styles.hintPill}>
        <Text style={styles.hintText}>Toca el mapa para ajustar el pin</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: colors.gray100,
  },
  hintPill: {
    position: "absolute",
    bottom: spacing[2],
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  hintText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
});

