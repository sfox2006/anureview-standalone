# ANReview

Standalone ANU College of Business and Economics ratings prototype.

## Deploy on Render

This project is now prepared for Render.

If you create a new Render web service from the GitHub repo, the key settings are:

- Environment: `Python`
- Build command: `pip install -r requirements.txt`
- Start command: `python server.py`

The repo also includes `render.yaml`, so Render can usually detect the service settings automatically.

## Public URL behavior

When deployed, the app redirects the root URL `/` to:

```text
/cbe-rating/
```

## Run it

```powershell
python server.py
```

Then open:

```text
http://127.0.0.1:8000/cbe-rating/
```

## Included

- ANReview front end in `cbe-rating/`
- shared local review API in `server.py`
- seeded ANU CBE courses and staff data
- review reporting support
- Render deployment config in `render.yaml`

## Supabase setup

ANReview can now store reviews and reports in Supabase instead of temporary JSON files.

### 1. Create the tables

In your Supabase project, open `SQL Editor` and run:

```sql
\i supabase/anrevu_schema.sql
```

If you are pasting manually in the Supabase dashboard, copy the contents of:

```text
supabase/anrevu_schema.sql
```

If you already created the tables before this schema update, also run:

```sql
grant usage on schema public to anon, authenticated, service_role;
grant select on public.anreview_reviews to anon, authenticated;
grant select, insert, update on public.anreview_reviews to service_role;
grant select, insert on public.anreview_reports to service_role;
alter table public.anreview_reviews add column if not exists upvotes integer not null default 0;
alter table public.anreview_reviews add column if not exists downvotes integer not null default 0;
alter table public.anreview_reviews add column if not exists semester text not null default '';
```

If your existing table was created on the older 5-point review scale, also run:

```sql
alter table public.anreview_reviews
  alter column overall type numeric(3,1),
  alter column metric_a type numeric(3,1),
  alter column metric_b type numeric(3,1),
  alter column metric_c type numeric(3,1);

alter table public.anreview_reviews drop constraint if exists anreview_reviews_overall_check;
alter table public.anreview_reviews drop constraint if exists anreview_reviews_metric_a_check;
alter table public.anreview_reviews drop constraint if exists anreview_reviews_metric_b_check;
alter table public.anreview_reviews drop constraint if exists anreview_reviews_metric_c_check;

alter table public.anreview_reviews
  add constraint anreview_reviews_overall_check check (overall between 1 and 10),
  add constraint anreview_reviews_metric_a_check check (metric_a between 1 and 10),
  add constraint anreview_reviews_metric_b_check check (metric_b between 1 and 10),
  add constraint anreview_reviews_metric_c_check check (metric_c between 1 and 10);
```

### 2. Add Render environment variables

In your Render service, set:

```text
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Optional:

```text
SUPABASE_REVIEWS_TABLE=anreview_reviews
SUPABASE_REPORTS_TABLE=anreview_reports
```

Do not put the service role key into frontend code or GitHub.

### 3. Redeploy

After the env vars are added, redeploy the Render service. The backend will then:

- read reviews from Supabase
- write new reviews to Supabase
- read reports from Supabase
- write new reports to Supabase

If the Supabase env vars are not set, the app falls back to local JSON storage.

Runtime review storage is written to:

```text
%TEMP%\ANReview\
```
