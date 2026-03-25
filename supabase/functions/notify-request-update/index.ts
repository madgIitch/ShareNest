import { createClient } from "jsr:@supabase/supabase-js@2";
import { getTokensForUser, sendExpoPush } from "../_shared/expoPush.ts";

// Triggered on requests UPDATE (status → accepted | denied)
Deno.serve(async (req) => {
  try {
    const { record, old_record } = await req.json() as {
      record: {
        id: string;
        listing_id: string;
        requester_id: string;
        owner_id: string;
        status: string;
      };
      old_record: { status: string };
    };

    // Only fire when status actually changes to accepted or denied
    if (
      record.status === old_record.status ||
      !["accepted", "denied"].includes(record.status)
    ) {
      return new Response("skipped", { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [{ data: listing }, { data: requester }, tokens] = await Promise.all([
      supabase.from("listings").select("title").eq("id", record.listing_id).single(),
      supabase.from("profiles").select("full_name, notif_requests").eq("id", record.requester_id).single(),
      getTokensForUser(supabase, record.requester_id),
    ]);

    if (!requester?.notif_requests || tokens.length === 0) {
      return new Response("skipped", { status: 200 });
    }

    const isAccepted = record.status === "accepted";
    const title = isAccepted ? "¡Solicitud aceptada! 🎉" : "Solicitud no aceptada";
    const body = isAccepted
      ? `Tu solicitud para "${listing?.title ?? "el anuncio"}" ha sido aceptada. Ya puedes chatear.`
      : `Tu solicitud para "${listing?.title ?? "el anuncio"}" no fue aceptada.`;

    await sendExpoPush(tokens.map((token) => ({
      to: token,
      title,
      body,
      data: { screen: "request", id: record.id },
      sound: "default",
      channelId: "messages",
    })));

    return new Response("ok", { status: 200 });
  } catch (err) {
    return new Response(String(err), { status: 500 });
  }
});
