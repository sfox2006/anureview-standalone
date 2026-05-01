create extension if not exists pgcrypto;

create table if not exists public.anreview_reviews (
  id text primary key,
  item_id text not null,
  item_type text not null check (item_type in ('course', 'academic')),
  author text not null,
  created_at date not null,
  overall integer not null check (overall between 1 and 5),
  metric_a integer not null check (metric_a between 1 and 5),
  metric_b integer not null check (metric_b between 1 and 5),
  metric_c integer not null check (metric_c between 1 and 5),
  tags jsonb not null default '[]'::jsonb,
  comment text not null,
  inserted_at timestamptz not null default timezone('utc', now())
);

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

alter table public.anreview_reviews enable row level security;
alter table public.anreview_reports enable row level security;

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
