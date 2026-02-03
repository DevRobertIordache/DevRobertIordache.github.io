```md
# MechanicMatch — Static intake + match UI (offline + GitHub Pages)

## File tree (exact)

```

.
├─ index.html
├─ README.md
├─ css/
│  ├─ styles.css
│  └─ styles.min.css
├─ js/
│  ├─ app.js
│  └─ app.min.js
└─ assets/
├─ logo.svg
├─ favicon.svg
├─ hero-illustration.svg
└─ placeholders/
├─ avatar.svg
└─ empty-state.svg

````

## Run locally

1) Open `index.html` directly:
- Windows: double-click `index.html`
- Mac/Linux: open with any browser

Works under `file://` (no server).

## Deploy to GitHub Pages

1) Create a GitHub repo.
2) Upload the project files (keep the file tree exactly).
3) Repo → **Settings** → **Pages**.
4) **Build and deployment** → Source: **Deploy from a branch**.
5) Branch: `main` (or `master`) and folder: `/root`.
6) Save. Pages will publish at your repo’s GitHub Pages URL.

## What’s included

### Routes (hash router)
- `#home` — landing + CTA
- `#request` — multi-step job intake
- `#results` — matched mechanics
- `#inbox` — admin/inbox (saved requests)

### Features
- SPA view switching via `[data-view]` + hash routes
- Theme toggle: `<html data-theme="dark|light">` + persisted
- Multi-step form UX shell + validation + accessible error region
- Mock matching ranks mechanics by location/category/open status
- Results rendering as premium mechanic cards
- Inbox: requests list → open details → copy full request
- Toast system (`aria-live`) + modal/dialog support (ESC closes)
- Respects `prefers-reduced-motion`

## Mock data (mechanics + requests)

### Mechanics
- Primary: `js/app.js` contains an inline mechanic list fallback (always works offline).
- Optional: if you add a local JSON file, the app will try (in order):
  1) `assets/mock/mechanics.json`
  2) `assets/mechanics.json`

Expected JSON shape (either form is accepted):

```json
[{"id":"kells-001","name":"Kells Mobile Mechanic","area":"Kells","county":"Meath","phones":["089 219 3220"],"hours":{"days":[1,2,3,4,5],"open":"10:30","close":"16:30"},"services":["engine","diagnostics"],"rating":4.8,"jobs":128,"responseMins":22,"travelKm":35}]
````

or:

```json
{"mechanics":[{"id":"..."}]}
```

### Requests

Requests are stored in `localStorage`:

* Key: `mock_db_requests_v1`

Each saved request object shape:

```json
{"id":"r-...","createdAt":"2026-02-03T12:34:56.000Z","location":{"county":"Meath","city":""},"car":{"make":"","model":"","year":""},"category":"engine","description":"...","urgency":"standard","phone":"...","contact":"call","raw":{}}
```

UI preferences are stored in `localStorage`:

* Key: `mock_ui_state_v1`

## Switch between minified and source files

`index.html` should load minified by default:

* `css/styles.min.css`
* `js/app.min.js`

To debug:

1. Comment out the minified `<link>` / `<script>`.
2. Uncomment the non-minified versions:

* `css/styles.css`
* `js/app.js`

## Accessibility notes

* Skip link included (keyboard users jump to main content).
* Form inputs use labels; errors set `aria-invalid` and an alert region.
* Dialogs use `role="dialog"` + `aria-modal="true"` + labelled title.
* ESC closes dialogs; basic focus trapping keeps tab focus inside.
* Toast uses `role="status"` / `aria-live="polite"`.
* Reduced motion: transitions/animations are reduced when the OS setting is enabled.

## Future backend integration

Where to replace mock logic:

* Matching: replace `match(req)` with an API call returning ranked mechanics.
* Requests persistence: replace `localStorage` writes with `POST /requests`.
* Inbox: replace `localStorage` reads with `GET /requests`.

Recommended API payload shapes:

### POST /requests

```json
{"location":{"county":"Meath","city":""},"car":{"make":"","model":"","year":""},"category":"engine","description":"...","urgency":"standard","phone":"...","contact":"call"}
```

### GET /mechanics

```json
[{"id":"kells-001","name":"...","area":"Kells","county":"Meath","phones":["..."],"hours":{"days":[1,2,3,4,5],"open":"10:30","close":"16:30"},"services":["engine","diagnostics"],"rating":4.8,"jobs":128,"responseMins":22,"travelKm":35}]
```

## Constraints (reminder)

* No external dependencies (no CDN, frameworks, libraries).
* Offline compatible (works under `file://`).
* Each file is intended to remain under 500 lines.

```
```
