import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import type { ListingFilters } from "../types/filters";
import type { ListingWithProperty } from "../types/listingWithProperty";
import type { CommonAreaType } from "../types/room";

const PAGE_SIZE = 20;

type SearchListingsRpcArgs = {
  p_query?: string | null;
  p_city_id?: string | null;
  p_place_id?: string | null;
  p_type?: "offer" | "search" | null;
  p_price_min?: number | null;
  p_price_max?: number | null;
  p_size_min?: number | null;
  p_allows_pets?: boolean | null;
  p_allows_smoking?: boolean | null;
  p_common_areas?: CommonAreaType[] | null;
  p_available_from?: string | null;
  p_lat?: number | null;
  p_lng?: number | null;
  p_radius_km?: number | null;
  p_limit?: number | null;
  p_offset?: number | null;
};

function toRpcArgs(filters: ListingFilters, offset: number, limit: number): SearchListingsRpcArgs {
  return {
    p_query: filters.query || null,
    p_city_id: filters.cityId ?? null,
    p_place_id: filters.placeId ?? null,
    p_type: filters.type || null,
    p_price_min: filters.priceMin ?? null,
    p_price_max: filters.priceMax ?? null,
    p_size_min: filters.sizeMin ?? null,
    p_allows_pets: filters.petsAllowed ?? null,
    p_allows_smoking: filters.smokersAllowed ?? null,
    p_common_areas: filters.commonAreas.length > 0 ? filters.commonAreas : null,
    p_available_from: filters.availableFrom || null,
    p_lat: filters.lat ?? null,
    p_lng: filters.lng ?? null,
    p_radius_km: filters.lat != null ? filters.radiusKm : null,
    p_limit: limit,
    p_offset: offset,
  };
}

/** Offset-based infinite query for the list view (20 per page). */
export function useSearchListings(filters: ListingFilters) {
  return useInfiniteQuery({
    queryKey: ["listings", "search", filters],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase.rpc(
        "search_listings",
        toRpcArgs(filters, pageParam as number, PAGE_SIZE) as never,
      );
      if (error) throw error;

      const rows = (data ?? []) as ListingWithProperty[];
      const items = rows.slice(0, PAGE_SIZE);
      const nextOffset = rows.length === PAGE_SIZE ? (pageParam as number) + items.length : undefined;
      return { items, nextOffset };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });
}

/** Bulk query for the map view (up to 500 geo-tagged listings). */
export function useListingsForMap(filters: ListingFilters, enabled = true) {
  return useQuery({
    queryKey: ["listings", "map", filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "search_listings",
        toRpcArgs(filters, 0, 500) as never,
      );
      if (error) throw error;
      return (data ?? []) as ListingWithProperty[];
    },
    enabled,
  });
}
