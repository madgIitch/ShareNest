// supabase/functions/locations/index.ts
// Handles city and place lookups for Spain.
// GET /locations/cities?q=mad&limit=10&top=true
// GET /locations/cities/:id  → list of places within that city
// GET /locations/places/:id
// POST /locations/cities/track
// POST /locations/places/track
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, handleCORS } from "../_shared/cors.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req: Request) => {
  const corsRes = handleCORS(req);
  if (corsRes) return corsRes;

  const url = new URL(req.url);
  // Strip any prefix up to and including "locations" to handle both
  // /functions/v1/locations/cities and /locations/cities path formats
  const relativePath = url.pathname.replace(/^.*\/locations\/?/, "");
  const segments = relativePath.split("/").filter(Boolean);
  // segments: [] | ["cities"] | ["cities", id] | ["cities","track"] | ["places", id] | ["places","track"]

  try {
    // POST /locations/cities/track
    if (req.method === "POST" && segments[0] === "cities" && segments[1] === "track") {
      const { city_id } = await req.json() as { city_id: string };
      if (city_id) await supabaseAdmin.rpc("increment_city_count", { p_city_id: city_id });
      return json({ ok: true });
    }

    // POST /locations/places/track
    if (req.method === "POST" && segments[0] === "places" && segments[1] === "track") {
      const { place_ids } = await req.json() as { place_ids: string[] };
      // no-op for now — can add place analytics later
      return json({ ok: true, tracked: place_ids?.length ?? 0 });
    }

    // GET /locations/cities/:id — places within city
    if (req.method === "GET" && segments[0] === "cities" && segments[1]) {
      const cityId = segments[1];
      const q = url.searchParams.get("q") ?? "";
      const place = url.searchParams.get("place") ?? "";
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10), 200);

      let query = supabaseAdmin
        .from("city_places")
        .select("id, name, place, centroid, bbox, population")
        .eq("city_id", cityId)
        .order("name")
        .limit(limit);

      if (q) query = query.ilike("name", `%${q}%`);
      if (place) query = query.eq("place", place);

      const { data, error } = await query;
      if (error) throw error;
      return json({ places: data ?? [] });
    }

    // GET /locations/places/:id
    if (req.method === "GET" && segments[0] === "places" && segments[1]) {
      const { data, error } = await supabaseAdmin
        .from("city_places")
        .select("*, cities(name)")
        .eq("id", segments[1])
        .single();
      if (error) return json({ error: "Not found" }, 404);
      return json({ place: { ...data, city_name: (data.cities as { name: string })?.name } });
    }

    // GET /locations/cities
    if (req.method === "GET" && segments[0] === "cities") {
      const q = url.searchParams.get("q") ?? "";
      const top = url.searchParams.get("top") === "true";
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 200);

      if (top && !q) {
        const { data, error } = await supabaseAdmin
          .from("cities_with_counts")
          .select("id, name, centroid, bbox, search_count")
          .order("search_count", { ascending: false })
          .limit(limit);
        if (error) throw error;
        return json({ cities: data ?? [] });
      }

      let query = supabaseAdmin
        .from("cities")
        .select("id, name, centroid, bbox")
        .order("name")
        .limit(limit);

      if (q) query = query.ilike("name", `%${q}%`);

      const { data, error } = await query;
      if (error) throw error;
      return json({ cities: data ?? [] });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    console.error("[locations]", err);
    return json({ error: String(err) }, 500);
  }
});
