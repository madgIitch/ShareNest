-- ============================================================
-- ShareNest - RPC to create household safely
-- 2026-03-24
-- ============================================================

create or replace function public.create_household(
  p_name text,
  p_listing_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_uid uuid;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'Household name is required';
  end if;

  insert into public.households (name, listing_id, created_by)
  values (btrim(p_name), p_listing_id, v_uid)
  returning id into v_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (v_household_id, v_uid, 'admin')
  on conflict (household_id, user_id) do nothing;

  return v_household_id;
end;
$$;

revoke all on function public.create_household(text, uuid) from public;
grant execute on function public.create_household(text, uuid) to authenticated, service_role;
