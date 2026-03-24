// src/services/locationService.ts
const FUNCTIONS_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/locations`;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  "Content-Type": "application/json",
};
const DEBUG_LOCATIONS = true;

async function get<T>(path: string): Promise<T> {
  if (DEBUG_LOCATIONS) console.log("[locationService:get] ->", path);
  const res = await fetch(`${FUNCTIONS_URL}${path}`, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`locations API error: ${res.status} ${path} ${body}`);
  }
  const json = await res.json() as T;
  if (DEBUG_LOCATIONS) console.log("[locationService:get] <-", path, json);
  return json;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  if (DEBUG_LOCATIONS) console.log("[locationService:post] ->", path, body);
  const res = await fetch(`${FUNCTIONS_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`locations API error: ${res.status}`);
  const json = await res.json() as T;
  if (DEBUG_LOCATIONS) console.log("[locationService:post] <-", path, json);
  return json;
}

export type City = {
  id: string;
  name: string;
  centroid: { lon: number; lat: number } | null;
  bbox: { min_lon: number; min_lat: number; max_lon: number; max_lat: number } | null;
  search_count?: number;
};

export type Place = {
  id: string;
  city_id: string;
  name: string;
  place: string;
  centroid: { lon: number; lat: number } | null;
  bbox: { min_lon: number; min_lat: number; max_lon: number; max_lat: number } | null;
  population?: string;
};

export type PostalResolution = {
  postal_code: string;
  city: string;
  district: string;
  lat: number;
  lon: number;
  raw: Record<string, string> | null;
};

export type AddressPostalResolution = {
  postal_code: string;
  raw: Record<string, string> | null;
};

export const locationService = {
  async getCities(query = "", options?: { top?: boolean; limit?: number }): Promise<City[]> {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (options?.top) params.set("top", "true");
    if (options?.limit) params.set("limit", String(options.limit));
    const qs = params.toString() ? `?${params.toString()}` : "";
    const data = await get<{ cities: City[] }>(`/cities${qs}`);
    return data.cities;
  },

  async getPlaces(cityId: string, query = "", options?: { place?: string; limit?: number }): Promise<Place[]> {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (options?.place) params.set("place", options.place);
    if (options?.limit) params.set("limit", String(options.limit));
    const qs = params.toString() ? `?${params.toString()}` : "";
    const data = await get<{ places: Place[] }>(`/cities/${cityId}${qs}`);
    return data.places;
  },

  async trackCitySearch(cityId: string): Promise<void> {
    await post("/cities/track", { city_id: cityId }).catch(() => {});
  },

  async resolvePostalCode(postalCode: string, cityHint?: string | null): Promise<PostalResolution | null> {
    const clean = postalCode.replace(/\D/g, "").slice(0, 5);
    if (clean.length !== 5) return null;
    const params = new URLSearchParams();
    if (cityHint?.trim()) params.set("city_hint", cityHint.trim());
    const qs = params.toString() ? `?${params.toString()}` : "";
    const data = await get<{ result: PostalResolution | null }>(`/postal/${clean}${qs}`);
    return data.result;
  },

  async resolvePostalFromAddress(args: {
    city: string;
    district: string;
    street?: string | null;
    lat?: number | null;
    lon?: number | null;
  }): Promise<AddressPostalResolution | null> {
    const params = new URLSearchParams();
    params.set("city", args.city);
    params.set("district", args.district);
    if (args.street?.trim()) params.set("street", args.street.trim());
    if (typeof args.lat === "number") params.set("lat", String(args.lat));
    if (typeof args.lon === "number") params.set("lon", String(args.lon));
    const data = await get<{ result: AddressPostalResolution | null }>(`/resolve-postal?${params.toString()}`);
    return data.result;
  },
};
