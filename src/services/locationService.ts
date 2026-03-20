// src/services/locationService.ts
const FUNCTIONS_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/locations`;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  "Content-Type": "application/json",
};

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${FUNCTIONS_URL}${path}`, { headers });
  if (!res.ok) throw new Error(`locations API error: ${res.status}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${FUNCTIONS_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`locations API error: ${res.status}`);
  return res.json() as Promise<T>;
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
};
