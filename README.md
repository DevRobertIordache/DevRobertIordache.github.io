```md
# MechanicMatch

A premium, performance-oriented frontend foundation for a mechanic job-matching platform.

This repository contains a **static, framework-agnostic web interface** built to act as the visual and structural base of a scalable system. It is intentionally minimal, fast, and backend-ready.

---

## Purpose

MechanicMatch exists to collect car repair requests and route them to mechanics.

At this phase, the project is focused on:

- High-quality, consumer-grade UI/UX  
- Clean, extensible code structure  
- Extremely small asset and file size  
- Zero backend dependencies  
- Compatibility with static hosting (GitHub Pages)

This is **not** a finished product.  
It is a **production-quality foundation**.

---

## Stack

- HTML5 (semantic, accessible)
- CSS (vanilla, custom design system)
- JavaScript (vanilla, progressive enhancement)
- No frameworks
- No build tools
- No external dependencies
- No CDNs

Everything runs by opening `index.html`.

---

## Project Structure

```

/
├─ index.html        # App shell and layout
├─ css/
│  ├─ styles.css     # Source CSS (readable)
│  └─ styles.min.css # Production CSS (minified)
├─ js/
│  ├─ app.js         # Source JS (readable)
│  └─ app.min.js     # Production JS (minified)
└─ README.md

````

---

## Design Principles

- Dark-first premium interface
- Mobile-first responsive layout
- CSS variables as a full design system
- Minimal DOM and selector usage
- Accessible focus states
- Subtle micro-interactions
- Performance before aesthetics
- “Sleeper build” approach: simple surface, serious engineering

---

## Current State

- Layout and visual system implemented
- Minified production assets wired
- Static-hosting compatible
- JavaScript hooks prepared

---

## Hosting

Designed to run on:

- GitHub Pages
- Any static file host
- Local filesystem (`file://`)

No configuration required.

---

## Development vs Production

Production (default):

```html
<link rel="stylesheet" href="css/styles.min.css" />
<script src="js/app.min.js" defer></script>
````

Development (debug):

```html
<link rel="stylesheet" href="css/styles.css" />
<script src="js/app.js" defer></cript>
```

---

## Roadmap

* Multi-step job intake form
* Client-side validation
* Activity and trust signal UI
* Mechanic match result cards
* Progressive enhancement (no-JS fallback)
* Backend API integration (future phase)

---

## License

Private / proprietary
All rights reserved.

---

## Status

Active development
This repository represents the foundation layer of a larger system.

```
```
