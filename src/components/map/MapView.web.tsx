import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icon bug with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const priceIcon = (price: number) =>
  L.divIcon({
    className: "",
    html: `<div class="hm-price-marker">€${price}</div>`,
    iconSize: [60, 28],
    iconAnchor: [30, 14],
  });

interface MapViewProps {
  initialRegion: {
    latitude: number;
    longitude: number;
    zoom?: number;
    latitudeDelta?: number;
    longitudeDelta?: number;
  };
  markers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    price?: number;
    onPress?: () => void;
  }>;
  onRegionChange?: (region: MapViewProps["initialRegion"]) => void;
  style?: object;
}

function MapEventHandler({ onRegionChange }: { onRegionChange?: MapViewProps["onRegionChange"] }) {
  useMapEvents({
    moveend(e) {
      const center = e.target.getCenter();
      onRegionChange?.({ latitude: center.lat, longitude: center.lng });
    },
  });
  return null;
}

export default function MapView({ initialRegion, markers, onRegionChange, style }: MapViewProps) {
  return (
    <MapContainer
      center={[initialRegion.latitude, initialRegion.longitude]}
      zoom={initialRegion.zoom ?? 13}
      style={{ height: "100%", width: "100%", ...style }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />
      <MapEventHandler onRegionChange={onRegionChange} />
      {markers?.map((m) => (
        <Marker
          key={m.id}
          position={[m.latitude, m.longitude]}
          icon={m.price !== undefined ? priceIcon(m.price) : undefined}
          eventHandlers={{ click: m.onPress ? () => m.onPress?.() : undefined }}
        />
      ))}
    </MapContainer>
  );
}
