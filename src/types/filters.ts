export type ListingFilters = {
  query: string;
  city: string;
  type: "offer" | "search" | undefined;
  priceMin: number | undefined;
  priceMax: number | undefined;
  sizeMin: number | undefined;
  availableFrom: string; // ISO YYYY-MM-DD or empty
  petsAllowed: boolean | undefined;
  smokersAllowed: boolean | undefined;
  // geo radius (optional — set when user enables location filter)
  lat: number | undefined;
  lng: number | undefined;
  radiusKm: number;
};

export const DEFAULT_FILTERS: ListingFilters = {
  query: "",
  city: "",
  type: undefined,
  priceMin: undefined,
  priceMax: undefined,
  sizeMin: undefined,
  availableFrom: "",
  petsAllowed: undefined,
  smokersAllowed: undefined,
  lat: undefined,
  lng: undefined,
  radiusKm: 30,
};

/** How many non-default filters are active (excludes query, which has its own bar) */
export function countActiveFilters(f: ListingFilters): number {
  let n = 0;
  if (f.city) n++;
  if (f.type !== undefined) n++;
  if (f.priceMin !== undefined) n++;
  if (f.priceMax !== undefined) n++;
  if (f.sizeMin !== undefined) n++;
  if (f.availableFrom) n++;
  if (f.petsAllowed !== undefined) n++;
  if (f.smokersAllowed !== undefined) n++;
  if (f.lat !== undefined) n++;
  return n;
}
