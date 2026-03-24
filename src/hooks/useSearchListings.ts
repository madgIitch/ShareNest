import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import type { ListingFilters } from "../types/filters";
import type { Database } from "../types/database";

type Listing = Database["public"]["Tables"]["listings"]["Row"];
type ListingViewRow = Listing;

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

      const rows = (data ?? []) as Listing[];
      const hasMore = rows.length > PAGE_SIZE;
      const rpcItems = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
      const nextCursor = hasMore ? rpcItems[rpcItems.length - 1].created_at : null;

      if (rpcItems.length === 0) return { items: [], nextCursor };

      const ids = rpcItems.map((r) => r.id);
      const { data: hydrated, error: hydrateError } = await supabase
        .from("listings_with_property")
        .select("*")
        .in("id", ids);
      if (hydrateError) throw hydrateError;

      const byId = new Map(((hydrated ?? []) as unknown as ListingViewRow[]).map((r) => [r.id, r]));
      const items = ids.map((id) => byId.get(id)).filter((x): x is Listing => !!x);
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
      const rows = (data ?? []) as Listing[];
      if (rows.length === 0) return [];
      const ids = rows.map((r) => r.id);
      const { data: hydrated, error: hydrateError } = await supabase
        .from("listings_with_property")
        .select("*")
        .in("id", ids);
      if (hydrateError) throw hydrateError;
      const byId = new Map(((hydrated ?? []) as unknown as ListingViewRow[]).map((r) => [r.id, r]));
      return ids.map((id) => byId.get(id)).filter((x): x is Listing => !!x);
    },
    enabled,
  });
}
