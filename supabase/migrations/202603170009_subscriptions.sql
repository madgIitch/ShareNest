-- Subscriptions table (managed by Stripe webhooks → stripe-webhook Edge Function)
create type subscription_tier as enum ('free', 'superfriendz');
create type subscription_status as enum ('active', 'expired', 'cancelled');

-- Add Stripe customer ID to profiles
alter table profiles add column if not exists stripe_customer_id text unique;

create table if not exists subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  tier         subscription_tier not null default 'superfriendz',
  status       subscription_status not null default 'active',
  product_id   text,                    -- Stripe price ID
  expires_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, tier)
);

alter table subscriptions enable row level security;

-- Owner can read their own subscription
create policy "owner reads subscriptions"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Service role (webhook) can do everything
create policy "service role manages subscriptions"
  on subscriptions for all
  using (auth.role() = 'service_role');

-- Helper: is the user currently a Superfriendz subscriber?
create or replace function is_superfriendz(p_user_id uuid)
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1
    from subscriptions
    where user_id = p_user_id
      and tier = 'superfriendz'
      and status = 'active'
      and (expires_at is null or expires_at > now())
  );
$$;

-- Auto-update updated_at
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger subscriptions_touch_updated_at
  before update on subscriptions
  for each row execute procedure touch_updated_at();
