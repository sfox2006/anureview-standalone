create extension if not exists pgcrypto;

create table if not exists public.anreview_reviews (
  id text primary key,
  item_id text not null,
  item_type text not null check (item_type in ('course', 'academic')),
  author text not null,
  user_id uuid,
  user_email text not null default '',
  display_name text not null default '',
  username text not null default '',
  is_anu_verified boolean not null default false,
  is_guest boolean not null default true,
  created_at date not null,
  overall numeric(3,1) not null check (overall between 1 and 10),
  metric_a numeric(3,1) not null check (metric_a between 1 and 10),
  metric_b numeric(3,1) not null check (metric_b between 1 and 10),
  metric_c numeric(3,1) not null check (metric_c between 1 and 10),
  semester text not null default '',
  taken_year text not null default '',
  academic_id text not null default '',
  academic_name text not null default '',
  upvotes integer not null default 0,
  downvotes integer not null default 0,
  tags jsonb not null default '[]'::jsonb,
  comment text not null,
  inserted_at timestamptz not null default timezone('utc', now())
);

alter table public.anreview_reviews add column if not exists upvotes integer not null default 0;
alter table public.anreview_reviews add column if not exists downvotes integer not null default 0;
alter table public.anreview_reviews add column if not exists semester text not null default '';
alter table public.anreview_reviews add column if not exists taken_year text not null default '';
alter table public.anreview_reviews add column if not exists academic_id text not null default '';
alter table public.anreview_reviews add column if not exists academic_name text not null default '';
alter table public.anreview_reviews add column if not exists user_id uuid;
alter table public.anreview_reviews add column if not exists user_email text not null default '';
alter table public.anreview_reviews add column if not exists display_name text not null default '';
alter table public.anreview_reviews add column if not exists username text not null default '';
alter table public.anreview_reviews add column if not exists is_anu_verified boolean not null default false;
alter table public.anreview_reviews add column if not exists is_guest boolean not null default true;

create table if not exists public.anreview_profiles (
  id uuid primary key,
  email text not null default '',
  display_name text not null default '',
  username text not null default '',
  phone text not null default '',
  is_anu_verified boolean not null default false,
  inserted_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists anreview_profiles_username_idx
  on public.anreview_profiles (lower(username))
  where username <> '';

create index if not exists anreview_reviews_item_idx
  on public.anreview_reviews (item_id, inserted_at desc);

create table if not exists public.anreview_reports (
  id text primary key,
  review_id text not null,
  item_id text not null,
  reason text not null,
  created_at timestamptz not null,
  status text not null default 'open'
);

create index if not exists anreview_reports_status_idx
  on public.anreview_reports (status, created_at desc);

grant usage on schema public to anon, authenticated, service_role;
grant select on public.anreview_reviews to anon, authenticated;
grant select, insert, update on public.anreview_reviews to service_role;
grant select, insert on public.anreview_reports to service_role;
grant select, insert, update on public.anreview_profiles to service_role;

alter table public.anreview_reviews enable row level security;
alter table public.anreview_reports enable row level security;
alter table public.anreview_profiles enable row level security;

drop policy if exists "public can read reviews" on public.anreview_reviews;
create policy "public can read reviews"
  on public.anreview_reviews
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public can read reports count only via server" on public.anreview_reports;
create policy "public can read reports count only via server"
  on public.anreview_reports
  for select
  to authenticated
  using (false);

drop policy if exists "profiles are server-managed" on public.anreview_profiles;
create policy "profiles are server-managed"
  on public.anreview_profiles
  for select
  to authenticated
  using (false);
