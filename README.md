# ANReview

Standalone ANU College of Business and Economics ratings prototype.

## Deploy on Render

This project is now prepared for Render.

If you create a new Render web service from the GitHub repo, the key settings are:

- Environment: `Python`
- Build command: `pip install -r requirements.txt`
- Start command: `python server.py`

The repo also includes `render.yaml`, so Render can usually detect the service settings automatically.

If you want the app to stay awake and feel faster for visitors, switch the Render web service from `Free` to `Starter` in the Render dashboard.

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

## Google Analytics 4

ANRevU can load Google Analytics 4 without hard-coding the tracking ID into the frontend bundle.

### 1. Create a GA4 web data stream

In Google Analytics:

1. Create or open your GA4 property
2. Add a web data stream for your live site
3. Copy the measurement ID, which looks like:

```text
G-XXXXXXXXXX
```

### 2. Add the Render environment variable

In your Render service, add:

```text
GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. Redeploy

After redeploying, ANRevU will:

- load the GA4 script only when the measurement ID exists
- track page views across the hash-based directory/detail flow
- track directory searches
- track review submissions

This gives you the normal GA4 reporting for:

- visitors
- engagement time
- device type
- traffic source
- page views

## Review backups

ANRevU now supports a two-layer backup setup:

### Layer 1: Supabase backups

Supabase remains the main database and first backup layer.

### Layer 2: Scheduled review exports

The repo now includes:

- backup script: `scripts/export_reviews_backup.py`
- scheduled GitHub Actions workflow: `.github/workflows/review-backup.yml`

The export writes:

- `manifest.json`
- `reviews.json`
- `reports.json`
- `reviews.csv`
- `reports.csv`
- a timestamped `.zip` archive

The workflow runs once per day and can also be started manually from GitHub Actions.

### Local backup files

By default, local backup files are written to:

```text
backups/review-exports/
```

This path is gitignored so backups do not get committed into the repo.

### Optional Google Drive upload

If you add Google Drive credentials, the same backup export can upload the zip archive and manifest to your Google Drive folder.

#### Google Drive setup

1. In Google Cloud, create or use a project
2. Enable the Google Drive API
3. Create a service account
4. Create a JSON key for that service account
5. In Google Drive, create a folder for ANRevU backups
6. Share that folder with the service account email address
7. Copy the folder ID from the Drive URL

#### GitHub Actions secrets

In your GitHub repository, add these secrets:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON
GOOGLE_DRIVE_FOLDER_ID
```

Optional:

```text
SUPABASE_REVIEWS_TABLE
SUPABASE_REPORTS_TABLE
```

If the Google Drive secrets are missing, the workflow still creates the export files and uploads them as a GitHub Actions artifact.

### Run the backup script manually

From the repo root:

```powershell
python scripts/export_reviews_backup.py
```

Optional local environment variables:

```text
ANREVIEW_BACKUP_DIR=backups/review-exports
GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON=...
GOOGLE_DRIVE_FOLDER_ID=...
```

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
alter table public.anreview_reviews add column if not exists taken_year text not null default '';
alter table public.anreview_reviews add column if not exists academic_id text not null default '';
alter table public.anreview_reviews add column if not exists academic_name text not null default '';
grant delete on public.anreview_reviews to service_role;
grant delete on public.anreview_reports to service_role;
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
