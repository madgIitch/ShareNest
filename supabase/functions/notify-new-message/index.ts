import { createClient } from "jsr:@supabase/supabase-js@2";

// ─── FCM HTTP v1 helpers ───────────────────────────────────────────────────────

const FCM_PROJECT_ID = Deno.env.get("FCM_PROJECT_ID")!;
const FCM_URL = `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`;

/**
 * Build a signed JWT for the FCM service account and exchange it for a
 * short-lived OAuth2 access token (scope: firebase.messaging).
 *
 * Service account JSON is stored in the GOOGLE_SERVICE_ACCOUNT_JSON secret.
 */
async function getFcmAccessToken(): Promise<string> {
  const sa = JSON.parse(Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON")!);

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  const encode = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const unsignedJwt = `${encode(header)}.${encode(payload)}`;

  // Import the service account private key (PKCS#8 PEM)
  const pemBody = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const keyBytes = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBytes.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedJwt),
  );

  const signedJwt = `${unsignedJwt}.${
    btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
  }`;

  // Exchange JWT for OAuth2 access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedJwt,
    }),
  });
  const tokenData = await tokenRes.json();
  return tokenData.access_token as string;
}

// ─── Edge Function entry point ─────────────────────────────────────────────────

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

    // Get conversation participants
    const { data: conv } = await supabase
      .from("conversations")
      .select("participant_a, participant_b, listing:listings(title)")
      .eq("id", record.conversation_id)
      .single();

    if (!conv) return new Response("conversation not found", { status: 404 });

    const recipientId =
      conv.participant_a === record.sender_id ? conv.participant_b : conv.participant_a;

    // Get recipient FCM token + sender name in parallel
    const [{ data: recipient }, { data: sender }] = await Promise.all([
      supabase.from("profiles").select("push_token").eq("id", recipientId).single(),
      supabase.from("profiles").select("full_name").eq("id", record.sender_id).single(),
    ]);

    if (!recipient?.push_token) {
      return new Response("no push token", { status: 200 });
    }

    const accessToken = await getFcmAccessToken();

    const bodyText = record.content.length > 100
      ? record.content.slice(0, 97) + "..."
      : record.content;

    const fcmRes = await fetch(FCM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token: recipient.push_token,
          notification: {
            title: sender?.full_name ?? "Nuevo mensaje",
            body: bodyText,
          },
          data: {
            conversationId: record.conversation_id,
          },
          android: {
            notification: {
              channel_id: "messages",
              sound: "default",
            },
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
              },
            },
          },
        },
      }),
    });

    const result = await fcmRes.json();
    return new Response(JSON.stringify(result), { status: fcmRes.ok ? 200 : 502 });
  } catch (err) {
    return new Response(String(err), { status: 500 });
  }
});
