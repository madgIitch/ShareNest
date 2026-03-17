-- ─── Sprint 5: Full-text search + geospatial ─────────────────────────────────

-- PostGIS (enabled by default on Supabase, this is a no-op if already present)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─── 1. Geo columns (already in database.ts types, add if not present) ────────
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision;

-- ─── 2. Full-text search vector (generated, always up-to-date) ────────────────
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'spanish',
      coalesce(title,       '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(city,        '') || ' ' ||
      coalesce(district,    '')
    )
  ) STORED;

-- ─── 3. GIN index for full-text search ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS listings_search_vector_idx
  ON listings USING GIN (search_vector);

-- ─── 4. GiST index for geospatial queries (PostGIS) ──────────────────────────
CREATE INDEX IF NOT EXISTS listings_location_idx
  ON listings USING GIST (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)
  )
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- ─── 5. RPC: combined search (text + filters + geo radius + cursor pagination) ─
CREATE OR REPLACE FUNCTION search_listings(
  p_query          text             DEFAULT NULL,
  p_city           text             DEFAULT NULL,
  p_type           listing_type     DEFAULT NULL,
  p_price_min      integer          DEFAULT NULL,
  p_price_max      integer          DEFAULT NULL,
  p_size_min       integer          DEFAULT NULL,
  p_pets           boolean          DEFAULT NULL,
  p_smokers        boolean          DEFAULT NULL,
  p_available_from text             DEFAULT NULL,  -- ISO date YYYY-MM-DD
  p_lat            double precision DEFAULT NULL,
  p_lng            double precision DEFAULT NULL,
  p_radius_km      double precision DEFAULT 50,
  p_cursor         timestamptz      DEFAULT NULL,
  p_limit          integer          DEFAULT 20
)
RETURNS SETOF listings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM listings
  WHERE status = 'active'
    -- full-text search
    AND (p_query IS NULL OR search_vector @@ plainto_tsquery('spanish', p_query))
    -- exact city match
    AND (p_city IS NULL OR lower(city) = lower(p_city))
    -- type filter
    AND (p_type IS NULL OR type = p_type)
    -- price range
    AND (p_price_min IS NULL OR price >= p_price_min)
    AND (p_price_max IS NULL OR price <= p_price_max)
    -- size filter
    AND (p_size_min IS NULL OR size_m2 >= p_size_min)
    -- preferences
    AND (p_pets    IS NULL OR pets_allowed     = p_pets)
    AND (p_smokers IS NULL OR smokers_allowed  = p_smokers)
    -- available from: listings with no date or date <= requested date are included
    AND (
      p_available_from IS NULL
      OR available_from IS NULL
      OR available_from <= p_available_from::date
    )
    -- geo radius (only applied when both lat/lng provided)
    AND (
      p_lat IS NULL OR p_lng IS NULL
      OR (lat IS NOT NULL AND lng IS NOT NULL
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
            p_radius_km * 1000
          ))
    )
    -- cursor (created_at DESC pagination)
    AND (p_cursor IS NULL OR created_at < p_cursor)
  ORDER BY created_at DESC
  LIMIT p_limit + 1;  -- return one extra row so client can detect hasNextPage
$$;

-- Grant execute to authenticated and anon users
GRANT EXECUTE ON FUNCTION search_listings TO authenticated, anon;
