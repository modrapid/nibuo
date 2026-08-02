create table if not exists public.files (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  short_code text unique not null,
  original_name text not null,
  stored_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  download_url text not null,
  expires_at timestamptz,
  password_hash text,
  views integer default 0,
  downloads integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_files_short_code on public.files(short_code);
create index if not exists idx_files_user_id on public.files(user_id);
create index if not exists idx_files_expires_at on public.files(expires_at);

alter table public.files enable row level security;

create policy "Users can view own files"
  on public.files for select
  using (auth.uid() = user_id or user_id is null);

create policy "Users can delete own files"
  on public.files for delete
  using (auth.uid() = user_id);
