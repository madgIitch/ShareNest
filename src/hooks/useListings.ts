import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import type { Database, ListingStatus } from "../types/database";
import type { ListingWithProperty } from "../types/listingWithProperty";

type ListingInsert = Database["public"]["Tables"]["listings"]["Insert"];
type ListingUpdate = Database["public"]["Tables"]["listings"]["Update"];

// --- Queries ---

export function useListing(id: string | undefined) {
  return useQuery<ListingWithProperty>({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings_with_property")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as ListingWithProperty;
    },
    enabled: !!id,
  });
}

export function useMyListings(userId: string | undefined) {
  return useQuery<ListingWithProperty[]>({
    queryKey: ["listings", "mine", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings_with_property")
        .select("*")
        .eq("owner_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ListingWithProperty[];
    },
    enabled: !!userId,
  });
}

export function useActiveListings(city?: string) {
  return useQuery<ListingWithProperty[]>({
    queryKey: ["listings", "active", city ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("listings_with_property")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (city) query = query.eq("city", city);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ListingWithProperty[];
    },
  });
}

export function useListingsByIds(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids));

  return useQuery<ListingWithProperty[]>({
    queryKey: ["listings", "by-ids", uniqueIds.sort().join(",")],
    queryFn: async () => {
      if (uniqueIds.length === 0) return [];
      const { data, error } = await supabase
        .from("listings_with_property")
        .select("*")
        .in("id", uniqueIds);
      if (error) throw error;
      const rows = (data ?? []) as ListingWithProperty[];
      const byId = new Map(rows.map((r) => [r.id, r]));
      return uniqueIds.map((id) => byId.get(id)).filter((x): x is ListingWithProperty => !!x);
    },
    enabled: uniqueIds.length > 0,
  });
}

// --- Mutations ---

export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ListingInsert) => {
      const { data, error } = await (supabase
        .from("listings" as any)
        .insert(payload as any)
        .select("id")
        .single() as any);
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: (_, payload) => {
      void queryClient.invalidateQueries({ queryKey: ["listings", "mine", payload.owner_id] });
      void queryClient.invalidateQueries({ queryKey: ["listings", "active"] });
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ListingUpdate }) => {
      const { error } = await supabase.from("listings" as any).update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["listing", id] });
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useUpdateListingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ListingStatus }) => {
      const { error } = await supabase.from("listings" as any).update({ status } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["listing", id] });
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("listings" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}
