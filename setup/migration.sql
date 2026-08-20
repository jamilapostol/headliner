-- Artist Operator store schema.
-- RUN THIS ONCE in your Supabase project (jamilapostol account):
-- Dashboard -> SQL Editor -> paste this whole file -> Run.
-- It creates the three tables AND the private storage bucket.
-- All tables: RLS enabled, no policies => service-role access only.

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  tags text[] not null default '{}',
  source text,
  kit_synced boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  stripe_session_id text not null unique,
  slug text not null,
  product_type text not null default 'pack',      -- pack | bundle
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null default 'paid',            -- paid | refunded
  delivery_email_sent boolean not null default false,
  kit_tagged boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists orders_email_idx on public.orders (email);
create index if not exists orders_slug_idx on public.orders (slug);

create table if not exists public.webhook_log (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'stripe',
  event_type text not null,
  event_id text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create unique index if not exists webhook_log_event_id_idx
  on public.webhook_log (provider, event_id) where event_id is not null;

alter table public.subscribers enable row level security;
alter table public.orders enable row level security;
alter table public.webhook_log enable row level security;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger subscribers_touch before update on public.subscribers
  for each row execute function public.touch_updated_at();

-- private storage bucket for paid files
insert into storage.buckets (id, name, public)
values ('artist-operator-files', 'artist-operator-files', false)
on conflict (id) do nothing;
