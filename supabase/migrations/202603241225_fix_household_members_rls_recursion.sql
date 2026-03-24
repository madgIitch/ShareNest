-- ============================================================
-- ShareNest - Fix RLS recursion in household_members
-- 2026-03-24
-- ============================================================

-- Helper functions evaluated with definer rights to avoid recursive RLS checks
create or replace function public.is_household_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = auth.uid()
  );
$$;

create or replace function public.is_household_admin(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = auth.uid()
      and hm.role = 'admin'
  );
$$;

revoke all on function public.is_household_member(uuid) from public;
revoke all on function public.is_household_admin(uuid) from public;
grant execute on function public.is_household_member(uuid) to authenticated, service_role;
grant execute on function public.is_household_admin(uuid) to authenticated, service_role;

-- ------------------------------------------------------------------
-- households policies
-- ------------------------------------------------------------------
drop policy if exists "member reads household" on public.households;
drop policy if exists "member creates household" on public.households;
drop policy if exists "admin updates household" on public.households;

create policy "member reads household"
  on public.households
  for select
  using (public.is_household_member(id));

create policy "member creates household"
  on public.households
  for insert
  with check (auth.uid() = created_by);

create policy "admin updates household"
  on public.households
  for update
  using (public.is_household_admin(id));

-- ------------------------------------------------------------------
-- household_members policies (recursion-safe)
-- ------------------------------------------------------------------
drop policy if exists "member reads members" on public.household_members;
drop policy if exists "user joins household" on public.household_members;
drop policy if exists "admin removes member" on public.household_members;
drop policy if exists "member inserts members" on public.household_members;
drop policy if exists "member updates members" on public.household_members;

create policy "member reads members"
  on public.household_members
  for select
  using (public.is_household_member(household_id));

-- self-join by invite flow OR admin invites someone directly
create policy "member inserts members"
  on public.household_members
  for insert
  with check (
    (
      auth.uid() = user_id
      and role = 'member'
    )
    or (
      public.is_household_admin(household_id)
      and (
        role = 'member'
        or (role = 'admin' and public.is_household_admin(household_id))
      )
    )
  );

create policy "member updates members"
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

create policy "admin removes member"
  on public.household_members
  for delete
  using (
    user_id = auth.uid()
    or public.is_household_admin(household_id)
  );

-- ------------------------------------------------------------------
-- Keep dependent policies explicit with helper
-- ------------------------------------------------------------------
drop policy if exists "member reads expenses" on public.expenses;
create policy "member reads expenses"
  on public.expenses
  for select
  using (public.is_household_member(household_id));

-- keep current insert policy name; ensure it uses helper
-- (it may be replaced by a newer migration already)
drop policy if exists "member inserts expense" on public.expenses;
create policy "member inserts expense"
  on public.expenses
  for insert
  with check (
    public.is_household_member(household_id)
    and exists (
      select 1
      from public.household_members hm
      where hm.household_id = expenses.household_id
        and hm.user_id = expenses.paid_by
    )
  );
