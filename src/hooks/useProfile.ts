import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export function isProfileComplete(profile: ProfileRow | null | undefined) {
  return Boolean(
    profile?.full_name &&
      profile?.username &&
      profile?.birth_year &&
      profile?.occupation &&
      profile?.schedule &&
      profile?.cleanliness &&
      profile?.noise_level &&
      profile?.looking_for
  );
}

export function useProfile(userId?: string | null) {
  const queryClient = useQueryClient();

  const profileQuery = useQuery<ProfileRow | null>({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<ProfileRow | null> => {
      const { data, error } = await (supabase
        .from("profiles")
        .select("*")
        .eq("id", userId as string)
        .maybeSingle() as any);

      if (error) throw error;
      return (data as ProfileRow | null) ?? null;
    },
  });

  const saveProfileMutation = useMutation({
    mutationFn: async (values: ProfileUpdate): Promise<ProfileRow> => {
      if (!userId) throw new Error("Missing user id");

      const { data, error } = await (((supabase.from("profiles") as any).upsert({
          id: userId,
          ...values,
        } as Database["public"]["Tables"]["profiles"]["Insert"])
        .select("*")
        .single()) as any);

      if (error) throw error;
      return data as ProfileRow;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(["profile", userId], profile);
    },
  });

  return {
    ...profileQuery,
    profile: profileQuery.data ?? null,
    saveProfile: saveProfileMutation.mutateAsync,
    saving: saveProfileMutation.isPending,
  };
}
