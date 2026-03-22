// src/components/explore/ListingsMap.tsx
// Mapa principal con Leaflet via WebView — OSM, sin Google ni API key.
// Comunicación RN↔WebView via postMessage / injectJavaScript.
import { useRef, useState, useEffect, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import { router } from "expo-router";
import { useCluster } from "../../hooks/useCluster";
import { applyPrivacy } from "../../core/PrivacyEngine";
import { ListingCard } from "../ui/ListingCard";
import { colors, fontSize, radius, spacing } from "../../theme";
import { buildMainMapHTML } from "../../lib/leafletHTML";
import type { ListingPinData, BBox } from "../../core/ClusterEngine";

export type { ListingPinData, BBox };

// Construido una sola vez — evita re-renders del WebView
const MAP_HTML = buildMainMapHTML();

type Props = {
  listings: ListingPinData[];
  onPinPress?: (pin: ListingPinData) => void;
  onBoundsChange?: (bounds: BBox) => void;
};

export function ListingsMap({ listings, onPinPress, onBoundsChange }: Props) {
  const webviewRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { clusters, engine, handleLeafletChange } = useCluster(listings);

  // Envía clusters al WebView cuando cambian (nueva búsqueda, zoom, etc.)
  useEffect(() => {
    if (!ready) return;
    const js = `window.updateClusters(${JSON.stringify(clusters)}); true;`;
    webviewRef.current?.injectJavaScript(js);
  }, [clusters, ready]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }

      if (data.type === "REGION_CHANGE") {
        handleLeafletChange(data.zoom as number, data.bbox as BBox);
        if (onBoundsChange) onBoundsChange(data.bbox as BBox);
      } else if (data.type === "PIN_PRESS") {
        const id = data.id as string;
        const deselect = data.deselect as boolean;
        const nextId = deselect ? null : id;
        setSelectedId(nextId);
        if (!deselect && onPinPress) {
          const pin = listings.find((l) => l.id === id);
          if (pin) onPinPress(pin);
        }
      } else if (data.type === "CLUSTER_PRESS") {
        const zoom = engine.expansionZoom(data.id as number);
        const js = `window.zoomTo(${data.lat as number},${data.lng as number},${zoom}); true;`;
        webviewRef.current?.injectJavaScript(js);
      }
    },
    [handleLeafletChange, onBoundsChange, onPinPress, listings, engine],
  );

  const handleDismiss = () => {
    setSelectedId(null);
    webviewRef.current?.injectJavaScript(`window.deselect(); true;`);
  };

  const selectedPin = selectedId ? (listings.find((l) => l.id === selectedId) ?? null) : null;

  const selectedDisplay = selectedPin
    ? applyPrivacy(selectedPin.location, selectedPin.privacyLevel)
    : null;
  void selectedDisplay; // disponible para uso futuro (círculo de precisión, etc.)

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        style={styles.map}
        source={{ html: MAP_HTML }}
        onLoad={() => setReady(true)}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
      />

      {/* Tarjeta del pin seleccionado */}
      {selectedPin && (
        <View style={styles.cardOverlay}>
          <Pressable
            style={styles.dismissBtn}
            onPress={handleDismiss}
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

      {/* Aviso si los anuncios no tienen coordenadas */}
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
