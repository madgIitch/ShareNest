import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import type { Database, RequestStatus } from "../types/database";

type Request = Database["public"]["Tables"]["requests"]["Row"];

// Shape returned by queries that join related tables
export type RequestWithDetails = Request & {
  requester: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    verified_at: string | null;
    bio: string | null;
    city: string | null;
  } | null;
  listing: {
    id: string;
    title: string;
    city: string;
    images: string[];
    price: number;
  } | null;
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/** All requests I received as owner (for all my listings) */
export function useReceivedRequests(ownerId: string | undefined) {
  return useQuery<RequestWithDetails[]>({
    queryKey: ["requests", "received", ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requests")
        .select(`
          *,
          requester:profiles!requests_requester_id_fkey(id, full_name, avatar_url, verified_at, bio, city),
          listing:listings!requests_listing_id_fkey(id, title, city, images, price)
        `)
        .eq("owner_id", ownerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as RequestWithDetails[];
    },
    enabled: !!ownerId,
  });
}

/** All requests I sent as requester */
export function useSentRequests(requesterId: string | undefined) {
  return useQuery<RequestWithDetails[]>({
    queryKey: ["requests", "sent", requesterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requests")
        .select(`
          *,
          listing:listings!requests_listing_id_fkey(id, title, city, images, price)
        `)
        .eq("requester_id", requesterId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as RequestWithDetails[];
    },
    enabled: !!requesterId,
  });
}

/** My request for a specific listing (to know current status) */
export function useMyRequestForListing(
  listingId: string | undefined,
  requesterId: string | undefined,
) {
  return useQuery<Request | null>({
    queryKey: ["requests", "for-listing", listingId, requesterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("listing_id", listingId!)
        .eq("requester_id", requesterId!)
        .maybeSingle();
      if (error) throw error;
      return data as Request | null;
    },
    enabled: !!listingId && !!requesterId,
  });
}

/** Single request detail (for request/[id] screen) */
export function useRequest(requestId: string | undefined) {
  return useQuery<RequestWithDetails | null>({
    queryKey: ["request", requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requests")
        .select(`
          *,
          requester:profiles!requests_requester_id_fkey(id, full_name, avatar_url, verified_at, bio, city),
          listing:listings!requests_listing_id_fkey(id, title, city, images, price)
        `)
        .eq("id", requestId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as RequestWithDetails | null;
    },
    enabled: !!requestId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Send a request for a listing */
export function useSendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listingId,
      requesterId,
      ownerId,
      message,
    }: {
      listingId: string;
      requesterId: string;
      ownerId: string;
      message: string;
    }) => {
      const { data, error } = await supabase
        .from("requests")
        .insert({ listing_id: listingId, requester_id: requesterId, owner_id: ownerId, message })
        .select()
        .single();
      if (error) throw error;
      return data as Request;
    },
    onSuccess: (_, { listingId, requesterId, ownerId }) => {
      void queryClient.invalidateQueries({ queryKey: ["requests", "for-listing", listingId, requesterId] });
      void queryClient.invalidateQueries({ queryKey: ["requests", "sent", requesterId] });
      void queryClient.invalidateQueries({ queryKey: ["requests", "received", ownerId] });
    },
  });
}

/** Accept or deny a request. On accept, automatically creates conversation. */
export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      request,
      status,
    }: {
      request: RequestWithDetails;
      status: Extract<RequestStatus, "accepted" | "denied">;
    }) => {
      // 1. Update request status
      const { error: reqErr } = await supabase
        .from("requests")
        .update({ status })
        .eq("id", request.id);
      if (reqErr) throw reqErr;

      // 2. If accepted → create conversation + add initial message
      if (status === "accepted") {
        const { data: conv, error: convErr } = await supabase
          .from("conversations")
          .insert({
            listing_id: request.listing_id,
            request_id: request.id,
            participant_a: request.owner_id,
            participant_b: request.requester_id,
          })
          .select()
          .single();
        if (convErr) throw convErr;

        // Add the requester's original message as first chat message
        if (request.message && conv) {
          await supabase.from("messages").insert({
            conversation_id: conv.id,
            sender_id: request.requester_id,
            content: request.message,
          });
        }

        return conv;
      }

      return null;
    },
    onSuccess: (conv, { request }) => {
      void queryClient.invalidateQueries({ queryKey: ["request", request.id] });
      void queryClient.invalidateQueries({ queryKey: ["requests", "received", request.owner_id] });
      void queryClient.invalidateQueries({ queryKey: ["requests", "sent", request.requester_id] });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
