// src/hooks/useCluster.ts
// Hook React que envuelve ClusterEngine y sincroniza con el estado del mapa.
import { useMemo, useState } from "react";
import { ClusterEngine } from "../core/ClusterEngine";
import type { ListingPinData, BBox, ClusterItem } from "../core/ClusterEngine";

interface RegionState {
  zoom: number;
  bbox: BBox;
}

const SPAIN_BBOX: BBox = [-9.5, 35.8, 4.5, 43.8];

export function useCluster(pins: ListingPinData[]) {
  const [region, setRegion] = useState<RegionState>({ zoom: 5, bbox: SPAIN_BBOX });

  const engine = useMemo(() => new ClusterEngine().load(pins), [pins]);

  const clusters: ClusterItem[] = useMemo(
    () => engine.getClusters(region.bbox, region.zoom),
    [engine, region],
  );

  const handleRegionChange = (r: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => {
    const zoom = Math.round(Math.log2(360 / r.latitudeDelta));
    const bbox: BBox = [
      r.longitude - r.longitudeDelta / 2,
      r.latitude - r.latitudeDelta / 2,
      r.longitude + r.longitudeDelta / 2,
      r.latitude + r.latitudeDelta / 2,
    ];
    setRegion({ zoom: Math.max(0, Math.min(zoom, 20)), bbox });
  };

  return { clusters, engine, handleRegionChange, bbox: region.bbox };
}
