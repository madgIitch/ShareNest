import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";

type SuggestedConnection = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  status: "none" | "pending" | "accepted";
  subtitle: string;
};

type ProfilePreview = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "username" | "avatar_url"
>;

type ConnectionRow = Database["public"]["Tables"]["connections"]["Row"];

export function useConnections(userId?: string | null) {
  const queryClient = useQueryClient();

  const suggestionsQuery = useQuery<SuggestedConnection[]>({
    queryKey: ["connection-suggestions", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<SuggestedConnection[]> => {
      const [{ data: profiles, error: profilesError }, { data: connections, error: connectionsError }] =
        await Promise.all([
          (supabase
            .from("profiles")
            .select("id, full_name, username, avatar_url")
            .neq("id", userId as string)
            .not("full_name", "is", null)
            .limit(6) as any),
          (supabase
            .from("connections")
            .select("*")
            .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`) as any),
        ]);

      if (profilesError) throw profilesError;
      if (connectionsError) throw connectionsError;

      const statusByUser = new Map<string, "pending" | "accepted">();

      for (const connection of (connections as ConnectionRow[] | null) ?? []) {
        const targetId =
          connection.requester_id === userId
            ? connection.addressee_id
            : connection.requester_id;
        statusByUser.set(targetId, connection.status);
      }

      return (((profiles as ProfilePreview[] | null) ?? []).slice(0, 3)).map((profile) => {
        const status = statusByUser.get(profile.id) ?? "none";

        return {
          ...profile,
          status,
          subtitle:
            status === "accepted"
              ? "Ya estáis conectados"
              : status === "pending"
                ? "Solicitud enviada"
                : "Sugerido para tu red",
        };
      });
    },
  });

  const connectMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!userId) throw new Error("Missing user id");

      const { data: existing, error: existingError } = await ((supabase
        .from("connections")
        .select("id")
        .or(
          `and(requester_id.eq.${userId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${userId})`
        )
        .maybeSingle()) as any);

      if (existingError && existingError.code !== "PGRST116") throw existingError;
      if (existing) return existing;

      const { data, error } = await (((supabase.from("connections") as any)
        .insert({
          requester_id: userId,
          addressee_id: targetUserId,
        } as Database["public"]["Tables"]["connections"]["Insert"])
        .select("id")
        .single()) as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["connection-suggestions", userId],
      });
    },
  });

  return {
    suggestions: suggestionsQuery.data ?? [],
    loadingSuggestions: suggestionsQuery.isLoading,
    connect: connectMutation.mutateAsync,
    connectingTo: connectMutation.variables ?? null,
    connecting: connectMutation.isPending,
  };
}
