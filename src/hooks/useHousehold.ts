// src/hooks/useHousehold.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export type HouseholdMember = {
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
  } | null;
};

export type MyHousehold = {
  id: string;
  name: string;
  invite_code: string;
  listing_id: string | null;
  created_by: string;
  created_at: string;
  member_role: string;
};

export type MyHouseholdMembership = {
  household_id: string;
  role: "admin" | "member";
  joined_at: string;
  households: {
    id: string;
    name: string;
    listing_id: string | null;
    created_by: string | null;
    created_at: string;
  } | null;
};

const HOUSEHOLD_KEY = ["household", "mine"];

export function useMyHousehold() {
  return useQuery({
    queryKey: HOUSEHOLD_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_household");
      if (error) throw error;
      return (data?.[0] ?? null) as MyHousehold | null;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useHouseholdMembers(householdId: string | undefined) {
  return useQuery({
    queryKey: ["household", "members", householdId],
    enabled: !!householdId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("household_members")
        .select("user_id, role, joined_at, profiles(full_name, avatar_url, username)")
        .eq("household_id", householdId!);
      if (error) throw error;
      return (data ?? []) as HouseholdMember[];
    },
  });
}

export function useMyHouseholdMemberships(userId: string | undefined) {
  return useQuery({
    queryKey: ["household", "memberships", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("household_members")
        .select("household_id, role, joined_at, households(id, name, listing_id, created_by, created_at)")
        .eq("user_id", userId!)
        .order("joined_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MyHouseholdMembership[];
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateHousehold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, listingId }: { name: string; listingId?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("households")
        .insert({ name, listing_id: listingId ?? null, created_by: user.id })
        .select("id")
        .single();
      if (error) throw error;

      // Creator becomes admin
      await supabase.from("household_members").insert({
        household_id: data.id,
        user_id: user.id,
        role: "admin",
      });

      return data as { id: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: HOUSEHOLD_KEY }),
  });
}

export function useJoinHousehold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data, error } = await supabase.rpc("join_household_by_code", { p_code: inviteCode.toUpperCase() });
      if (error) throw error;
      return data as string; // returns household_id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: HOUSEHOLD_KEY }),
  });
}

export function useLeaveHousehold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ householdId, userId }: { householdId: string; userId: string }) => {
      const { error } = await supabase
        .from("household_members")
        .delete()
        .eq("household_id", householdId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: HOUSEHOLD_KEY }),
  });
}
