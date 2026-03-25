// src/hooks/useSubscription.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

const QUERY_KEY = ["subscription", "active"];

export function useIsSuperfriendz() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("status", "active")
        .or("expires_at.is.null,expires_at.gt.now()")
        .maybeSingle();
      return !!data;
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useInvalidateSubscription() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: QUERY_KEY });
}
