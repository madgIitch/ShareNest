create type listing_type as enum ('offer', 'search');
create type listing_status as enum ('active', 'paused', 'rented');

create table if not exists public.listings (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users (id) on delete cascade,
  type            listing_type not null default 'offer',
  title           text not null,
  description     text,
  city            text not null,
  district        text,
  price           numeric(10, 2) not null,
  size_m2         numeric(6, 1),
  rooms           smallint,
  available_from  date,
  is_furnished    boolean not null default false,
  pets_allowed    boolean not null default false,
  smokers_allowed boolean not null default false,
  lat             double precision,
  lng             double precision,
  status          listing_status not null default 'active',
  images          jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.listings enable row level security;

-- Cualquier usuario autenticado puede ver anuncios activos o los propios
create policy "listings_select"
on public.listings for select to authenticated
using (status = 'active' or owner_id = auth.uid());

-- Solo el owner puede insertar
create policy "listings_insert_own"
on public.listings for insert to authenticated
with check (owner_id = auth.uid());

-- Solo el owner puede actualizar
create policy "listings_update_own"
on public.listings for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- Solo el owner puede borrar
create policy "listings_delete_own"
on public.listings for delete to authenticated
using (owner_id = auth.uid());

-- Actualizar updated_at automáticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_updated_at
  before update on public.listings
  for each row execute procedure public.set_updated_at();

-- Índices útiles
create index listings_owner_idx on public.listings (owner_id);
create index listings_city_status_idx on public.listings (city, status);
create index listings_created_idx on public.listings (created_at desc);
