import { createClient } from "jsr:@supabase/supabase-js@2";
import { getTokensForUser, sendExpoPush } from "../_shared/expoPush.ts";

// Triggered on connections INSERT (new friend request)
Deno.serve(async (req) => {
  try {
    const { record } = await req.json() as {
      record: {
        id: string;
        requester_id: string;
        addressee_id: string;
        status: string;
      };
    };

    // Only notify on new pending requests
    if (record.status !== "pending") {
      return new Response("skipped", { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [{ data: requester }, { data: addressee }, tokens] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", record.requester_id).single(),
      supabase.from("profiles").select("notif_friendz").eq("id", record.addressee_id).single(),
      getTokensForUser(supabase, record.addressee_id),
    ]);

    if (!addressee?.notif_friendz || tokens.length === 0) {
      return new Response("skipped", { status: 200 });
    }

    await sendExpoPush(tokens.map((token) => ({
      to: token,
      title: "Nueva solicitud de friendz 👥",
      body: `${requester?.full_name ?? "Alguien"} quiere conectar contigo.`,
      data: { screen: "friendz" },
      sound: "default",
      channelId: "messages",
    })));

    return new Response("ok", { status: 200 });
  } catch (err) {
    return new Response(String(err), { status: 500 });
  }
});
