-- ============================================================
-- ShareNest - Hard fix for household_members RLS recursion
-- 2026-03-24
-- ============================================================

-- 1) Non-inlined helper functions (plpgsql + security definer)
create or replace function public.is_household_member(p_household_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = auth.uid()
  );
end;
$$;

create or replace function public.is_household_admin(p_household_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = auth.uid()
      and hm.role = 'admin'
  );
end;
$$;

revoke all on function public.is_household_member(uuid) from public;
revoke all on function public.is_household_admin(uuid) from public;
grant execute on function public.is_household_member(uuid) to authenticated, service_role;
grant execute on function public.is_household_admin(uuid) to authenticated, service_role;

-- 2) Drop every existing policy on household_members to avoid stale recursive ones
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'household_members'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.household_members', p.policyname);
  END LOOP;
END $$;

-- 3) Recreate recursion-safe household_members policies
create policy "household_members_select"
  on public.household_members
  for select
  using (
    user_id = auth.uid()
    or public.is_household_member(household_id)
  );

-- self-join (invite code flow) OR admin invites another user
create policy "household_members_insert"
  on public.household_members
  for insert
  with check (
    (
      auth.uid() = user_id
      and role = 'member'
    )
    or public.is_household_admin(household_id)
  );

create policy "household_members_update"
  on public.household_members
  for update
  using (
    user_id = auth.uid()
    or public.is_household_admin(household_id)
  )
  with check (
    user_id = auth.uid()
    or public.is_household_admin(household_id)
  );

create policy "household_members_delete"
  on public.household_members
  for delete
  using (
    user_id = auth.uid()
    or public.is_household_admin(household_id)
  );

-- 4) Keep households policies aligned with the same helpers
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'households'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.households', p.policyname);
  END LOOP;
END $$;

create policy "households_select"
  on public.households
  for select
  using (public.is_household_member(id));

create policy "households_insert"
  on public.households
  for insert
  with check (auth.uid() = created_by);

create policy "households_update"
  on public.households
  for update
  using (public.is_household_admin(id));

-- optional: owner/admin delete
create policy "households_delete"
  on public.households
  for delete
  using (public.is_household_admin(id));
