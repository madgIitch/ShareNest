import { useEffect, useRef, useCallback } from "react";
import { View } from "react-native";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Metro doesn't support CSS imports — inject Leaflet CSS + price pill styles at runtime
function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("leaflet-bundle")) return;

  const link = document.createElement("link");
  link.id = "leaflet-bundle";
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(link);

  const style = document.createElement("style");
  style.textContent = `
    .hm-price-pill {
      background: #1A1A1A; color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-weight: 700; font-size: 13px;
      padding: 5px 10px; border-radius: 20px;
      border: 1.5px solid #333; white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      cursor: pointer; display: inline-block;
    }
    .hm-price-pill.sel { background: #F36A39; border-color: #F36A39; }
  `;
  document.head.appendChild(style);
}

injectStyles();

// Suppress default icon path resolution errors in metro
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: "", iconRetinaUrl: "", shadowUrl: "" });

const pillIcon = (price: number | undefined, selected?: boolean) =>
  L.divIcon({
    className: "",
    html: `<div class="hm-price-pill${selected ? " sel" : ""}">${price != null ? "€" + price : "·"}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

interface MapViewProps {
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta?: number;
    longitudeDelta?: number;
  };
  markers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    price?: number;
    selected?: boolean;
    onPress?: () => void;
  }>;
  onRegionChange?: (region: MapViewProps["initialRegion"]) => void;
  style?: object;
}

function RegionHandler({ onRegionChange }: { onRegionChange?: MapViewProps["onRegionChange"] }) {
  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter();
      onRegionChange?.({ latitude: c.lat, longitude: c.lng });
    },
  });
  return null;
}

export default function MapView({ initialRegion, markers, onRegionChange, style }: MapViewProps) {
  return (
    <View style={[{ flex: 1 }, style as any]}>
      <MapContainer
        center={[initialRegion.latitude, initialRegion.longitude]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        zoomControl
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />
        <RegionHandler onRegionChange={onRegionChange} />
        {markers?.map((m) => (
          <Marker
            key={m.id}
            position={[m.latitude, m.longitude]}
            icon={pillIcon(m.price, m.selected)}
            eventHandlers={{ click: () => m.onPress?.() }}
          />
        ))}
      </MapContainer>
    </View>
  );
}
