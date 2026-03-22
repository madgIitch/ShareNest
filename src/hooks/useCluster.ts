// src/hooks/useCluster.ts
// Hook React que envuelve ClusterEngine y sincroniza con el estado del mapa.
// Compatible con Leaflet WebView: acepta zoom + bbox directamente.
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

  /** Llamado desde el evento moveend de Leaflet via postMessage. */
  const handleLeafletChange = (zoom: number, bbox: BBox) => {
    setRegion({ zoom: Math.max(0, Math.min(Math.round(zoom), 20)), bbox });
  };

  return { clusters, engine, handleLeafletChange, bbox: region.bbox };
}
