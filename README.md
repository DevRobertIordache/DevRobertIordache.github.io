<p align="center">
  <img src="assets/cover.png" alt="MechanicMatch" width="980" />
</p>

<h1 align="center">MechanicMatch</h1>
<p align="center">
  Premium, performance-first single-page UI for mechanic request intake & matching.
</p>

<p align="center">
  <a href="https://devrobertiordache.github.io/">Live Demo</a>
  ·
  <a href="#run">Run</a>
  ·
  <a href="#structure">Structure</a>
  ·
  <a href="#features">Features</a>
</p>

---

## What this is

MechanicMatch is a **static, offline-safe** front-end foundation for a modern car repair request flow:
collect the issue + location → show a matched mechanic card → store requests for demo/admin view.

No frameworks. No CDNs. No dependencies. No build tools.

---

## Features

- Dark-mode first premium UI (light mode supported)
- Responsive layout (mobile → desktop)
- Accessible focus states + reduced motion support
- Multi-step request flow + validation
- Matched mechanic result card with call/copy actions
- Fake activity feed cards (social-app clean)
- Local demo storage (no backend required)

---

## Run

### Option A — Local
Open `index.html` in your browser.

### Option B — GitHub Pages
Settings → Pages → Deploy from branch → `main` → `/root`

---

## Structure

/
├─ index.html
├─ css/
│ ├─ styles.css
│ └─ styles.min.css
└─ js/
├─ app.js
└─ app.min.js

---

## Notes

- This repo is intentionally **frontend-only**
- Plug in any backend later (email, webhook, database, auth)

---
