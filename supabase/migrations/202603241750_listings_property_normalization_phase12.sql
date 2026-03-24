-- ============================================================
-- ShareNest - Listings/Properties normalization (phase 1 + 2)
-- 2026-03-24
-- ============================================================
-- Goal:
-- 1) Backfill property_id for orphan listings
-- 2) Enforce listings.property_id NOT NULL
-- 3) Introduce listings_with_property view for read paths
-- 4) Move search logic to property location fields (with legacy fallback)

-- ---------- Phase 1: Backfill property_id for orphan listings ----------

DO $$
DECLARE
  v_listing public.listings%ROWTYPE;
  v_property_id uuid;
BEGIN
  FOR v_listing IN
    SELECT *
    FROM public.listings
    WHERE property_id IS NULL
    ORDER BY created_at ASC
    FOR UPDATE
  LOOP
    INSERT INTO public.properties (
      owner_id,
      address,
      street_number,
      city_id,
      place_id,
      lat,
      lng,
      postal_code,
      floor,
      has_elevator,
      total_m2,
      total_rooms,
      images,
      bills_config,
      house_rules
    )
    VALUES (
      v_listing.owner_id,
      COALESCE(NULLIF(v_listing.street, ''), NULLIF(v_listing.city, ''), 'Direccion sin definir'),
      v_listing.street_number,
      v_listing.city_id,
      v_listing.place_id,
      v_listing.lat,
      v_listing.lng,
      v_listing.postal_code,
      NULL,
      false,
      NULL,
      NULL,
      '[]'::jsonb,
      '{}'::jsonb,
      NULL
    )
    RETURNING id INTO v_property_id;

    UPDATE public.listings
    SET property_id = v_property_id
    WHERE id = v_listing.id;
  END LOOP;
END
$$;

-- Backfill missing property location from listing location for linked rows.
UPDATE public.properties p
SET
  address = COALESCE(NULLIF(p.address, ''), NULLIF(l.street, ''), NULLIF(l.city, ''), p.address),
  street_number = COALESCE(p.street_number, l.street_number),
  city_id = COALESCE(p.city_id, l.city_id),
  place_id = COALESCE(p.place_id, l.place_id),
  lat = COALESCE(p.lat, l.lat),
  lng = COALESCE(p.lng, l.lng),
  postal_code = COALESCE(p.postal_code, l.postal_code)
FROM public.listings l
WHERE l.property_id = p.id
  AND (
    p.city_id IS NULL
    OR p.place_id IS NULL
    OR p.postal_code IS NULL
    OR p.lat IS NULL
    OR p.lng IS NULL
  );

-- Optional compatibility backfill in opposite direction (legacy readers).
UPDATE public.listings l
SET
  city_id = COALESCE(l.city_id, p.city_id),
  place_id = COALESCE(l.place_id, p.place_id),
  street = COALESCE(l.street, p.address),
  street_number = COALESCE(l.street_number, p.street_number),
  postal_code = COALESCE(l.postal_code, p.postal_code),
  lat = COALESCE(l.lat, p.lat),
  lng = COALESCE(l.lng, p.lng)
FROM public.properties p
WHERE l.property_id = p.id;

-- ---------- Phase 2: Enforce property_id and property metadata ----------

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS name text;

UPDATE public.properties
SET name = COALESCE(NULLIF(name, ''), NULLIF(address, ''), 'Piso sin nombre')
WHERE name IS NULL OR name = '';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.listings WHERE property_id IS NULL) THEN
    RAISE EXCEPTION 'Cannot enforce NOT NULL on listings.property_id: orphan listings still exist';
  END IF;
END
$$;

ALTER TABLE public.listings
  ALTER COLUMN property_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS listings_property_id_idx ON public.listings (property_id);

-- ---------- Search support on properties ----------

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'spanish',
      COALESCE(address, '') || ' ' || COALESCE(postal_code, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS properties_search_idx
  ON public.properties USING gin (search_vector);

-- ---------- Read model view ----------

CREATE OR REPLACE VIEW public.listings_with_property AS
SELECT
  l.id,
  l.owner_id,
  l.title,
  l.description,
  l.price,
  l.size_m2,
  l.bed_type,
  l.has_private_bath,
  l.has_wardrobe,
  l.has_desk,
  l.is_furnished,
  l.available_from,
  l.min_stay_months,
  l.contract_type,
  l.status,
  l.images AS room_images,
  l.created_at,
  l.updated_at,
  p.id AS property_id,
  p.name AS property_name,
  p.address,
  p.street_number,
  p.floor,
  p.postal_code,
  p.city_id,
  p.place_id,
  p.lat,
  p.lng,
  p.has_elevator,
  p.total_m2,
  p.total_rooms,
  p.bills_config,
  p.house_rules,
  p.images AS property_images,
  p.household_id
FROM public.listings l
JOIN public.properties p ON p.id = l.property_id;

GRANT SELECT ON public.listings_with_property TO authenticated, anon;

-- ---------- Keep RPC contract, switch internals to properties ----------

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
RETURNS SETOF public.listings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.*
  FROM public.listings l
  JOIN public.properties p ON p.id = l.property_id
  LEFT JOIN public.cities c ON c.id = p.city_id
  LEFT JOIN public.city_places cp ON cp.id = p.place_id
  WHERE l.status = 'active'
    AND (
      p_query IS NULL
      OR l.search_vector @@ plainto_tsquery('spanish', p_query)
      OR p.search_vector @@ plainto_tsquery('spanish', p_query)
      OR lower(COALESCE(cp.name, '')) LIKE '%' || lower(p_query) || '%'
      OR lower(COALESCE(c.name, '')) LIKE '%' || lower(p_query) || '%'
    )
    AND (
      p_city IS NULL
      OR lower(COALESCE(c.name, l.city, '')) = lower(p_city)
    )
    AND (p_type IS NULL OR l.type = p_type)
    AND (p_price_min IS NULL OR l.price >= p_price_min)
    AND (p_price_max IS NULL OR l.price <= p_price_max)
    AND (p_size_min IS NULL OR l.size_m2 >= p_size_min)
    AND (p_pets IS NULL OR l.pets_allowed = p_pets)
    AND (p_smokers IS NULL OR l.smokers_allowed = p_smokers)
    AND (
      p_available_from IS NULL
      OR l.available_from IS NULL
      OR l.available_from <= p_available_from::date
    )
    AND (
      p_lat IS NULL OR p_lng IS NULL
      OR (
        COALESCE(p.lat, l.lat) IS NOT NULL
        AND COALESCE(p.lng, l.lng) IS NOT NULL
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(COALESCE(p.lng, l.lng), COALESCE(p.lat, l.lat)), 4326)::geography,
          ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
          p_radius_km * 1000
        )
      )
    )
    AND (p_cursor IS NULL OR l.created_at < p_cursor)
  ORDER BY l.created_at DESC
  LIMIT p_limit + 1;
$$;

GRANT EXECUTE ON FUNCTION public.search_listings TO authenticated, anon;

-- NOTE:
-- Step 3 (drop duplicated columns from listings) is intentionally NOT executed
-- in this migration. It must be applied only after frontend/backend readers are
-- fully moved to properties/listings_with_property.
