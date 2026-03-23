import { useQuery } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";

type Property = Database["public"]["Tables"]["properties"]["Row"];

export type PropertyWithCity = Property & {
  city: { name: string } | null;
};

export function useMyProperties(ownerId: string | undefined) {
  return useQuery<PropertyWithCity[]>({
    queryKey: ["properties", "mine", ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*, city:cities(name)")
        .eq("owner_id", ownerId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as PropertyWithCity[];
    },
    enabled: !!ownerId,
  });
}

