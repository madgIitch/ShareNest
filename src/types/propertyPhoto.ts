export type CommonAreaType =
  | "cocina"
  | "bano"
  | "salon"
  | "terraza"
  | "lavadero"
  | "garaje"
  | "entrada"
  | "otro";

// PropertyPhotoRoom is kept as an alias for compatibility with the migration plan.
export type PropertyPhotoRoom = CommonAreaType;

export type PropertyPhoto = {
  url: string;
  room: PropertyPhotoRoom;
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

const ROOM_ALIAS_MAP: Record<string, CommonAreaType> = {
  cocina: "cocina",
  Cocina: "cocina",
  "baño": "bano",
  bano: "bano",
  Baño: "bano",
  salón: "salon",
  salon: "salon",
  Salón: "salon",
  terraza: "terraza",
  Terraza: "terraza",
  lavadero: "lavadero",
  Lavadero: "lavadero",
  garaje: "garaje",
  Garaje: "garaje",
  entrada: "entrada",
  Entrada: "entrada",
  otro: "otro",
  Otro: "otro",
};

function normalizeKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeRoom(raw: string): CommonAreaType {
  const direct = ROOM_ALIAS_MAP[raw];
  if (direct) return direct;
  const normalized = normalizeKey(raw);
  return ROOM_ALIAS_MAP[normalized] ?? "otro";
}

export function normalizePropertyPhotos(raw: unknown): PropertyPhoto[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (typeof item === "string") {
      const url = item.trim();
      return url ? [{ url, room: "otro" as const }] : [];
    }

    if (!item || typeof item !== "object") return [];

    const record = item as Record<string, unknown>;
    const url = typeof record.url === "string" ? record.url.trim() : "";
    if (!url) return [];

    const rawRoom =
      typeof record.room === "string"
        ? record.room
        : typeof record.zone === "string"
          ? record.zone
          : "otro";

    return [{ url, room: normalizeRoom(rawRoom) }];
  });
}

export function normalizeRoomPhotos(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (!item || typeof item !== "object") return "";
      const record = item as Record<string, unknown>;
      return typeof record.url === "string" ? record.url.trim() : "";
    })
    .filter(Boolean);
}
