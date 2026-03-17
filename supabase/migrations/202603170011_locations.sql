-- ============================================================
-- Sprint 8b+ — Cities & Places (location data for Spain)
-- Data imported via scripts/import_locations.py
-- ============================================================

create table if not exists cities (
  id             text primary key,          -- e.g. "28079" (INE code)
  name           text not null,
  ref_ine        text,
  ine_municipio  text,
  wikidata       text,
  wikipedia      text,
  centroid       jsonb,                     -- { lon, lat }
  bbox           jsonb,                     -- { min_lon, min_lat, max_lon, max_lat }
  created_at     timestamptz not null default now()
);

create table if not exists city_places (
  id             text primary key,          -- e.g. "lavapies-suburb-12345"
  city_id        text not null references cities(id) on delete cascade,
  name           text not null,
  place          text,                      -- neighbourhood, suburb, quarter, borough
  admin_level    text,
  ref_ine        text,
  wikidata       text,
  wikipedia      text,
  population     text,
  population_date text,
  name_es        text,
  name_eu        text,
  centroid       jsonb,
  bbox           jsonb,
  created_at     timestamptz not null default now()
);

-- Search analytics
create table if not exists city_search_counts (
  city_id  text primary key references cities(id) on delete cascade,
  count    integer not null default 0
);

-- Enable trigram extension before creating indexes that use it
create extension if not exists pg_trgm;

-- Indexes for fast text search
create index if not exists cities_name_trgm
  on cities using gin (name gin_trgm_ops);

create index if not exists city_places_name_trgm
  on city_places using gin (name gin_trgm_ops);

create index if not exists city_places_city_id_idx
  on city_places (city_id);

-- ─── RLS (public read — location data is not sensitive) ──────────────────────

alter table cities             enable row level security;
alter table city_places        enable row level security;
alter table city_search_counts enable row level security;

create policy "public reads cities"
  on cities for select using (true);

create policy "public reads city_places"
  on city_places for select using (true);

create policy "public reads city_search_counts"
  on city_search_counts for select using (true);

create policy "service role manages cities"
  on cities for all using (auth.role() = 'service_role');

create policy "service role manages city_places"
  on city_places for all using (auth.role() = 'service_role');

create policy "service role manages city_search_counts"
  on city_search_counts for all using (auth.role() = 'service_role');

-- ─── View & RPCs ─────────────────────────────────────────────────────────────

create or replace view cities_with_counts as
  select c.*, coalesce(s.count, 0) as search_count
  from cities c
  left join city_search_counts s on s.city_id = c.id;

create or replace function increment_city_count(p_city_id text)
returns void language plpgsql security definer as $$
begin
  insert into city_search_counts (city_id, count)
  values (p_city_id, 1)
  on conflict (city_id) do update
    set count = city_search_counts.count + 1;
end;
$$;
