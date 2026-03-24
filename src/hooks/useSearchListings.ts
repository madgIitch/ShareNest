import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import type { ListingFilters } from "../types/filters";
import type { Database } from "../types/database";
import type { ListingWithProperty } from "../types/listingWithProperty";

const PAGE_SIZE = 20;

function toRpcArgs(
  filters: ListingFilters,
  cursor: string | null,
  limit: number,
): Database["public"]["Functions"]["search_listings"]["Args"] {
  return {
    p_query:          filters.query          || null,
    p_city:           filters.city           || null,
    p_type:           filters.type           || null,
    p_price_min:      filters.priceMin       ?? null,
    p_price_max:      filters.priceMax       ?? null,
    p_size_min:       filters.sizeMin        ?? null,
    p_pets:           filters.petsAllowed    ?? null,
    p_smokers:        filters.smokersAllowed ?? null,
    p_available_from: filters.availableFrom  || null,
    p_lat:            filters.lat            ?? null,
    p_lng:            filters.lng            ?? null,
    p_radius_km:      filters.lat != null ? filters.radiusKm : null,
    p_cursor:         cursor,
    p_limit:          limit,
  };
}

/** Cursor-based infinite query for the list view (20 per page). */
export function useSearchListings(filters: ListingFilters) {
  return useInfiniteQuery({
    queryKey: ["listings", "search", filters],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc(
        "search_listings",
        toRpcArgs(filters, pageParam as string | null, PAGE_SIZE),
      );
      if (error) throw error;

      const rows = (data ?? []) as ListingWithProperty[];
      const hasMore = rows.length > PAGE_SIZE;
      const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
      const nextCursor = hasMore ? items[items.length - 1].created_at : null;
      return { items, nextCursor };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

/** Bulk query for the map view (up to 500 geo-tagged listings). */
export function useListingsForMap(filters: ListingFilters, enabled = true) {
  return useQuery({
    queryKey: ["listings", "map", filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "search_listings",
        toRpcArgs(filters, null, 500),
      );
      if (error) throw error;
      return (data ?? []) as ListingWithProperty[];
    },
    enabled,
  });
}
