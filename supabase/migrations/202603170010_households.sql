-- ============================================================
-- Sprint 8b — Household expense management
-- ============================================================

-- Grupo de convivientes
create table if not exists households (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid references listings(id) on delete set null,
  name        text not null,
  created_by  uuid references profiles(id) on delete set null,
  invite_code char(6) unique not null
    default upper(substring(gen_random_uuid()::text, 1, 6)),
  created_at  timestamptz not null default now()
);

-- Miembros del hogar
create table if not exists household_members (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  role         text not null check (role in ('admin', 'member')) default 'member',
  joined_at    timestamptz not null default now(),
  unique (household_id, user_id)
);

-- Gastos
create table if not exists expenses (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  paid_by      uuid not null references profiles(id) on delete restrict,
  amount       numeric(10,2) not null check (amount > 0),
  category     text not null check (category in
    ('luz','agua','gas','internet','comida','limpieza','otros'))
    default 'otros',
  description  text,
  receipt_url  text,
  date         date not null default current_date,
  split_type   text not null check (split_type in ('equal','custom')) default 'equal',
  created_at   timestamptz not null default now()
);

-- Reparto por persona
create table if not exists expense_splits (
  id          uuid primary key default gen_random_uuid(),
  expense_id  uuid not null references expenses(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  amount      numeric(10,2) not null,
  is_settled  boolean not null default false,
  settled_at  timestamptz,
  unique (expense_id, user_id)
);

-- ─── RLS ───────────────────────────────────────────────────────────────────────

alter table households        enable row level security;
alter table household_members enable row level security;
alter table expenses          enable row level security;
alter table expense_splits    enable row level security;

-- Helper: is the current user a member of a given household?
create or replace function is_household_member(p_household_id uuid)
returns boolean
language sql stable security definer as $$
  select exists (
    select 1 from household_members
    where household_id = p_household_id and user_id = auth.uid()
  );
$$;

-- households: any member can read; created_by can update/delete
create policy "member reads household"
  on households for select using (is_household_member(id));

create policy "member creates household"
  on households for insert with check (auth.uid() = created_by);

create policy "admin updates household"
  on households for update using (
    exists (
      select 1 from household_members
      where household_id = id and user_id = auth.uid() and role = 'admin'
    )
  );

-- household_members: members can read; anyone can join (insert themselves)
create policy "member reads members"
  on household_members for select using (is_household_member(household_id));

create policy "user joins household"
  on household_members for insert with check (auth.uid() = user_id);

create policy "admin removes member"
  on household_members for delete using (
    user_id = auth.uid()
    or exists (
      select 1 from household_members hm2
      where hm2.household_id = household_id
        and hm2.user_id = auth.uid()
        and hm2.role = 'admin'
    )
  );

-- expenses: members read; members insert
create policy "member reads expenses"
  on expenses for select using (is_household_member(household_id));

create policy "member inserts expense"
  on expenses for insert with check (
    is_household_member(household_id) and auth.uid() = paid_by
  );

create policy "owner updates expense"
  on expenses for update using (paid_by = auth.uid());

create policy "owner deletes expense"
  on expenses for delete using (paid_by = auth.uid());

-- expense_splits: follow parent expense
create policy "member reads splits"
  on expense_splits for select using (
    exists (
      select 1 from expenses e
      where e.id = expense_id and is_household_member(e.household_id)
    )
  );

create policy "member inserts splits"
  on expense_splits for insert with check (
    exists (
      select 1 from expenses e
      where e.id = expense_id and is_household_member(e.household_id)
    )
  );

create policy "member settles own split"
  on expense_splits for update using (user_id = auth.uid());

-- ─── Views ─────────────────────────────────────────────────────────────────────

create or replace view household_balances as
select
  e.household_id,
  es.user_id,
  sum(case when e.paid_by = es.user_id then e.amount else 0 end) as paid_total,
  sum(es.amount) as owed_total,
  sum(case when e.paid_by = es.user_id then e.amount else 0 end) - sum(es.amount) as net_balance
from expense_splits es
join expenses e on e.id = es.expense_id
where es.is_settled = false
group by e.household_id, es.user_id;

-- ─── RPC: join household by invite code ────────────────────────────────────────

create or replace function join_household_by_code(p_code text)
returns uuid
language plpgsql security definer as $$
declare
  v_household_id uuid;
begin
  select id into v_household_id
  from households
  where upper(invite_code) = upper(p_code);

  if v_household_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into household_members (household_id, user_id, role)
  values (v_household_id, auth.uid(), 'member')
  on conflict (household_id, user_id) do nothing;

  return v_household_id;
end;
$$;

-- ─── RPC: my_household ─────────────────────────────────────────────────────────
-- Returns the first household the current user belongs to, null if none.

create or replace function my_household()
returns table (
  id uuid,
  name text,
  invite_code char(6),
  listing_id uuid,
  created_by uuid,
  created_at timestamptz,
  member_role text
)
language sql stable security definer as $$
  select h.id, h.name, h.invite_code, h.listing_id, h.created_by, h.created_at,
         hm.role as member_role
  from households h
  join household_members hm on hm.household_id = h.id
  where hm.user_id = auth.uid()
  order by hm.joined_at desc
  limit 1;
$$;
