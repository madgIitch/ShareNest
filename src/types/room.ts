import type { CommonAreaType, Json } from "./database";

export type { CommonAreaType } from "./database";

export type BedType = "individual" | "doble" | "litera";

export type Room = {
  id: string;
  property_id: string;
  name: string | null;
  size_m2: number | null;
  bed_type: BedType | null;
  has_private_bath: boolean;
  has_wardrobe: boolean;
  has_desk: boolean;
  photos: Json;
  created_at: string;
};

export type RoomInsert = {
  id?: string;
  property_id: string;
  name?: string | null;
  size_m2?: number | null;
  bed_type?: BedType | null;
  has_private_bath?: boolean;
  has_wardrobe?: boolean;
  has_desk?: boolean;
  photos?: Json;
  created_at?: string;
};

export type RoomUpdate = Partial<RoomInsert>;

export type CommonArea = {
  id: string;
  property_id: string;
  type: CommonAreaType;
  photos: Json;
  description: string | null;
  amenities: string[];
  is_shared_bath: boolean;
  created_at: string;
};

export type CommonAreaInsert = {
  id?: string;
  property_id: string;
  type: CommonAreaType;
  photos?: Json;
  description?: string | null;
  amenities?: string[];
  is_shared_bath?: boolean;
  created_at?: string;
};

export const COMMON_AREA_LABELS: Record<CommonAreaType, { label: string; icon: string }> = {
  cocina: { label: "Cocina", icon: "🍳" },
  bano: { label: "Baño", icon: "🚿" },
  salon: { label: "Salón", icon: "🛋️" },
  terraza: { label: "Terraza", icon: "🌿" },
  lavadero: { label: "Lavadero", icon: "🧺" },
  garaje: { label: "Garaje", icon: "🚗" },
  entrada: { label: "Entrada", icon: "🚪" },
  otro: { label: "Otro", icon: "📷" },
};

export const COMMON_AREA_OPTIONS = Object.entries(COMMON_AREA_LABELS) as [
  CommonAreaType,
  { label: string; icon: string },
][];
