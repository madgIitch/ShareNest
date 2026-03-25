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
  property_id: string | null;
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
    property_id: string | null;
    created_by: string | null;
    created_at: string;
  } | null;
};

export type HouseholdSummary = {
  id: string;
  name: string;
  invite_code: string;
  listing_id?: string | null;
  property_id?: string | null;
  created_by: string | null;
  created_at: string;
};

export type HouseholdInviteData = {
  household_id: string;
  household_name: string;
  invite_code: string;
};

const HOUSEHOLD_KEY = ["household", "mine"];

function isMissingHouseholdPropertyId(error: { message?: string } | null | undefined): boolean {
  return !!error && typeof error.message === "string" && error.message.includes("property_id");
}

export function useMyHousehold() {
  return useQuery({
    queryKey: HOUSEHOLD_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_household");
      if (error) throw error;
      return (data?.[0] ?? null) as MyHousehold | null;
    },
    staleTime: 0,
    refetchOnMount: "always",
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
      const withProperty = await supabase
        .from("household_members")
        .select("household_id, role, joined_at, households(id, name, listing_id, property_id, created_by, created_at)")
        .eq("user_id", userId!)
        .order("joined_at", { ascending: false });
      if (!withProperty.error) {
        return (withProperty.data ?? []) as unknown as MyHouseholdMembership[];
      }

      if (!isMissingHouseholdPropertyId(withProperty.error)) throw withProperty.error;

      const fallback = await supabase
        .from("household_members")
        .select("household_id, role, joined_at, households(id, name, listing_id, created_by, created_at)")
        .eq("user_id", userId!)
        .order("joined_at", { ascending: false });
      if (fallback.error) throw fallback.error;

      return ((fallback.data ?? []) as Array<
        Omit<MyHouseholdMembership, "households"> & {
          households: Omit<NonNullable<MyHouseholdMembership["households"]>, "property_id"> | null;
        }
      >).map((row) => ({
        ...row,
        households: row.households ? { ...row.households, property_id: null } : null,
      }));
    },
    staleTime: 1000 * 60,
  });
}

export function useHouseholdById(householdId: string | undefined) {
  return useQuery({
    queryKey: ["household", "by-id", householdId],
    enabled: !!householdId,
    queryFn: async () => {
      const withProperty = await supabase
        .from("households")
        .select("id, name, invite_code, listing_id, property_id, created_by, created_at")
        .eq("id", householdId!)
        .single();
      if (!withProperty.error) return withProperty.data as HouseholdSummary;
      if (!isMissingHouseholdPropertyId(withProperty.error)) throw withProperty.error;

      const fallback = await supabase
        .from("households")
        .select("id, name, invite_code, listing_id, created_by, created_at")
        .eq("id", householdId!)
        .single();
      if (fallback.error) throw fallback.error;
      return { ...(fallback.data as Omit<HouseholdSummary, "property_id">), property_id: null } as HouseholdSummary;
    },
    staleTime: 1000 * 60,
  });
}

export function useOwnedHouseholds(userId: string | undefined) {
  return useQuery({
    queryKey: ["household", "owned", userId],
    enabled: !!userId,
    queryFn: async () => {
      const withProperty = await supabase
        .from("households")
        .select("id, name, invite_code, listing_id, property_id, created_by, created_at")
        .eq("created_by", userId!)
        .order("created_at", { ascending: false });
      if (!withProperty.error) {
        return (withProperty.data ?? []) as HouseholdSummary[];
      }
      if (!isMissingHouseholdPropertyId(withProperty.error)) throw withProperty.error;

      const fallback = await supabase
        .from("households")
        .select("id, name, invite_code, listing_id, created_by, created_at")
        .eq("created_by", userId!)
        .order("created_at", { ascending: false });
      if (fallback.error) throw fallback.error;
      return ((fallback.data ?? []) as Array<Omit<HouseholdSummary, "property_id">>).map((row) => ({
        ...row,
        property_id: null,
      }));
    },
    staleTime: 1000 * 60,
  });
}

export function useHouseholdInvite(householdId: string | undefined) {
  return useQuery({
    queryKey: ["household", "invite", householdId],
    enabled: !!householdId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_household_invite", {
        p_household_id: householdId!,
      } as any);
      if (error) throw error;
      return ((data ?? [])[0] ?? null) as HouseholdInviteData | null;
    },
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useCreateHousehold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, listingId, propertyId }: { name: string; listingId?: string; propertyId?: string | null }) => {
      const { data, error } = await supabase.rpc("create_household" as any, {
        p_name: name,
        p_listing_id: listingId ?? null,
        p_property_id: propertyId ?? null,
      } as any);

      const missingNewSignature =
        !!error &&
        typeof error.message === "string" &&
        error.message.includes("create_household(p_listing_id, p_name, p_property_id)");

      if (!missingNewSignature) {
        if (error) throw error;
        return { id: data as string };
      }

      const legacyCall = await supabase.rpc("create_household" as any, {
        p_name: name,
        p_listing_id: listingId ?? null,
      } as any);
      if (legacyCall.error) throw legacyCall.error;

      return { id: legacyCall.data as string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HOUSEHOLD_KEY });
      qc.invalidateQueries({ queryKey: ["household"] });
      qc.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useCreateHouseholdQuick() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      address,
      cityId,
      placeId,
      streetNumber,
      postalCode,
      floor,
    }: {
      name: string;
      address: string;
      cityId?: string | null;
      placeId?: string | null;
      streetNumber?: string | null;
      postalCode?: string | null;
      floor?: string | null;
    }) => {
      const { data, error } = await supabase.rpc("create_household_quick", {
        p_name: name,
        p_address: address,
        p_city_id: cityId ?? null,
        p_place_id: placeId ?? null,
        p_street_number: streetNumber ?? null,
        p_postal_code: postalCode ?? null,
        p_floor: floor ?? null,
      } as any);
      if (error) throw error;
      return (data?.[0] ?? null) as { household_id: string; property_id: string } | null;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HOUSEHOLD_KEY });
      qc.invalidateQueries({ queryKey: ["household"] });
      qc.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useJoinHousehold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data, error } = await supabase.rpc("join_household_by_code" as any, { p_code: inviteCode.toUpperCase() } as any);
      if (error) throw error;
      return data as string; // returns household_id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HOUSEHOLD_KEY });
      qc.invalidateQueries({ queryKey: ["household"] });
      qc.invalidateQueries({ queryKey: ["properties"] });
    },
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
