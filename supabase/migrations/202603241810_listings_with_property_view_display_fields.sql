-- ============================================================
-- ShareNest - listings_with_property display/canonical fields
-- 2026-03-24
-- ============================================================
-- Keep frontend read paths independent from deprecated listings location columns.

DROP VIEW IF EXISTS public.listings_with_property;

CREATE VIEW public.listings_with_property AS
SELECT
  -- listing identity/state
  l.id,
  l.owner_id,
  l.type,
  l.title,
  l.description,
  l.price,
  l.size_m2,
  l.rooms,
  l.available_from,
  l.is_furnished,
  l.pets_allowed,
  l.smokers_allowed,
  l.status,
  l.images,
  l.created_at,
  l.updated_at,
  l.search_vector,
  l.min_stay_months,
  l.contract_type,
  l.bed_type,
  l.has_private_bath,
  l.has_wardrobe,
  l.has_desk,

  -- canonical location (property first, legacy listing fallback)
  COALESCE(c.name, l.city, 'Ciudad') AS city,
  COALESCE(cp.name, l.district) AS district,
  COALESCE(p.city_id, l.city_id) AS city_id,
  COALESCE(p.place_id, l.place_id) AS place_id,
  COALESCE(p.address, l.street) AS street,
  COALESCE(p.street_number, l.street_number) AS street_number,
  COALESCE(p.postal_code, l.postal_code) AS postal_code,
  COALESCE(p.lat, l.lat) AS lat,
  COALESCE(p.lng, l.lng) AS lng,

  -- property projection (for property-level UIs)
  p.id AS property_id,
  p.name AS property_name,
  p.address AS property_address,
  p.street_number AS property_street_number,
  p.floor AS property_floor,
  p.postal_code AS property_postal_code,
  p.city_id AS property_city_id,
  p.place_id AS property_place_id,
  p.lat AS property_lat,
  p.lng AS property_lng,
  p.has_elevator AS property_has_elevator,
  p.total_m2 AS property_total_m2,
  p.total_rooms AS property_total_rooms,
  p.bills_config AS property_bills_config,
  p.house_rules AS property_house_rules,
  p.images AS property_images,
  p.household_id AS property_household_id
FROM public.listings l
JOIN public.properties p ON p.id = l.property_id
LEFT JOIN public.cities c ON c.id = p.city_id
LEFT JOIN public.city_places cp ON cp.id = p.place_id;

GRANT SELECT ON public.listings_with_property TO authenticated, anon;
