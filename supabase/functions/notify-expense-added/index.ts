// supabase/functions/notify-expense-added/index.ts
// Triggered by Supabase Webhook on expenses INSERT.
// Notifies all household members (except the one who added the expense).
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { sendExpoPush, getTokensForUser } from "../_shared/expoPush.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const CATEGORY_ICONS: Record<string, string> = {
  luz: "💡", agua: "💧", gas: "🔥", internet: "📶",
  comida: "🛒", limpieza: "🧹", otros: "🧾",
};

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const expense = payload.record as {
      id: string;
      household_id: string;
      paid_by: string;
      amount: number;
      category: string;
      description: string | null;
    };

    if (!expense?.id) return new Response("ok", { status: 200 });

    // Get the payer's name + all member splits for this expense
    const [{ data: payer }, { data: members }, { data: splits }] = await Promise.all([
      supabaseAdmin.from("profiles").select("full_name").eq("id", expense.paid_by).single(),
      supabaseAdmin
        .from("household_members")
        .select("user_id")
        .eq("household_id", expense.household_id),
      supabaseAdmin
        .from("expense_splits")
        .select("user_id, amount")
        .eq("expense_id", expense.id),
    ]);

    const payerName = payer?.full_name ?? "Alguien";
    const icon = CATEGORY_ICONS[expense.category] ?? "🧾";
    const amountFmt = `€${Number(expense.amount).toFixed(2)}`;

    const recipients = (members ?? []).filter((m) => m.user_id !== expense.paid_by);

    const messages = await Promise.all(
      recipients.map(async (m) => {
        const tokens = await getTokensForUser(supabaseAdmin, m.user_id);
        const split = splits?.find((s) => s.user_id === m.user_id);
        const shareStr = split ? ` · te corresponden €${Number(split.amount).toFixed(2)}` : "";
        const body = `${payerName} añadió ${icon} ${expense.category} · ${amountFmt}${shareStr}`;

        return tokens.map((token) => ({
          to: token,
          title: "Nuevo gasto",
          body,
          data: { screen: "household", id: expense.household_id },
        }));
      }),
    );

    await sendExpoPush(messages.flat());
    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("[notify-expense-added]", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
