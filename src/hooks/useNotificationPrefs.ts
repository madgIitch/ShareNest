import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

export type NotifPrefs = {
  notif_messages: boolean;
  notif_requests: boolean;
  notif_friendz: boolean;
};

export function useUpdateNotifPrefs() {
  const { session, refreshProfile } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (prefs: Partial<NotifPrefs>) => {
      const userId = session?.user?.id;
      if (!userId) throw new Error("not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update(prefs)
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      refreshProfile();
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
