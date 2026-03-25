export { COMMON_AREA_LABELS } from "./room";
export type { CommonAreaType } from "./database";

import type { CommonAreaType } from "./database";

// PropertyPhotoRoom is kept as an alias for compatibility with the migration plan.
export type PropertyPhotoRoom = CommonAreaType;

export type PropertyPhoto = {
  url: string;
  room: PropertyPhotoRoom;
};

const ROOM_ALIAS_MAP: Record<string, CommonAreaType> = {
  cocina: "cocina",
  Cocina: "cocina",
  bano: "bano",
  Bano: "bano",
  BANO: "bano",
  salon: "salon",
  Salon: "salon",
  SALON: "salon",
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
