import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";

type Property = Database["public"]["Tables"]["properties"]["Row"];
type PropertyUpdate = Database["public"]["Tables"]["properties"]["Update"];

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
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PropertyWithCity[];
    },
    enabled: !!ownerId,
  });
}

export function useProperty(id: string | undefined) {
  return useQuery<PropertyWithCity>({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*, city:cities(name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as PropertyWithCity;
    },
    enabled: !!id,
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ownerId,
      updates,
    }: {
      id: string;
      ownerId?: string;
      updates: PropertyUpdate;
    }) => {
      const query = supabase.from("properties").update(updates).eq("id", id);
      const { error } = ownerId ? await query.eq("owner_id", ownerId) : await query;
      if (error) throw error;
    },
    onSuccess: (_, { id, ownerId }) => {
      void queryClient.invalidateQueries({ queryKey: ["property", id] });
      void queryClient.invalidateQueries({ queryKey: ["properties"] });
      if (ownerId) {
        void queryClient.invalidateQueries({ queryKey: ["properties", "mine", ownerId] });
      }
    },
  });
}
