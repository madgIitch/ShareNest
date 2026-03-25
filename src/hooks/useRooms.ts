import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import type { Room, RoomInsert, RoomUpdate } from "../types/room";

export function useRoomsByProperty(propertyId: string | undefined) {
  return useQuery<Room[]>({
    queryKey: ["rooms", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("property_id", propertyId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Room[];
    },
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RoomInsert) => {
      const { data, error } = await (supabase
        .from("rooms" as any)
        .insert(payload as any)
        .select("*")
        .single() as any);
      if (error) throw error;
      return data as Room;
    },
    onSuccess: (room) => {
      void queryClient.invalidateQueries({ queryKey: ["rooms", room.property_id] });
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RoomUpdate }) => {
      const { data, error } = await (supabase
        .from("rooms" as any)
        .update(updates as any)
        .eq("id", id)
        .select("*")
        .single() as any);
      if (error) throw error;
      return data as Room;
    },
    onSuccess: (room) => {
      void queryClient.invalidateQueries({ queryKey: ["rooms", room.property_id] });
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, propertyId }: { id: string; propertyId?: string | null }) => {
      const { data: activeListing, error: listingError } = await supabase
        .from("listings")
        .select("id")
        .eq("room_id", id)
        .eq("status", "active")
        .maybeSingle();
      if (listingError) throw listingError;
      if (activeListing) {
        throw new Error("No se puede eliminar una habitacion con un listing activo.");
      }

      const { error } = await supabase.from("rooms" as any).delete().eq("id", id);
      if (error) throw error;
      return { id, propertyId: propertyId ?? null };
    },
    onSuccess: ({ propertyId }) => {
      void queryClient.invalidateQueries({ queryKey: ["rooms", propertyId ?? undefined] });
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
      void queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}
