-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz default now()
);

-- Links table
create table if not exists public.links (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  short_code text unique not null,
  original_url text not null,
  custom_alias text,
  expires_at timestamptz,
  password_hash text,
  clicks integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Clicks / analytics table
create table if not exists public.link_clicks (
  id uuid primary key default uuid_generate_v4(),
  link_id uuid references public.links(id) on delete cascade,
  ip_address text,
  user_agent text,
  referrer text,
  country text,
  clicked_at timestamptz default now()
);

-- Indexes
create index if not exists idx_links_short_code on public.links(short_code);
create index if not exists idx_links_user_id on public.links(user_id);
create index if not exists idx_clicks_link_id on public.link_clicks(link_id);

-- RLS
alter table public.links enable row level security;
alter table public.link_clicks enable row level security;

create policy "Users can view own links"
  on public.links for select
  using (auth.uid() = user_id or user_id is null);

create policy "Users can insert own links"
  on public.links for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can delete own links"
  on public.links for delete
  using (auth.uid() = user_id);
