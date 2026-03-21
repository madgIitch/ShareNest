/**
 * PrivacyEngine — convierte coordenadas reales en coordenadas de visualización
 * según el nivel de privacidad del listing.
 *
 * Nivel 1 — búsqueda pública:
 *   Centroide del barrio (city_places). Si no hay barrio, las coords del listing
 *   (que ya deben ser aproximadas). Radio de 500 m visible.
 *
 * Nivel 2 — listing abierto (usuario interesado):
 *   Coords reales + offset determinístico ±150 m. El offset usa las coords como
 *   seed del hash → mismo listing = siempre el mismo punto falso. Radio de 150 m.
 *
 * Nivel 3 — habitación asignada (inquilino confirmado):
 *   Coords exactas de la BD, sin radio.
 */

export type PrivacyLevel = 1 | 2 | 3;

export interface RawLocation {
  /** Coordenadas exactas almacenadas en la BD */
  lat: number;
  lng: number;
  /** Centroide del barrio (city_places.centroid), si está disponible */
  placeLat?: number | null;
  placeLng?: number | null;
}

export interface DisplayLocation {
  lat: number;
  lng: number;
  /** Radio de incertidumbre en metros. null = localización exacta (nivel 3) */
  accuracyRadius: number | null;
}

/**
 * Offset determinístico basado en las coordenadas reales.
 * Mismo input → siempre el mismo output (no usa Math.random).
 */
function deterministicOffset(lat: number, lng: number): { dlat: number; dlng: number } {
  // Dos seeds independientes usando el truco sin/frac clásico
  const s1 = Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453123;
  const s2 = Math.sin(lng * 12.9898 + lat * 78.233) * 43758.5453123;
  const f1 = s1 - Math.floor(s1); // 0..1
  const f2 = s2 - Math.floor(s2); // 0..1

  // 150 m en grados. Para latitud: 1° ≈ 111 km → 150 m ≈ 0.00135°
  // Para longitud: se comprime según la latitud (cos).
  const maxLat = 0.00135;
  const maxLng = 0.00135 / Math.cos((lat * Math.PI) / 180);

  return {
    dlat: (f1 * 2 - 1) * maxLat, // ±150 m en latitud
    dlng: (f2 * 2 - 1) * maxLng, // ±150 m en longitud
  };
}

/**
 * Aplica la lógica de privacidad y devuelve las coordenadas de visualización.
 */
export function applyPrivacy(location: RawLocation, level: PrivacyLevel): DisplayLocation {
  const { lat, lng, placeLat, placeLng } = location;

  switch (level) {
    case 1: {
      // Preferir centroide del barrio; si no hay, usar coords del listing
      const displayLat = placeLat ?? lat;
      const displayLng = placeLng ?? lng;
      return { lat: displayLat, lng: displayLng, accuracyRadius: 500 };
    }

    case 2: {
      const { dlat, dlng } = deterministicOffset(lat, lng);
      return { lat: lat + dlat, lng: lng + dlng, accuracyRadius: 150 };
    }

    case 3:
      return { lat, lng, accuracyRadius: null };
  }
}
