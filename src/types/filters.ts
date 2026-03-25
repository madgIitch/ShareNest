import type { CommonAreaType } from "./room";

export type ListingFilters = {
  query: string;
  city: string;
  cityId: string | undefined;
  placeId: string | undefined;
  type: "offer" | "search" | undefined;
  priceMin: number | undefined;
  priceMax: number | undefined;
  sizeMin: number | undefined;
  availableFrom: string;
  petsAllowed: boolean | undefined;
  smokersAllowed: boolean | undefined;
  commonAreas: CommonAreaType[];
  lat: number | undefined;
  lng: number | undefined;
  radiusKm: number;
};

export const DEFAULT_FILTERS: ListingFilters = {
  query: "",
  city: "",
  cityId: undefined,
  placeId: undefined,
  type: undefined,
  priceMin: undefined,
  priceMax: undefined,
  sizeMin: undefined,
  availableFrom: "",
  petsAllowed: undefined,
  smokersAllowed: undefined,
  commonAreas: [],
  lat: undefined,
  lng: undefined,
  radiusKm: 30,
};

/** How many non-default filters are active (excludes query, which has its own bar) */
export function countActiveFilters(f: ListingFilters): number {
  let n = 0;
  if (f.cityId || f.city) n++;
  if (f.type !== undefined) n++;
  if (f.priceMin !== undefined) n++;
  if (f.priceMax !== undefined) n++;
  if (f.sizeMin !== undefined) n++;
  if (f.availableFrom) n++;
  if (f.petsAllowed !== undefined) n++;
  if (f.smokersAllowed !== undefined) n++;
  if (f.commonAreas.length > 0) n++;
  if (f.lat !== undefined) n++;
  return n;
}
