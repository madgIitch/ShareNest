-- ============================================================
-- ShareNest - search_listings returns listings_with_property
-- 2026-03-24
-- ============================================================

DROP FUNCTION IF EXISTS public.search_listings(
  text,
  text,
  listing_type,
  integer,
  integer,
  integer,
  boolean,
  boolean,
  text,
  double precision,
  double precision,
  double precision,
  timestamptz,
  integer
);

CREATE OR REPLACE FUNCTION public.search_listings(
  p_query          text             DEFAULT NULL,
  p_city           text             DEFAULT NULL,
  p_type           listing_type     DEFAULT NULL,
  p_price_min      integer          DEFAULT NULL,
  p_price_max      integer          DEFAULT NULL,
  p_size_min       integer          DEFAULT NULL,
  p_pets           boolean          DEFAULT NULL,
  p_smokers        boolean          DEFAULT NULL,
  p_available_from text             DEFAULT NULL,
  p_lat            double precision DEFAULT NULL,
  p_lng            double precision DEFAULT NULL,
  p_radius_km      double precision DEFAULT 50,
  p_cursor         timestamptz      DEFAULT NULL,
  p_limit          integer          DEFAULT 20
)
RETURNS SETOF public.listings_with_property
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.*
  FROM public.listings_with_property v
  WHERE v.status = 'active'
    AND (
      p_query IS NULL
      OR v.search_vector @@ plainto_tsquery('spanish', p_query)
      OR to_tsvector(
        'spanish',
        COALESCE(v.property_address, '') || ' ' || COALESCE(v.property_postal_code, '')
      ) @@ plainto_tsquery('spanish', p_query)
      OR lower(COALESCE(v.district, '')) LIKE '%' || lower(p_query) || '%'
      OR lower(COALESCE(v.city, '')) LIKE '%' || lower(p_query) || '%'
    )
    AND (p_city IS NULL OR lower(COALESCE(v.city, '')) = lower(p_city))
    AND (p_type IS NULL OR v.type = p_type)
    AND (p_price_min IS NULL OR v.price >= p_price_min)
    AND (p_price_max IS NULL OR v.price <= p_price_max)
    AND (p_size_min IS NULL OR v.size_m2 >= p_size_min)
    AND (p_pets IS NULL OR v.pets_allowed = p_pets)
    AND (p_smokers IS NULL OR v.smokers_allowed = p_smokers)
    AND (
      p_available_from IS NULL
      OR v.available_from IS NULL
      OR v.available_from <= p_available_from::date
    )
    AND (
      p_lat IS NULL OR p_lng IS NULL
      OR (
        v.lat IS NOT NULL
        AND v.lng IS NOT NULL
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(v.lng, v.lat), 4326)::geography,
          ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
          COALESCE(p_radius_km, 50) * 1000
        )
      )
    )
    AND (p_cursor IS NULL OR v.created_at < p_cursor)
  ORDER BY v.created_at DESC
  LIMIT COALESCE(p_limit, 20) + 1;
$$;

GRANT EXECUTE ON FUNCTION public.search_listings TO authenticated, anon;
