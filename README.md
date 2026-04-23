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

Runtime review storage is written to:

```text
%TEMP%\ANReview\
```
