create table if not exists public.plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price_usd numeric not null,
  price_bdt numeric not null,
  storage_limit_gb integer not null,
  max_file_size_gb integer not null,
  features jsonb not null default '[]',
  is_active boolean default true,
  created_at timestamptz default now()
);

insert into public.plans (name, price_usd, price_bdt, storage_limit_gb, max_file_size_gb, features) values
  ('Free', 0, 0, 2, 1, '["2GB storage", "1GB max file size", "7 day expiry", "Basic support"]'),
  ('Pro', 5, 550, 100, 10, '["100GB storage", "10GB max file size", "30 day expiry", "Priority support", "No ads"]'),
  ('Business', 15, 1650, 1000, 50, '["1TB storage", "50GB max file size", "Never expires", "24/7 support", "Team accounts"]')
on conflict do nothing;

create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  plan_id uuid references public.plans(id),
  provider text not null check (provider in ('stripe', 'sslcommerz')),
  provider_ref text,
  amount numeric not null,
  currency text not null,
  status text default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  created_at timestamptz default now()
);

alter table public.users add column if not exists plan_id uuid references public.plans(id);
alter table public.users add column if not exists plan_expires_at timestamptz;

create index if not exists idx_payments_user_id on public.payments(user_id);

alter table public.payments enable row level security;
alter table public.plans enable row level security;

create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "Anyone can view active plans"
  on public.plans for select
  using (is_active = true);
