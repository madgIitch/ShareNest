import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import type { CommonArea, CommonAreaInsert } from "../types/room";

export function useCommonAreasByProperty(propertyId: string | undefined) {
  return useQuery<CommonArea[]>({
    queryKey: ["common-areas", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("common_areas")
        .select("*")
        .eq("property_id", propertyId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CommonArea[];
    },
  });
}

export function useUpsertCommonArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CommonAreaInsert) => {
      const { data, error } = await (supabase
        .from("common_areas" as any)
        .upsert(payload as any, { onConflict: "property_id,type" })
        .select("*")
        .single() as any);
      if (error) throw error;
      return data as CommonArea;
    },
    onSuccess: (commonArea) => {
      void queryClient.invalidateQueries({ queryKey: ["common-areas", commonArea.property_id] });
      void queryClient.invalidateQueries({ queryKey: ["common-areas"] });
    },
  });
}

export function useDeleteCommonArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, propertyId }: { id: string; propertyId?: string | null }) => {
      const { error } = await supabase.from("common_areas" as any).delete().eq("id", id);
      if (error) throw error;
      return { id, propertyId: propertyId ?? null };
    },
    onSuccess: ({ propertyId }) => {
      void queryClient.invalidateQueries({ queryKey: ["common-areas", propertyId ?? undefined] });
      void queryClient.invalidateQueries({ queryKey: ["common-areas"] });
    },
  });
}
