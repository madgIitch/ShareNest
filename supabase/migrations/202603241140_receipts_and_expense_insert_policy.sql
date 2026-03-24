-- ============================================================
-- ShareNest - Receipts storage + expense payer flexibility
-- 2026-03-24
-- ============================================================

-- Private bucket for household receipts.
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Path format: receipts/{household_id}/{expense_id}.jpg
-- Any household member can upload/read receipts for that household.
drop policy if exists "receipts_member_insert" on storage.objects;
create policy "receipts_member_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
  and public.is_household_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "receipts_member_update" on storage.objects;
create policy "receipts_member_update"
on storage.objects for update to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
  and public.is_household_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "receipts_member_delete" on storage.objects;
create policy "receipts_member_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
  and public.is_household_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "receipts_member_select" on storage.objects;
create policy "receipts_member_select"
on storage.objects for select to authenticated
using (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
  and public.is_household_member(((storage.foldername(name))[1])::uuid)
);

-- Allow members to register who actually paid (not only themselves).
-- paid_by must still belong to the same household.
drop policy if exists "member inserts expense" on public.expenses;
create policy "member inserts expense"
  on public.expenses for insert
  with check (
    public.is_household_member(household_id)
    and exists (
      select 1
      from public.household_members hm
      where hm.household_id = expenses.household_id
        and hm.user_id = expenses.paid_by
    )
  );
