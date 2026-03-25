// supabase/functions/listing-share-image/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import React from "https://esm.sh/react@18.2.0";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.6/mod.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, handleCORS } from "../_shared/cors.ts";

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1800;
const PHOTO_GAP = 18;
const PHOTO_SIZE = 220;

const COLORS = {
  bg: "#f3f3f5",
  card: "#111827",
  surface: "#1f2937",
  lightText: "#f9fafb",
  mutedText: "#9ca3af",
  emerald: "#10b981",
  emeraldLight: "#d1fae5",
  emeraldDark: "#059669",
  border: "#374151",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function getSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.storage
    .from("listing-images")
    .createSignedUrl(path, 60 * 20);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

function normalizePhotoPaths(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const candidate = (item as { path?: unknown; url?: unknown }).path
          ?? (item as { path?: unknown; url?: unknown }).url;
        return typeof candidate === "string" ? candidate : null;
      }
      return null;
    })
    .filter((item): item is string => Boolean(item));
}

const h = React.createElement;

function infoRow(icon: string, label: string, detail: string | null) {
  return h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.surface,
        borderRadius: "44px",
        padding: "28px 36px",
        marginTop: "20px",
        gap: "16px",
      },
    },
    h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "16px", flex: 1 } },
      h("div", { style: { fontSize: "30px", width: "36px", textAlign: "center", flexShrink: 0 } }, icon),
      h("div", { style: { fontSize: "30px", fontWeight: 600, color: COLORS.lightText, lineHeight: "38px" } }, label),
    ),
    detail
      ? h("div", { style: { fontSize: "26px", color: COLORS.mutedText, textAlign: "right", flexShrink: 0 } }, detail)
      : null,
  );
}

function chip(text: string) {
  return h(
    "div",
    {
      style: {
        padding: "10px 24px",
        borderRadius: "999px",
        fontSize: "24px",
        fontWeight: 700,
        color: COLORS.card,
        border: `2px solid ${COLORS.card}`,
      },
    },
    text,
  );
}

function renderCard({
  title,
  city,
  district,
  price,
  type,
  rooms,
  sizeM2,
  availableFrom,
  photos,
}: {
  title: string;
  city: string;
  district: string | null;
  price: number;
  type: string;
  rooms: number | null;
  sizeM2: number | null;
  availableFrom: string | null;
  photos: Array<string | null>;
}) {
  const typeLabel = type === "offer" ? "OFREZCO" : "BUSCO";
  const locationLabel = district ? `${city} · ${district}` : city;
  const priceLabel = `€${price}/mes`;

  return h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.emeraldLight,
        padding: "80px 72px",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        fontFamily: "sans-serif",
      },
    },
    // Header row: chip + brand
    h(
      "div",
      { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
      chip(typeLabel),
      h("div", { style: { fontSize: "32px", fontWeight: 800, color: COLORS.card } }, "HomiMatch"),
    ),
    // Dark card
    h(
      "div",
      {
        style: {
          marginTop: "48px",
          backgroundColor: COLORS.card,
          borderRadius: "56px",
          padding: "48px",
          color: COLORS.lightText,
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          border: `2px solid ${COLORS.border}`,
          flex: 1,
        },
      },
      // 2×2 photo grid
      h(
        "div",
        { style: { display: "flex", flexWrap: "wrap", marginBottom: "28px" } },
        photos.map((photo, i) => {
          const isLeft = i % 2 === 0;
          const isTop = i < 2;
          const tileStyle = {
            width: `${PHOTO_SIZE}px`,
            height: `${PHOTO_SIZE}px`,
            borderRadius: "36px",
            marginRight: isLeft ? `${PHOTO_GAP}px` : "0",
            marginBottom: isTop ? `${PHOTO_GAP}px` : "0",
          };
          return photo
            ? h("img", {
                key: i,
                src: photo,
                style: { ...tileStyle, objectFit: "cover", border: `2px solid ${COLORS.border}` },
              })
            : h("div", {
                key: i,
                style: { ...tileStyle, backgroundColor: COLORS.surface },
              });
        }),
      ),
      // Title
      h("div", { style: { fontSize: "44px", fontWeight: 800, marginBottom: "12px", lineHeight: "1.2" } }, title),
      // Location
      h("div", { style: { fontSize: "28px", color: COLORS.mutedText, marginBottom: "8px" } }, `📍 ${locationLabel}`),
      // Info rows
      infoRow("💶", "Precio", priceLabel),
      rooms ? infoRow("🛏️", "Habitaciones", `${rooms} hab.`) : null,
      sizeM2 ? infoRow("📐", "Tamaño", `${sizeM2} m²`) : null,
      availableFrom ? infoRow("📅", "Disponible", availableFrom) : null,
      // Footer
      h(
        "div",
        {
          style: {
            marginTop: "auto",
            paddingTop: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          },
        },
        h("div", { style: { fontSize: "22px", color: COLORS.mutedText } }, "homimatch.com"),
        h(
          "div",
          {
            style: {
              backgroundColor: COLORS.emerald,
              borderRadius: "999px",
              padding: "12px 28px",
              fontSize: "22px",
              fontWeight: 700,
              color: "#fff",
            },
          },
          "Ver anuncio →",
        ),
      ),
    ),
  );
}

serve(async (req: Request) => {
  const corsRes = handleCORS(req);
  if (corsRes) return corsRes;

  try {
    if (req.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const listingId = url.searchParams.get("listing_id");

    if (!listingId) {
      return new Response(JSON.stringify({ error: "listing_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: listing, error } = await supabaseAdmin
      .from("listings_with_property")
      .select(
        "id, title, city, city_name, district, district_name, price, type, rooms, size_m2, available_from, room_photos, property_photos, images",
      )
      .eq("id", listingId)
      .single();

    if (error || !listing) {
      return new Response(JSON.stringify({ error: "Listing not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const roomImages = normalizePhotoPaths(listing.room_photos);
    const propertyImages = normalizePhotoPaths(listing.property_photos);
    const legacyImages = normalizePhotoPaths(listing.images);
    const preferredImages =
      roomImages.length > 0
        ? roomImages
        : propertyImages.length > 0
          ? propertyImages
          : legacyImages;

    // Build signed URLs for the first 4 photos
    const photoUrls = await Promise.all(
      preferredImages.slice(0, 4).map(async (path) => {
        // If already a full URL, use directly; otherwise sign from storage
        if (path.startsWith("http")) return path;
        return await getSignedUrl(path);
      }),
    );
    while (photoUrls.length < 4) photoUrls.push(null);

    const element = renderCard({
      title: listing.title,
      city: listing.city_name ?? listing.city ?? "",
      district: listing.district_name ?? listing.district ?? null,
      price: listing.price,
      type: listing.type,
      rooms: listing.rooms ?? null,
      sizeM2: listing.size_m2 ?? null,
      availableFrom: listing.available_from ?? null,
      photos: photoUrls,
    });

    return new ImageResponse(element, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      headers: { ...corsHeaders, "Cache-Control": "public, max-age=3600" },
    });
  } catch (err) {
    console.error("[listing-share-image] error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
