// src/core/ClusterEngine.ts
// Módulo core puro — sin dependencias de React ni de MapLibre.
// 100% testeable sin montar un mapa.
import Supercluster, { type PointFeature } from "supercluster";
import { applyPrivacy } from "./PrivacyEngine";
import type { RawLocation, PrivacyLevel } from "./PrivacyEngine";

// ─── Tipos públicos ────────────────────────────────────────────────────────────

export interface ListingPinData {
  id: string;
  privacyLevel: PrivacyLevel;
  location: RawLocation;
  price: number;
  currency?: string;       // default '€'
  isHighlighted?: boolean;
  metadata?: Record<string, unknown>;
}

/** [west, south, east, north] */
export type BBox = [number, number, number, number];

export interface ClusterPoint {
  type: "cluster";
  id: number;
  lat: number;
  lng: number;
  count: number;
  /** Todos los pins agrupados — útil para renderCluster custom */
  pins: ListingPinData[];
}

export interface SinglePin {
  type: "pin";
  pin: ListingPinData;
  /** Coordenadas ya ofuscadas por PrivacyEngine */
  lat: number;
  lng: number;
}

export type ClusterItem = ClusterPoint | SinglePin;

// ─── ClusterEngine ─────────────────────────────────────────────────────────────

type InternalProps = { pin: ListingPinData };

export class ClusterEngine {
  private sc: Supercluster<InternalProps>;

  constructor(options?: { radius?: number; maxZoom?: number }) {
    this.sc = new Supercluster<InternalProps>({
      radius: options?.radius ?? 60,
      maxZoom: options?.maxZoom ?? 20,
    });
  }

  /** Carga los pins aplicando PrivacyEngine antes de indexar. */
  load(pins: ListingPinData[]): this {
    const features: PointFeature<InternalProps>[] = pins
      .filter((p) => p.location.lat != null && p.location.lng != null)
      .map((pin) => {
        const display = applyPrivacy(pin.location, pin.privacyLevel);
        return {
          type: "Feature" as const,
          properties: { pin },
          geometry: { type: "Point" as const, coordinates: [display.lng, display.lat] },
        };
      });
    this.sc.load(features);
    return this;
  }

  /** Devuelve los items visibles en el viewport actual. */
  getClusters(bbox: BBox, zoom: number): ClusterItem[] {
    const z = Math.max(0, Math.min(Math.round(zoom), 20));
    return this.sc.getClusters(bbox, z).map((f) => {
      const [lng, lat] = f.geometry.coordinates;

      if ((f.properties as { cluster?: boolean }).cluster) {
        const cp = f.properties as { cluster_id: number; point_count: number };
        const leaves = this.sc
          .getLeaves(cp.cluster_id, Infinity)
          .map((l) => (l.properties as InternalProps).pin);
        return {
          type: "cluster" as const,
          id: cp.cluster_id,
          lat,
          lng,
          count: cp.point_count,
          pins: leaves,
        };
      }

      return {
        type: "pin" as const,
        pin: (f.properties as InternalProps).pin,
        lat,
        lng,
      };
    });
  }

  /** Zoom óptimo para expandir un cluster al pulsarlo. */
  expansionZoom(clusterId: number): number {
    return Math.min(this.sc.getClusterExpansionZoom(clusterId), 20);
  }
}
