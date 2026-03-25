import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";

type SearchArgs = Database["public"]["Functions"]["search_room_listings"]["Args"];
type RoomListing = Database["public"]["Tables"]["room_listings"]["Row"];

const PAGE_SIZE = 20;

export function useRoomListings(filters: SearchArgs = {}) {
  return useInfiniteQuery({
    queryKey: ["room_listings", filters],
    queryFn: async ({ pageParam = 0 }): Promise<RoomListing[]> => {
      const { data, error } = await (supabase.rpc("search_room_listings", {
        ...filters,
        p_limit: PAGE_SIZE,
        p_offset: pageParam,
      } as any) as any);
      if (error) throw error;
      return (data as RoomListing[] | null) ?? [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
  });
}
