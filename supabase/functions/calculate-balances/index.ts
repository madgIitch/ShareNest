// supabase/functions/calculate-balances/index.ts
// Returns the simplified debt graph for a household.
// GET /calculate-balances?household_id=<uuid>
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, handleCORS } from "../_shared/cors.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

type RawBalance = { user_id: string; net_balance: number };
type Transfer = { from: string; to: string; amount: number };

/** Greedy O(n) algorithm: minimum number of transactions to settle all debts */
function simplifyDebts(rows: RawBalance[]): Transfer[] {
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  for (const r of rows) {
    const bal = Number(r.net_balance);
    if (bal > 0.005) creditors.push({ id: r.user_id, amount: bal });
    else if (bal < -0.005) debtors.push({ id: r.user_id, amount: Math.abs(bal) });
  }

  const result: Transfer[] = [];
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const settle = Math.min(creditors[i].amount, debtors[j].amount);
    result.push({
      from: debtors[j].id,
      to: creditors[i].id,
      amount: Math.round(settle * 100) / 100,
    });
    creditors[i].amount -= settle;
    debtors[j].amount -= settle;
    if (creditors[i].amount < 0.005) i++;
    if (debtors[j].amount < 0.005) j++;
  }
  return result;
}

serve(async (req: Request) => {
  const corsRes = handleCORS(req);
  if (corsRes) return corsRes;

  try {
    // Auth
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const householdId = url.searchParams.get("household_id");
    if (!householdId) {
      return new Response(JSON.stringify({ error: "household_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify membership
    const { data: member } = await supabaseAdmin
      .from("household_members")
      .select("id")
      .eq("household_id", householdId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch net balances from view
    const { data: balances, error: balErr } = await supabaseAdmin
      .from("household_balances")
      .select("user_id, net_balance")
      .eq("household_id", householdId);

    if (balErr) throw balErr;

    const transfers = simplifyDebts(balances ?? []);

    // Fetch member profiles for display
    const memberIds = [...new Set([
      ...(balances ?? []).map((b: RawBalance) => b.user_id),
      ...transfers.flatMap((t) => [t.from, t.to]),
    ])];

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", memberIds);

    return new Response(
      JSON.stringify({
        balances: balances ?? [],
        transfers,
        profiles: profiles ?? [],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[calculate-balances]", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
