import RNMapView, { Marker } from "react-native-maps";
import { StyleSheet } from "react-native";

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

export default function MapView({ initialRegion, markers, onRegionChange, style }: MapViewProps) {
  return (
    <RNMapView
      style={[StyleSheet.absoluteFillObject, style]}
      initialRegion={{
        latitude: initialRegion.latitude,
        longitude: initialRegion.longitude,
        latitudeDelta: initialRegion.latitudeDelta ?? 0.1,
        longitudeDelta: initialRegion.longitudeDelta ?? 0.1,
      }}
      onRegionChangeComplete={(r) =>
        onRegionChange?.({
          latitude: r.latitude,
          longitude: r.longitude,
          latitudeDelta: r.latitudeDelta,
          longitudeDelta: r.longitudeDelta,
        })
      }
    >
      {markers?.map((m) => (
        <Marker
          key={m.id}
          coordinate={{ latitude: m.latitude, longitude: m.longitude }}
          onPress={m.onPress}
        />
      ))}
    </RNMapView>
  );
}
