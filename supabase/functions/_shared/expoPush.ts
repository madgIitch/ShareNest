const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: "default";
  channelId?: string;
}

export async function sendExpoPush(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;
  await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(messages),
  });
}

/** Fetch all Expo push tokens for a user */
export async function getTokensForUser(
  supabase: ReturnType<typeof import("jsr:@supabase/supabase-js@2").createClient>,
  userId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("user_id", userId);
  return (data ?? []).map((r: { token: string }) => r.token);
}
