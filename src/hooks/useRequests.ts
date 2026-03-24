import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import type { Database, RequestStatus } from "../types/database";

type Request = Database["public"]["Tables"]["requests"]["Row"];
export const ACTIVE_REQUEST_STATUSES: RequestStatus[] = ["pending", "invited"];

export type OfferBillsMode = "included" | "extra" | "none";
export type OfferTerms = {
  price: number | null;
  available_from: string | null;
  min_stay_months: number | null;
  bills_mode: OfferBillsMode;
};

export type ConfirmAssignmentResult = {
  conversation_id: string;
  household_id: string | null;
  assignment_completed: boolean;
};

export type RequestWithDetails = Request & {
  requester: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    verified_at: string | null;
    bio: string | null;
    city: string | null;
    birth_year: number | null;
    occupation: string | null;
  } | null;
  listing: {
    id: string;
    title: string;
    city: string;
    images: string[];
    price: number;
    available_from: string | null;
    min_stay_months: number | null;
  } | null;
};

export function useReceivedRequests(ownerId: string | undefined) {
  return useQuery<RequestWithDetails[]>({
    queryKey: ["requests", "received", ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requests")
        .select(`
          *,
          requester:profiles!requests_requester_id_fkey(id, full_name, avatar_url, verified_at, bio, city, birth_year, occupation),
          listing:listings!requests_listing_id_fkey(id, title, city, images, price, available_from, min_stay_months)
        `)
        .eq("owner_id", ownerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as RequestWithDetails[];
    },
    enabled: !!ownerId,
  });
}

export function useSentRequests(requesterId: string | undefined) {
  return useQuery<RequestWithDetails[]>({
    queryKey: ["requests", "sent", requesterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requests")
        .select(`
          *,
          listing:listings!requests_listing_id_fkey(id, title, city, images, price, available_from, min_stay_months)
        `)
        .eq("requester_id", requesterId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as RequestWithDetails[];
    },
    enabled: !!requesterId,
  });
}

export function useMyRequestForListing(listingId: string | undefined, requesterId: string | undefined) {
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

export function useRequest(requestId: string | undefined) {
  return useQuery<RequestWithDetails | null>({
    queryKey: ["request", requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requests")
        .select(`
          *,
          requester:profiles!requests_requester_id_fkey(id, full_name, avatar_url, verified_at, bio, city, birth_year, occupation),
          listing:listings!requests_listing_id_fkey(id, title, city, images, price, available_from, min_stay_months)
        `)
        .eq("id", requestId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as RequestWithDetails | null;
    },
    enabled: !!requestId,
  });
}

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
      const { data: activeRow, error: activeErr } = await supabase
        .from("active_requests_count")
        .select("active_count")
        .eq("requester_id", requesterId)
        .maybeSingle();
      if (activeErr) throw activeErr;

      if ((activeRow?.active_count ?? 0) >= 3) {
        const limitErr = new Error("Has alcanzado el limite de solicitudes activas.");
        (limitErr as Error & { code?: string }).code = "LIMIT_REACHED";
        throw limitErr;
      }

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

export function useWithdrawRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      requesterId,
      ownerId,
      listingId,
    }: {
      requestId: string;
      requesterId: string;
      ownerId: string;
      listingId: string;
    }) => {
      const { error } = await supabase
        .from("requests")
        .delete()
        .eq("id", requestId)
        .eq("requester_id", requesterId);
      if (error) throw error;
    },
    onSuccess: (_, { requesterId, ownerId, listingId }) => {
      void queryClient.invalidateQueries({ queryKey: ["requests", "sent", requesterId] });
      void queryClient.invalidateQueries({ queryKey: ["requests", "received", ownerId] });
      void queryClient.invalidateQueries({ queryKey: ["requests", "for-listing", listingId, requesterId] });
      void queryClient.invalidateQueries({ queryKey: ["active-requests-count", requesterId] });
    },
  });
}

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      request,
      status,
      offerTerms,
    }: {
      request: RequestWithDetails;
      status: Extract<RequestStatus, "invited" | "offered" | "denied">;
      offerTerms?: OfferTerms;
    }) => {
      if (status === "invited") {
        const rpcName = request.status === "offered" ? "rollback_offer_to_invited" : "accept_request_chat";
        const { data, error } = await supabase.rpc(rpcName, {
          p_request_id: request.id,
        });
        if (error) throw error;
        if (!data) return null;
        return { id: data as string };
      }

      if (status === "offered") {
        const terms: OfferTerms = offerTerms ?? {
          price: request.listing?.price ?? null,
          available_from: request.listing?.available_from ?? null,
          min_stay_months: request.listing?.min_stay_months ?? null,
          bills_mode: "extra",
        };

        const { data, error } = await supabase.rpc("send_offer", {
          p_request_id: request.id,
          p_offer_terms: terms,
        });
        if (error) throw error;

        if (!data) return null;
        return { id: data as string };
      }

      const { error } = await supabase.rpc("deny_request", { p_request_id: request.id });
      if (error) throw error;
      return null;
    },
    onSuccess: (_, { request }) => {
      void queryClient.invalidateQueries({ queryKey: ["request", request.id] });
      void queryClient.invalidateQueries({ queryKey: ["requests", "received", request.owner_id] });
      void queryClient.invalidateQueries({ queryKey: ["requests", "sent", request.requester_id] });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      void queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useAcceptOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.rpc("accept_offer", { p_request_id: requestId });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["requests"] });
      void queryClient.invalidateQueries({ queryKey: ["request"] });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      void queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useConfirmAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.rpc("confirm_assignment", { p_request_id: requestId });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row ?? null) as ConfirmAssignmentResult | null;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
      void queryClient.invalidateQueries({ queryKey: ["requests"] });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      void queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

