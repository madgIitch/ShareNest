import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import type { Database, ListingStatus } from "../types/database";

type Listing = Database["public"]["Tables"]["listings"]["Row"];
type ListingInsert = Database["public"]["Tables"]["listings"]["Insert"];
type ListingUpdate = Database["public"]["Tables"]["listings"]["Update"];

// --- Queries ---

export function useListing(id: string | undefined) {
  return useQuery<Listing>({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Listing;
    },
    enabled: !!id,
  });
}

export function useMyListings(userId: string | undefined) {
  return useQuery<Listing[]>({
    queryKey: ["listings", "mine", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("owner_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Listing[];
    },
    enabled: !!userId,
  });
}

export function useActiveListings(city?: string) {
  return useQuery<Listing[]>({
    queryKey: ["listings", "active", city ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (city) query = query.eq("city", city);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Listing[];
    },
  });
}

export function useListingsByIds(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids));

  return useQuery<Listing[]>({
    queryKey: ["listings", "by-ids", uniqueIds.sort().join(",")],
    queryFn: async () => {
      if (uniqueIds.length === 0) return [];
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .in("id", uniqueIds);
      if (error) throw error;
      const rows = (data ?? []) as Listing[];
      const byId = new Map(rows.map((r) => [r.id, r]));
      return uniqueIds.map((id) => byId.get(id)).filter((x): x is Listing => !!x);
    },
    enabled: uniqueIds.length > 0,
  });
}

// --- Mutations ---

export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ListingInsert) => {
      const { data, error } = await supabase
        .from("listings")
        .insert(payload)
        .select("id")
        .single();
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
      const { error } = await supabase.from("listings").update(updates).eq("id", id);
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
      const { error } = await supabase.from("listings").update({ status }).eq("id", id);
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
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}
