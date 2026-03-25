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

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

serve(async (req: Request) => {
  const corsRes = handleCORS(req);
  if (corsRes) return corsRes;

  const url = new URL(req.url);
  // Strip any prefix up to and including "locations" to handle both
  // /functions/v1/locations/cities and /locations/cities path formats
  const relativePath = url.pathname.replace(/^.*\/locations\/?/, "");
  const segments = relativePath.split("/").filter(Boolean);
  console.log("[locations] request", {
    method: req.method,
    path: url.pathname,
    relativePath,
    segments,
    search: url.search,
  });
  // segments: [] | ["cities"] | ["cities", id] | ["cities","track"] | ["places", id] | ["places","track"]

  try {
    // GET /locations/resolve-postal?city=...&district=...&street=...&lat=...&lon=...
    if (req.method === "GET" && segments[0] === "resolve-postal") {
      const city = (url.searchParams.get("city") ?? "").trim();
      const district = (url.searchParams.get("district") ?? "").trim();
      const street = (url.searchParams.get("street") ?? "").trim();
      const lat = Number(url.searchParams.get("lat"));
      const lon = Number(url.searchParams.get("lon"));

      let postal = "";
      let pickedAddress: Record<string, string> | null = null;

      const q = [street, district, city, "Espana"].filter(Boolean).join(", ");
      if (q) {
        const byTextUrl = new URL("https://nominatim.openstreetmap.org/search");
        byTextUrl.searchParams.set("format", "jsonv2");
        byTextUrl.searchParams.set("addressdetails", "1");
        byTextUrl.searchParams.set("countrycodes", "es");
        byTextUrl.searchParams.set("limit", "8");
        byTextUrl.searchParams.set("q", q);
        console.log("[locations] resolve-postal search", { q, url: byTextUrl.toString() });
        const searchRes = await fetch(byTextUrl.toString(), {
          headers: { "User-Agent": "ShareNest/1.0", "Accept-Language": "es" },
        });
        if (searchRes.ok) {
          const rows = await searchRes.json() as Array<{ address?: Record<string, string> }>;
          const first = rows[0];
          postal = first?.address?.postcode?.trim() ?? "";
          pickedAddress = first?.address ?? null;
        }
      }

      if (!postal && Number.isFinite(lat) && Number.isFinite(lon)) {
        const revUrl = new URL("https://nominatim.openstreetmap.org/reverse");
        revUrl.searchParams.set("format", "jsonv2");
        revUrl.searchParams.set("addressdetails", "1");
        revUrl.searchParams.set("lat", String(lat));
        revUrl.searchParams.set("lon", String(lon));
        console.log("[locations] resolve-postal reverse fallback", { lat, lon });
        const revRes = await fetch(revUrl.toString(), {
          headers: { "User-Agent": "ShareNest/1.0", "Accept-Language": "es" },
        });
        if (revRes.ok) {
          const row = await revRes.json() as { address?: Record<string, string> };
          postal = row?.address?.postcode?.trim() ?? "";
          pickedAddress = row?.address ?? pickedAddress;
        }
      }

      console.log("[locations] resolve-postal result", { city, district, street, postal });
      return json({ result: postal ? { postal_code: postal, raw: pickedAddress } : null });
    }

    // GET /locations/postal/:code?city_hint=Sevilla
    if (req.method === "GET" && segments[0] === "postal" && segments[1]) {
      const postal = segments[1].replace(/\D/g, "").slice(0, 5);
      const cityHint = (url.searchParams.get("city_hint") ?? "").trim();
      if (postal.length !== 5) return json({ error: "Invalid postal code" }, 400);

      const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
      nominatimUrl.searchParams.set("format", "jsonv2");
      nominatimUrl.searchParams.set("addressdetails", "1");
      nominatimUrl.searchParams.set("countrycodes", "es");
      nominatimUrl.searchParams.set("postalcode", postal);
      nominatimUrl.searchParams.set("limit", "12");
      if (cityHint) nominatimUrl.searchParams.set("city", cityHint);

      console.log("[locations] postal lookup", { postal, cityHint, url: nominatimUrl.toString() });
      const res = await fetch(nominatimUrl.toString(), {
        headers: {
          "User-Agent": "ShareNest/1.0",
          "Accept-Language": "es",
        },
      });
      if (!res.ok) {
        const body = await res.text();
        console.error("[locations] postal nominatim error", { status: res.status, body });
        return json({ error: "Postal lookup failed" }, 502);
      }

      const rows = await res.json() as Array<{
        lat: string;
        lon: string;
        address?: Record<string, string>;
        display_name?: string;
      }>;

      if (!rows.length) return json({ result: null });

      const hint = normalize(cityHint);
      const picked = cityHint
        ? rows.find((r) => normalize(r.address?.city ?? r.address?.town ?? r.address?.municipality ?? "").includes(hint))
          ?? rows[0]
        : rows[0];

      const city =
        picked.address?.city
        ?? picked.address?.town
        ?? picked.address?.municipality
        ?? picked.address?.village
        ?? "";
      const district =
        picked.address?.suburb
        ?? picked.address?.neighbourhood
        ?? picked.address?.city_district
        ?? picked.address?.quarter
        ?? "";

      const result = {
        postal_code: postal,
        city,
        district,
        lat: Number(picked.lat),
        lon: Number(picked.lon),
        raw: picked.address ?? null,
      };
      console.log("[locations] postal result", result);
      return json({ result });
    }

    // POST /locations/cities/track
    if (req.method === "POST" && segments[0] === "cities" && segments[1] === "track") {
      const { city_id } = await req.json() as { city_id: string };
      console.log("[locations] cities/track", { city_id });
      if (city_id) await supabaseAdmin.rpc("increment_city_count", { p_city_id: city_id });
      return json({ ok: true });
    }

    // POST /locations/places/track
    if (req.method === "POST" && segments[0] === "places" && segments[1] === "track") {
      const { place_ids } = await req.json() as { place_ids: string[] };
      console.log("[locations] places/track", { count: place_ids?.length ?? 0 });
      // no-op for now — can add place analytics later
      return json({ ok: true, tracked: place_ids?.length ?? 0 });
    }

    // GET /locations/cities/:id — places within city
    if (req.method === "GET" && segments[0] === "cities" && segments[1]) {
      const cityId = segments[1];
      const q = url.searchParams.get("q") ?? "";
      const place = url.searchParams.get("place") ?? "";
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10), 200);
      console.log("[locations] cities/:id query", { cityId, q, place, limit });

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
      console.log("[locations] cities/:id result", { cityId, count: data?.length ?? 0 });
      return json({ places: data ?? [] });
    }

    // GET /locations/places/:id
    if (req.method === "GET" && segments[0] === "places" && segments[1]) {
      console.log("[locations] places/:id query", { placeId: segments[1] });
      const { data, error } = await supabaseAdmin
        .from("city_places")
        .select("*, cities(name)")
        .eq("id", segments[1])
        .single();
      if (error) return json({ error: "Not found" }, 404);
      console.log("[locations] places/:id result", { placeId: segments[1], found: true });
      return json({ place: { ...data, city_name: (data.cities as { name: string })?.name } });
    }

    // GET /locations/cities
    if (req.method === "GET" && segments[0] === "cities") {
      const q = url.searchParams.get("q") ?? "";
      const top = url.searchParams.get("top") === "true";
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 200);
      console.log("[locations] cities query", { q, top, limit });

      if (top && !q) {
        const { data, error } = await supabaseAdmin
          .from("cities_with_counts")
          .select("id, name, centroid, bbox, search_count")
          .order("search_count", { ascending: false })
          .limit(limit);
        if (error) throw error;
        console.log("[locations] cities top result", { count: data?.length ?? 0 });
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
      console.log("[locations] cities result", { count: data?.length ?? 0 });
      return json({ cities: data ?? [] });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    console.error("[locations]", err);
    return json({ error: String(err) }, 500);
  }
});
