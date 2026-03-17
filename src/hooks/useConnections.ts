import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type UserSearchResult = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
  verified_at: string | null;
  city: string | null;
};

export type MutualFriend = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
  verified_at: string | null;
};

export type ConnectionRelation =
  | "none"
  | "pending_sent"      // I sent, waiting
  | "pending_received"  // They sent, I can accept
  | "accepted";

// ─── My accepted friendz list ───────────────────────────────────────────────

export function useMyFriendz(userId: string | undefined) {
  return useQuery({
    queryKey: ["friendz", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("connections")
        .select(`
          id, status, created_at,
          requester:profiles!connections_requester_id_fkey(id, full_name, avatar_url, username, verified_at, city),
          addressee:profiles!connections_addressee_id_fkey(id, full_name, avatar_url, username, verified_at, city)
        `)
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq("status", "accepted")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Flatten to "the other person"
      return (data ?? []).map((c) => {
        const other = (c.requester as any)?.id === userId ? c.addressee : c.requester;
        return { connectionId: c.id, ...(other as UserSearchResult) };
      });
    },
  });
}

// ─── Pending received (I need to accept/reject) ─────────────────────────────

export function usePendingReceived(userId: string | undefined) {
  return useQuery({
    queryKey: ["connections_pending_received", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("connections")
        .select(`
          id, created_at,
          requester:profiles!connections_requester_id_fkey(id, full_name, avatar_url, username, verified_at, city)
        `)
        .eq("addressee_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as { id: string; created_at: string; requester: UserSearchResult }[];
    },
  });
}

// ─── Pending sent (waiting for them) ────────────────────────────────────────

export function usePendingSent(userId: string | undefined) {
  return useQuery({
    queryKey: ["connections_pending_sent", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("connections")
        .select(`
          id, created_at,
          addressee:profiles!connections_addressee_id_fkey(id, full_name, avatar_url, username, verified_at, city)
        `)
        .eq("requester_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as { id: string; created_at: string; addressee: UserSearchResult }[];
    },
  });
}

// ─── Connection relation between me and another user ────────────────────────

export function useConnectionRelation(myId: string | undefined, otherId: string | undefined) {
  return useQuery({
    queryKey: ["connection_relation", myId, otherId],
    enabled: !!myId && !!otherId,
    queryFn: async (): Promise<{ relation: ConnectionRelation; connectionId: string | null }> => {
      const { data, error } = await supabase
        .from("connections")
        .select("id, requester_id, status")
        .or(
          `and(requester_id.eq.${myId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${myId})`
        )
        .maybeSingle();

      if (error) throw error;
      if (!data) return { relation: "none", connectionId: null };

      if (data.status === "accepted") return { relation: "accepted", connectionId: data.id };
      if (data.requester_id === myId) return { relation: "pending_sent", connectionId: data.id };
      return { relation: "pending_received", connectionId: data.id };
    },
  });
}

// ─── Mutual friends ──────────────────────────────────────────────────────────

export function useMutualFriends(userA: string | undefined, userB: string | undefined) {
  return useQuery({
    queryKey: ["mutual_friends", userA, userB],
    enabled: !!userA && !!userB,
    queryFn: async (): Promise<MutualFriend[]> => {
      const { data, error } = await supabase.rpc("get_mutual_friends", {
        p_user_a: userA!,
        p_user_b: userB!,
      });
      if (error) throw error;
      return (data ?? []) as MutualFriend[];
    },
  });
}

// ─── Connection degree (1 = friend, 2 = FoF) ────────────────────────────────

export function useConnectionDegree(viewer: string | undefined, target: string | undefined) {
  return useQuery({
    queryKey: ["connection_degree", viewer, target],
    enabled: !!viewer && !!target && viewer !== target,
    queryFn: async (): Promise<number | null> => {
      const { data, error } = await supabase.rpc("get_connection_degree", {
        p_viewer: viewer!,
        p_target: target!,
      });
      if (error) throw error;
      return data as number | null;
    },
  });
}

// ─── Search users ────────────────────────────────────────────────────────────

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ["search_users", query],
    enabled: query.trim().length >= 2,
    queryFn: async (): Promise<UserSearchResult[]> => {
      const { data, error } = await supabase.rpc("search_users", {
        p_query: query.trim(),
        p_limit: 30,
      });
      if (error) throw error;
      return (data ?? []) as UserSearchResult[];
    },
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

function invalidateAll(qc: ReturnType<typeof useQueryClient>, myId: string, otherId?: string) {
  qc.invalidateQueries({ queryKey: ["friendz"] });
  qc.invalidateQueries({ queryKey: ["connections_pending_received"] });
  qc.invalidateQueries({ queryKey: ["connections_pending_sent"] });
  if (otherId) {
    qc.invalidateQueries({ queryKey: ["connection_relation", myId, otherId] });
    qc.invalidateQueries({ queryKey: ["connection_relation", otherId, myId] });
    qc.invalidateQueries({ queryKey: ["mutual_friends"] });
    qc.invalidateQueries({ queryKey: ["connection_degree"] });
  }
}

export function useSendConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requesterId, addresseeId }: { requesterId: string; addresseeId: string }) => {
      const { data, error } = await supabase
        .from("connections")
        .insert({ requester_id: requesterId, addressee_id: addresseeId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, { requesterId, addresseeId }) => {
      invalidateAll(qc, requesterId, addresseeId);
    },
  });
}

export function useRespondConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      connectionId,
      accept,
      myId,
      otherId,
    }: {
      connectionId: string;
      accept: boolean;
      myId: string;
      otherId: string;
    }) => {
      if (accept) {
        const { error } = await supabase
          .from("connections")
          .update({ status: "accepted" })
          .eq("id", connectionId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("connections")
          .delete()
          .eq("id", connectionId);
        if (error) throw error;
      }
    },
    onSuccess: (_data, { myId, otherId }) => {
      invalidateAll(qc, myId, otherId);
    },
  });
}

export function useRemoveConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ connectionId }: { connectionId: string }) => {
      const { error } = await supabase.from("connections").delete().eq("id", connectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(qc, "");
    },
  });
}
