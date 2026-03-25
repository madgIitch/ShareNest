import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";

type Message = Database["public"]["Tables"]["messages"]["Row"];
type Conversation = Database["public"]["Tables"]["conversations"]["Row"];

type MiniProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  verified_at: string | null;
};

export type ConversationWithDetails = Conversation & {
  profile_a: MiniProfile | null;
  profile_b: MiniProfile | null;
  listing: { id: string; title: string; city: string; images: string[] } | null;
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/** All my conversations, ordered by last activity */
export function useConversations(userId: string | undefined) {
  return useQuery<ConversationWithDetails[]>({
    queryKey: ["conversations", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          profile_a:profiles!conversations_participant_a_fkey(id, full_name, avatar_url, verified_at),
          profile_b:profiles!conversations_participant_b_fkey(id, full_name, avatar_url, verified_at),
          listing:listings!conversations_listing_id_fkey(id, title, city, images)
        `)
        .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as unknown as ConversationWithDetails[];
    },
    enabled: !!userId,
  });
}

/** Single conversation detail */
export function useConversation(conversationId: string | undefined) {
  return useQuery<ConversationWithDetails | null>({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          profile_a:profiles!conversations_participant_a_fkey(id, full_name, avatar_url, verified_at),
          profile_b:profiles!conversations_participant_b_fkey(id, full_name, avatar_url, verified_at),
          listing:listings!conversations_listing_id_fkey(id, title, city, images)
        `)
        .eq("id", conversationId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as ConversationWithDetails | null;
    },
    enabled: !!conversationId,
  });
}

/**
 * Messages for a conversation with real-time subscription.
 * New messages are appended directly to the React Query cache.
 */
export function useConversationMessages(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["messages", conversationId];

  const query = useQuery<Message[]>({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
    enabled: !!conversationId,
  });

  // Real-time: append new messages to cache without re-fetching
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          queryClient.setQueryData<Message[]>(queryKey, (old) =>
            old ? [...old, newMsg] : [newMsg],
          );
          // Also refresh conversations list to update preview
          void queryClient.invalidateQueries({ queryKey: ["conversations"] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return query;
}

/** Total unread messages count across all conversations */
export function useUnreadCount(userId: string | undefined) {
  return useQuery<number>({
    queryKey: ["unread-count", userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .neq("sender_id", userId!)
        .is("read_at", null)
        .filter(
          "conversation_id",
          "in",
          `(select id from conversations where participant_a='${userId}' or participant_b='${userId}')`,
        );
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!userId,
    refetchInterval: 30_000, // poll every 30s as fallback
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Send a message in a conversation */
export function useSendMessage() {
  return useMutation({
    mutationFn: async ({
      conversationId,
      senderId,
      content,
    }: {
      conversationId: string;
      senderId: string;
      content: string;
    }) => {
      const { data, error } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: senderId, content })
        .select()
        .single();
      if (error) throw error;
      return data as Message;
    },
    // No invalidation needed — Realtime subscription handles new messages
  });
}

/** Mark all unread messages in a conversation as read (received by me) */
export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      myId,
    }: {
      conversationId: string;
      myId: string;
    }) => {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .neq("sender_id", myId)
        .is("read_at", null);
    },
    onSuccess: (_, { myId }) => {
      void queryClient.invalidateQueries({ queryKey: ["unread-count", myId] });
    },
  });
}
