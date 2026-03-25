import { createClient } from "jsr:@supabase/supabase-js@2";
import { getTokensForUser, sendExpoPush } from "../_shared/expoPush.ts";

Deno.serve(async (req) => {
  try {
    const { record } = await req.json() as {
      record: {
        id: string;
        conversation_id: string;
        sender_id: string;
        content: string;
        created_at: string;
      };
    };

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get conversation participants + listing title
    const { data: conv } = await supabase
      .from("conversations")
      .select("participant_a, participant_b, listing:listings(title)")
      .eq("id", record.conversation_id)
      .single();

    if (!conv) return new Response("conversation not found", { status: 404 });

    const recipientId =
      conv.participant_a === record.sender_id ? conv.participant_b : conv.participant_a;

    // Get recipient notification prefs + sender name in parallel
    const [{ data: recipient }, { data: sender }, tokens] = await Promise.all([
      supabase.from("profiles").select("full_name, notif_messages").eq("id", recipientId).single(),
      supabase.from("profiles").select("full_name").eq("id", record.sender_id).single(),
      getTokensForUser(supabase, recipientId),
    ]);

    if (!recipient?.notif_messages || tokens.length === 0) {
      return new Response("skipped", { status: 200 });
    }

    const bodyText = record.content.length > 100
      ? record.content.slice(0, 97) + "..."
      : record.content;

    await sendExpoPush(tokens.map((token) => ({
      to: token,
      title: sender?.full_name ?? "Nuevo mensaje",
      body: bodyText,
      data: { screen: "conversation", id: record.conversation_id },
      sound: "default",
      channelId: "messages",
    })));

    return new Response("ok", { status: 200 });
  } catch (err) {
    return new Response(String(err), { status: 500 });
  }
});
