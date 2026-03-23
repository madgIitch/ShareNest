-- ============================================================
-- ShareNest — Migration: properties table + profiles upgrade
-- 2026-03-23
-- ============================================================

-- ── 1. Nueva tabla: properties ───────────────────────────────────────────────
-- Desacopla el piso físico de los listings individuales de habitaciones.
-- Un propietario con 3 habitaciones tiene 1 property y 3 listings.

CREATE TABLE IF NOT EXISTS public.properties (
  id             uuid         NOT NULL DEFAULT gen_random_uuid(),
  owner_id       uuid         NOT NULL REFERENCES public.profiles(id),
  address        text         NOT NULL,
  street_number  text,
  city_id        text         REFERENCES public.cities(id),
  place_id       text         REFERENCES public.city_places(id),
  lat            double precision,
  lng            double precision,
  postal_code    text,
  floor          text,
  has_elevator   boolean      NOT NULL DEFAULT false,
  total_m2       numeric,
  total_rooms    smallint,
  images         jsonb        NOT NULL DEFAULT '[]',
  bills_config   jsonb        NOT NULL DEFAULT '{}',
  -- bills_config example:
  -- { "agua": true, "luz": true, "gas": false, "internet": true,
  --   "limpieza": false, "comunidad": true, "calefaccion": false }
  house_rules    text[],
  household_id   uuid         REFERENCES public.households(id),
  created_at     timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT properties_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS properties_owner_idx ON public.properties (owner_id);
CREATE INDEX IF NOT EXISTS properties_city_idx  ON public.properties (city_id);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Owners can read/write their own properties
CREATE POLICY "owners can manage their properties"
  ON public.properties
  FOR ALL
  USING (owner_id = auth.uid());

-- Anyone authenticated can read properties (for listing context)
CREATE POLICY "authenticated users can read properties"
  ON public.properties
  FOR SELECT
  TO authenticated
  USING (true);


-- ── 2. Modificaciones en listings ────────────────────────────────────────────

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS property_id    uuid REFERENCES public.properties(id),
  ADD COLUMN IF NOT EXISTS min_stay_months smallint,
  ADD COLUMN IF NOT EXISTS contract_type  text DEFAULT 'long_term',
  -- contract_type: 'long_term' | 'temporary' | 'flexible'
  ADD COLUMN IF NOT EXISTS bed_type       text,
  -- bed_type: 'single' | 'double' | 'bunk'
  ADD COLUMN IF NOT EXISTS has_private_bath boolean,
  ADD COLUMN IF NOT EXISTS has_wardrobe   boolean,
  ADD COLUMN IF NOT EXISTS has_desk       boolean;

-- listings.status can be enum (listing_status) or text depending on environment.
-- If enum exists, add value safely. If text, keep/refresh check constraint.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    WHERE t.typname = 'listing_status'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'listing_status'
        AND e.enumlabel = 'draft'
    ) THEN
      ALTER TYPE public.listing_status ADD VALUE 'draft';
    END IF;
  ELSE
    ALTER TABLE public.listings
      DROP CONSTRAINT IF EXISTS listings_status_check;

    ALTER TABLE public.listings
      ADD CONSTRAINT listings_status_check
        CHECK (status IN ('active', 'paused', 'rented', 'draft'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS listings_property_idx ON public.listings (property_id);


-- ── 3. Modificaciones en requests ────────────────────────────────────────────

ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS presentation_message text,
  ADD COLUMN IF NOT EXISTS is_boosted           boolean NOT NULL DEFAULT false;

-- requests.status can be enum (request_status) or text depending on environment.
-- If enum exists, add value safely. If text, keep/refresh check constraint.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    WHERE t.typname = 'request_status'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'request_status'
        AND e.enumlabel = 'invited'
    ) THEN
      ALTER TYPE public.request_status ADD VALUE 'invited';
    END IF;
  ELSE
    ALTER TABLE public.requests
      DROP CONSTRAINT IF EXISTS requests_status_check;

    ALTER TABLE public.requests
      ADD CONSTRAINT requests_status_check
        CHECK (status IN ('pending', 'accepted', 'denied', 'invited'));
  END IF;
END
$$;


-- ── 4. Modificaciones en profiles ────────────────────────────────────────────
-- Campos de estilo de vida y preferencias de búsqueda

ALTER TABLE public.profiles
  -- Identidad
  ADD COLUMN IF NOT EXISTS birth_year       smallint,
  ADD COLUMN IF NOT EXISTS occupation       text,
  ADD COLUMN IF NOT EXISTS languages        text[],
  ADD COLUMN IF NOT EXISTS photos           text[],

  -- Estilo de vida
  ADD COLUMN IF NOT EXISTS schedule         text,
  -- 'madrugador' | 'nocturno' | 'flexible'
  ADD COLUMN IF NOT EXISTS cleanliness      smallint CHECK (cleanliness BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS noise_level      smallint CHECK (noise_level BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS has_pets         boolean,
  ADD COLUMN IF NOT EXISTS smokes           boolean,
  ADD COLUMN IF NOT EXISTS works_from_home  boolean,
  ADD COLUMN IF NOT EXISTS guests_frequency text,
  -- 'nunca' | 'a veces' | 'frecuente'

  -- Preferencias de búsqueda
  ADD COLUMN IF NOT EXISTS looking_for      text,
  -- 'room' | 'flat' | 'both'
  ADD COLUMN IF NOT EXISTS budget_min       numeric,
  ADD COLUMN IF NOT EXISTS budget_max       numeric,
  ADD COLUMN IF NOT EXISTS move_in_date     date,
  ADD COLUMN IF NOT EXISTS preferred_cities text[],
  ADD COLUMN IF NOT EXISTS flatmate_prefs   jsonb;


-- ── 5. Vista: active_requests_count ──────────────────────────────────────────
-- Usada para aplicar el límite de 3 solicitudes activas del plan free.

CREATE OR REPLACE VIEW public.active_requests_count AS
  SELECT
    requester_id,
    COUNT(*) AS active_count
  FROM public.requests
  WHERE status::text IN ('pending', 'invited')
  GROUP BY requester_id;


-- ── 6. Households: mover household_id a properties ───────────────────────────
-- El household_id pasa de listings a properties.
-- Mantenemos la columna en listings por compatibilidad hasta la siguiente release.
-- La columna ya existe en properties (añadida arriba).


-- ── 7. Deprecation notes ─────────────────────────────────────────────────────
-- Los siguientes campos de listings pasan a vivir en properties.
-- Se mantienen en listings temporalmente. Deprecar tras migrar datos existentes:
--   city, district, city_id, place_id, lat, lng, rooms (→ total_rooms en properties)
-- El campo rooms en listings pasará a significar "compañeros actuales",
-- no "número de habitaciones del piso".

COMMENT ON COLUMN public.listings.city
  IS 'DEPRECATED: migrar a properties.city_id. Mantenido por compatibilidad.';
COMMENT ON COLUMN public.listings.rooms
  IS 'Número de compañeros actuales (no habitaciones totales del piso).';
COMMENT ON COLUMN public.listings.size_m2
  IS 'Metros cuadrados de esta habitación específica.';
