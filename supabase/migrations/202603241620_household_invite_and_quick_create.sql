-- ============================================================
-- ShareNest - Household invite endpoint + quick create flow
-- 2026-03-24
-- ============================================================

-- Endpoint A: obtain invite code and basic household data.
-- Allowed for:
-- 1) household members
-- 2) household creator
-- 3) property owner of a property linked to this household
create or replace function public.get_household_invite(
  p_household_id uuid
)
returns table (
  household_id uuid,
  household_name text,
  invite_code text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_allowed boolean := false;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = v_uid
  )
  or exists (
    select 1
    from public.households h
    where h.id = p_household_id
      and h.created_by = v_uid
  )
  or exists (
    select 1
    from public.properties p
    where p.household_id = p_household_id
      and p.owner_id = v_uid
  )
  into v_allowed;

  if not v_allowed then
    raise exception 'Not allowed';
  end if;

  return query
  select h.id, h.name, h.invite_code::text
  from public.households h
  where h.id = p_household_id;
end;
$$;

revoke all on function public.get_household_invite(uuid) from public;
grant execute on function public.get_household_invite(uuid) to authenticated, service_role;

-- Endpoint B: quick household creation without listing (flow B).
-- Creates household + creator membership + property with address fields.
create or replace function public.create_household_quick(
  p_name text,
  p_address text,
  p_city_id text default null,
  p_place_id text default null,
  p_street_number text default null,
  p_postal_code text default null,
  p_floor text default null
)
returns table (
  household_id uuid,
  property_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_household_id uuid;
  v_property_id uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'Household name is required';
  end if;

  if p_address is null or btrim(p_address) = '' then
    raise exception 'Address is required';
  end if;

  insert into public.households (name, listing_id, created_by)
  values (btrim(p_name), null, v_uid)
  returning id into v_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (v_household_id, v_uid, 'admin')
  on conflict do nothing;

  insert into public.properties (
    owner_id,
    household_id,
    address,
    city_id,
    place_id,
    street_number,
    postal_code,
    floor
  )
  values (
    v_uid,
    v_household_id,
    btrim(p_address),
    p_city_id,
    p_place_id,
    p_street_number,
    p_postal_code,
    p_floor
  )
  returning id into v_property_id;

  return query select v_household_id, v_property_id;
end;
$$;

revoke all on function public.create_household_quick(text, text, text, text, text, text, text) from public;
grant execute on function public.create_household_quick(text, text, text, text, text, text, text) to authenticated, service_role;
