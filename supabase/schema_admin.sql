-- Add role to users
alter table public.users add column if not exists role text default 'user' check (role in ('user', 'admin'));
alter table public.users add column if not exists is_banned boolean default false;

-- Abuse reports table
create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  link_id uuid references public.links(id) on delete cascade,
  reporter_email text,
  reason text not null,
  status text default 'pending' check (status in ('pending', 'reviewed', 'resolved')),
  created_at timestamptz default now()
);

-- Site settings table
create table if not exists public.settings (
  key text primary key,
  value text
);

insert into public.settings (key, value) values
  ('site_name', 'xbare.top'),
  ('max_links_per_user', '1000'),
  ('default_expiry', 'never')
on conflict (key) do nothing;

create index if not exists idx_reports_status on public.reports(status);

alter table public.reports enable row level security;
alter table public.settings enable row level security;

create policy "Admins can view all reports"
  on public.reports for select
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Anyone can insert reports"
  on public.reports for insert
  with check (true);
