/* js/app.js */
/* Readable source – static SPA interactions for mechanic match UI */
(() => {
  'use strict';

  const doc = document;
  const $ = (s, r = doc) => r.querySelector(s);
  const $$ = (s, r = doc) => Array.from(r.querySelectorAll(s));
  const prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ROUTES = ['home', 'request', 'results', 'inbox'];
  const STORE_KEY = 'mm_app_v1';
  const DEFAULT_STATE = { theme: 'dark', requests: [], lastRoute: 'home', lastSelectedRequestId: null };

  const INLINE_MECHANICS = [
    {
      id: 'kells-001',
      name: 'Kells Mobile Mechanic',
      area: 'Kells',
      county: 'Meath',
      phones: ['089 219 3220', '089 499 3928'],
      hours: { days: [1, 2, 3, 4, 5], open: '10:30', close: '16:30' },
      services: ['engine', 'diagnostics', 'brakes', 'electrical', 'suspension', 'tyres'],
      rating: 4.8,
      jobs: 128,
      responseMins: 22,
      travelKm: 35
    },
    {
      id: 'dublin-001',
      name: 'Dublin City Garage',
      area: 'Dublin',
      county: 'Dublin',
      phones: ['01 555 0199'],
      hours: { days: [1, 2, 3, 4, 5, 6], open: '08:30', close: '18:00' },
      services: ['diagnostics', 'brakes', 'service', 'tyres', 'clutch'],
      rating: 4.6,
      jobs: 540,
      responseMins: 35,
      travelKm: 18
    },
    {
      id: 'drogheda-001',
      name: 'Drogheda Auto Assist',
      area: 'Drogheda',
      county: 'Louth',
      phones: ['041 555 0201'],
      hours: { days: [1, 2, 3, 4, 5], open: '09:00', close: '17:00' },
      services: ['engine', 'electrical', 'diagnostics', 'service'],
      rating: 4.7,
      jobs: 312,
      responseMins: 28,
      travelKm: 22
    },
    {
      id: 'navan-001',
      name: 'Navan Workshop',
      area: 'Navan',
      county: 'Meath',
      phones: ['046 555 0118'],
      hours: { days: [1, 2, 3, 4, 5], open: '09:00', close: '17:30' },
      services: ['brakes', 'suspension', 'tyres', 'service'],
      rating: 4.5,
      jobs: 220,
      responseMins: 45,
      travelKm: 28
    }
  ];

  let state = loadState();
  let mechanics = INLINE_MECHANICS.slice();

  // ------------------------- storage -------------------------
  function loadState() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STATE,
        ...parsed,
        requests: Array.isArray(parsed.requests) ? parsed.requests : []
      };
    } catch {
      return { ...DEFAULT_STATE };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(
        STORE_KEY,
        JSON.stringify({
          theme: state.theme,
          requests: state.requests,
          lastRoute: state.lastRoute,
          lastSelectedRequestId: state.lastSelectedRequestId
        })
      );
    } catch {
      /* ignore */
    }
  }

  // ------------------------- theme -------------------------
  function setTheme(theme) {
    const t = theme === 'light' ? 'light' : 'dark';
    state.theme = t;
    doc.documentElement.setAttribute('data-theme', t);
    saveState();
    updateThemeUI();
  }

  function toggleTheme() {
    setTheme(state.theme === 'dark' ? 'light' : 'dark');
    toast(state.theme === 'dark' ? 'Dark mode' : 'Light mode');
  }

  function updateThemeUI() {
    const btn = $('[data-action="toggle-theme"]');
    if (!btn) return;
    const next = state.theme === 'dark' ? 'Light' : 'Dark';
    btn.setAttribute('aria-label', `Switch to ${next} mode`);
  }

  // ------------------------- router -------------------------
  function getRoute() {
    const h = (location.hash || '#home').replace('#', '').trim();
    return ROUTES.includes(h) ? h : 'home';
  }

  function navigate(route) {
    location.hash = `#${ROUTES.includes(route) ? route : 'home'}`;
  }

  function showRoute(route) {
    const views = $$('[data-view]');
    views.forEach((v) => {
      const on = v.dataset.view === route;
      v.hidden = !on;
      v.setAttribute('aria-hidden', String(!on));
    });

    const links = $$('[data-route]');
    links.forEach((a) => {
      const match = a.dataset.route === route || a.getAttribute('href') === `#${route}`;
      if (match) {
        a.setAttribute('aria-current', 'page');
        a.classList.add('is-active');
      } else {
        a.removeAttribute('aria-current');
        a.classList.remove('is-active');
      }
    });

    state.lastRoute = route;
    saveState();

    if (route === 'results') renderResultsFromLast();
    if (route === 'inbox') renderInbox();

    focusView(route);
  }

  function focusView(route) {
    const view = $(`[data-view="${route}"]`);
    if (!view) return;
    const target = view.querySelector('[data-focus], h1, h2, [tabindex="-1"]');
    if (!target) return;
    target.setAttribute('tabindex', '-1');
    const doFocus = () => target.focus({ preventScroll: false });
    if (prefersReduce) doFocus();
    else setTimeout(doFocus, 0);
  }

  function onRouteChange() {
    showRoute(getRoute());
  }

  // ------------------------- mechanics data -------------------------
  async function tryLoadMechanics() {
    // Optional: if a local JSON exists, use it. Always fallback to inline (works file://).
    const candidates = ['assets/mock/mechanics.json', 'assets/mechanics.json'];
    for (const url of candidates) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) continue;
        const data = await res.json();
        const list = Array.isArray(data) ? data : Array.isArray(data.mechanics) ? data.mechanics : null;
        if (list && list.length) {
          mechanics = list;
          return;
        }
      } catch {
        /* ignore */
      }
    }
  }

  // ------------------------- toast -------------------------
  let toastTimer = null;

  function getToastEl() {
    return $('[data-component="toast"]') || $('#toast') || null;
  }

  function toast(message) {
    const el = getToastEl();
    if (!el) return;
    const text = el.querySelector('[data-bind="toastText"], .toast__text') || el;
    text.textContent = String(message || '');
    el.hidden = false;

    clearTimeout(toastTimer);
    const delay = prefersReduce ? 2200 : 3200;
    toastTimer = setTimeout(() => {
      el.hidden = true;
    }, delay);
  }

  function dismissToast() {
    const el = getToastEl();
    if (el) el.hidden = true;
  }

  // ------------------------- modal/dialog -------------------------
  let activeDialog = null;
  let lastFocus = null;

  function getOverlay() {
    return $('[data-component="overlay"]') || $('.overlay');
  }

  function findDialog(name) {
    return $(`[data-dialog="${name}"]`) || $(`#${name}`);
  }

  function ensureRequestDialog() {
    let dlg = findDialog('request-detail');
    if (dlg) return dlg;

    dlg = doc.createElement('section');
    dlg.className = 'dialog';
    dlg.setAttribute('role', 'dialog');
    dlg.setAttribute('aria-modal', 'true');
    dlg.setAttribute('aria-labelledby', 'requestDetailTitle');
    dlg.setAttribute('data-dialog', 'request-detail');
    dlg.hidden = true;

    dlg.innerHTML = `
      <header class="dialog__header">
        <h2 id="requestDetailTitle">Request details</h2>
        <button class="icon-button" type="button" data-action="close-dialog" data-dialog="request-detail" aria-label="Close dialog">×</button>
      </header>
      <div class="dialog__body">
        <div data-bind="requestDetail"></div>
        <div class="dialog__actions" role="group" aria-label="Request actions">
          <button class="button" type="button" data-action="copy-request">Copy request</button>
          <button class="button button--primary" type="button" data-action="close-dialog" data-dialog="request-detail">Done</button>
        </div>
      </div>
    `.trim();

    doc.body.appendChild(dlg);
    return dlg;
  }

  function openDialog(name, triggerEl) {
    const dlg = name === 'request-detail' ? ensureRequestDialog() : findDialog(name);
    if (!dlg) return;

    const overlay = getOverlay();
    if (overlay) overlay.hidden = false;

    lastFocus = triggerEl || doc.activeElement;
    activeDialog = dlg;
    dlg.hidden = false;

    const focusable = getFocusable(dlg);
    (focusable[0] || dlg).focus({ preventScroll: true });
  }

  function closeDialog(name) {
    const dlg = name ? (name === 'request-detail' ? ensureRequestDialog() : findDialog(name)) : activeDialog;
    if (!dlg) return;

    dlg.hidden = true;
    if (activeDialog === dlg) activeDialog = null;

    const overlay = getOverlay();
    if (overlay) overlay.hidden = true;

    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function getFocusable(root) {
    const sel = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    return $$(sel, root).filter((el) => !el.hidden && el.offsetParent !== null);
  }

  function trapFocus(e) {
    if (!activeDialog || e.key !== 'Tab') return;
    const f = getFocusable(activeDialog);
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && doc.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && doc.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // ------------------------- clipboard -------------------------
  async function copyText(text) {
    const value = String(text || '').trim();
    if (!value) return false;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {
      /* fallback */
    }

    try {
      const ta = doc.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      doc.body.appendChild(ta);
      ta.select();
      const ok = doc.execCommand && doc.execCommand('copy');
      doc.body.removeChild(ta);
      return !!ok;
    } catch {
      return false;
    }
  }

  // ------------------------- request form -------------------------
  function getRequestForm() {
    return (
      $('[data-component="request-form"]') ||
      $('#requestForm') ||
      $('form[data-action="submit-request"]') ||
      $('form[data-route="request"]')
    );
  }

  function getErrorRegion(form) {
    return form.querySelector('[data-component="form-errors"]') || $('#formErrors') || null;
  }

  function ensureErrorRegion(form) {
    let region = getErrorRegion(form);
    if (region) return region;
    region = doc.createElement('div');
    region.className = 'form-errors';
    region.setAttribute('role', 'alert');
    region.setAttribute('aria-live', 'assertive');
    region.hidden = true;
    form.prepend(region);
    return region;
  }

  function clearErrors(form) {
    const region = getErrorRegion(form);
    if (region) {
      region.textContent = '';
      region.hidden = true;
    }
    $$('[aria-invalid="true"]', form).forEach((el) => el.removeAttribute('aria-invalid'));
    $$('[data-error-for]', form).forEach((el) => {
      el.textContent = '';
      el.hidden = true;
    });
  }

  function fieldKey(field) {
    return field.name || field.id || '';
  }

  function ensureFieldErrorEl(form, field) {
    const key = fieldKey(field);
    if (!key) return null;
    let el = form.querySelector(`[data-error-for="${cssEscape(key)}"]`);
    if (!el && field.id) el = $(`#${cssEscape(field.id)}-error`, form);
    if (!el) {
      el = doc.createElement('div');
      el.className = 'field-error';
      el.hidden = true;
      el.setAttribute('data-error-for', key);
      el.setAttribute('role', 'alert');
      if (field.id) el.id = `${field.id}-error`;
      field.insertAdjacentElement('afterend', el);
    }
    return el;
  }

  function mergeDescribedBy(field, id) {
    const cur = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if (id && !cur.includes(id)) cur.push(id);
    return cur.join(' ');
  }

  function setFieldError(form, field, message) {
    field.setAttribute('aria-invalid', 'true');
    const el = ensureFieldErrorEl(form, field);
    if (el) {
      el.textContent = message;
      el.hidden = false;
      if (el.id) field.setAttribute('aria-describedby', mergeDescribedBy(field, el.id));
    }
  }

  function normalizePhone(v) {
    return String(v || '').replace(/[^0-9+]/g, '');
  }

  function validateField(form, field) {
    if (!field || field.disabled) return null;

    const isRequired = field.required || field.getAttribute('aria-required') === 'true' || field.dataset.required === 'true';
    const value = (field.value || '').trim();

    if (isRequired && !value) {
      return 'This field is required.';
    }

    const key = fieldKey(field).toLowerCase();
    const type = (field.type || '').toLowerCase();

    if ((type === 'tel' || key.includes('phone')) && value) {
      const p = normalizePhone(value);
      const digits = p.replace(/\D/g, '');
      if (digits.length < 7) return 'Enter a valid phone number.';
    }

    if (type === 'number' && value) {
      const n = Number(value);
      if (!Number.isFinite(n)) return 'Enter a valid number.';
    }

    return null;
  }

  function validateSection(form, root) {
    const fields = $$('input, select, textarea', root).filter((f) => f.offsetParent !== null && !f.closest('[hidden]'));
    const errors = [];
    fields.forEach((field) => {
      const msg = validateField(form, field);
      if (msg) {
        errors.push({ field, msg });
        setFieldError(form, field, msg);
      }
    });
    return errors;
  }

  function collectRequest(form) {
    const fd = new FormData(form);

    const location = {
      county: String(fd.get('county') || fd.get('location') || fd.get('area') || '').trim(),
      city: String(fd.get('city') || fd.get('town') || '').trim()
    };

    const car = {
      make: String(fd.get('make') || '').trim(),
      model: String(fd.get('model') || '').trim(),
      year: String(fd.get('year') || '').trim()
    };

    const req = {
      id: `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      location,
      car,
      category: String(fd.get('category') || fd.get('issueCategory') || '').trim(),
      description: String(fd.get('description') || fd.get('issue') || fd.get('problem') || '').trim(),
      urgency: String(fd.get('urgency') || 'standard').trim(),
      phone: String(fd.get('phone') || fd.get('phoneNumber') || '').trim(),
      contact: String(fd.get('contact') || fd.get('contactPreference') || 'call').trim(),
      raw: Object.fromEntries(fd.entries())
    };

    return req;
  }

  // ------------------------- matching -------------------------
  function timeToMinutes(hhmm) {
    const m = String(hhmm || '').match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h = Number(m[1]);
    const mm = Number(m[2]);
    return h * 60 + mm;
  }

  function isOpenNow(mech, now = new Date()) {
    const h = mech.hours;
    if (!h || !Array.isArray(h.days)) return false;
    const day = now.getDay();
    if (!h.days.includes(day)) return false;
    const openM = timeToMinutes(h.open);
    const closeM = timeToMinutes(h.close);
    if (openM == null || closeM == null) return false;
    const cur = now.getHours() * 60 + now.getMinutes();
    return cur >= openM && cur <= closeM;
  }

  function norm(s) {
    return String(s || '').toLowerCase().trim();
  }

  function scoreMechanic(mech, req) {
    let score = 0;

    const county = norm(req.location.county);
    const city = norm(req.location.city);
    const mCounty = norm(mech.county);
    const mArea = norm(mech.area);

    if (county && mCounty && county === mCounty) score += 60;
    else if (county && mCounty && mCounty.includes(county)) score += 35;

    if (city && mArea && (city === mArea || mArea.includes(city) || city.includes(mArea))) score += 25;

    const cat = norm(req.category);
    const desc = norm(req.description);
    const svc = Array.isArray(mech.services) ? mech.services.map(norm) : [];

    if (cat && svc.includes(cat)) score += 35;

    // keyword assist
    const keywords = [
      { k: 'brake', s: 'brakes' },
      { k: 'battery', s: 'electrical' },
      { k: 'start', s: 'electrical' },
      { k: 'engine', s: 'engine' },
      { k: 'oil', s: 'engine' },
      { k: 'noise', s: 'diagnostics' },
      { k: 'tyre', s: 'tyres' },
      { k: 'suspension', s: 'suspension' },
      { k: 'clutch', s: 'clutch' }
    ];

    for (const { k, s } of keywords) {
      if ((cat && cat.includes(k)) || (desc && desc.includes(k))) {
        if (svc.includes(s)) score += 10;
      }
    }

    if (isOpenNow(mech)) score += 12;
    else score -= 4;

    const rating = Number(mech.rating || 0);
    if (rating) score += Math.round(rating * 2);

    const jobs = Number(mech.jobs || 0);
    if (jobs) score += Math.min(12, Math.floor(jobs / 60));

    return score;
  }

  function matchMechanics(req) {
    const list = (mechanics || []).map((m) => ({ mech: m, score: scoreMechanic(m, req) }));
    list.sort((a, b) => b.score - a.score);
    return list.map((x) => x.mech);
  }

  // ------------------------- render results -------------------------
  let lastMatch = { requestId: null, mechanics: [] };

  function resultsContainer() {
    return $('[data-component="results-list"]') || $('#resultsList') || $('[data-bind="resultsList"]');
  }

  function formatHours(mech) {
    if (!mech.hours) return '';
    const h = mech.hours;
    const days = Array.isArray(h.days) && h.days.length === 5 && h.days.includes(1) && h.days.includes(5) ? 'Weekdays only' : 'Hours';
    const open = h.open ? h.open : '';
    const close = h.close ? h.close : '';
    const pretty = open && close ? `${open}–${close}` : '';
    return [days, pretty].filter(Boolean).join(' ');
  }

  function phoneToTel(phone) {
    // Ireland: if starts with 0, keep it; tel link accepts digits.
    const digits = String(phone || '').replace(/[^0-9+]/g, '');
    return digits.startsWith('+') ? digits : digits;
  }

  function renderMechanicCard(mech) {
    const open = isOpenNow(mech);
    const phones = Array.isArray(mech.phones) ? mech.phones : [];

    const phoneButtons = phones
      .map((p) => {
        const tel = phoneToTel(p);
        return `
          <div class="contact__actions">
            <a class="button button--primary" href="tel:${tel}" data-action="call" aria-label="Call ${mech.name} at ${p}">Call now</a>
            <button class="button button--secondary" type="button" data-action="copy-number" data-number="${escapeHtml(p)}">Copy number</button>
          </div>
        `.trim();
      })
      .join('');

    return `
      <article class="matched-mechanic card--match" data-entity="mechanic" data-mechanic-id="${escapeHtml(mech.id)}">
        <div class="matched-mechanic__top">
          <div>
            <h2 class="matched-mechanic__name">${escapeHtml(mech.name)}</h2>
            <p class="matched-mechanic__area">${escapeHtml(mech.area)}${mech.county ? `, Co. ${escapeHtml(mech.county)}` : ''}</p>
            <p class="matched-mechanic__hours">${escapeHtml(formatHours(mech) || '')}</p>
            <p class="hint">${open ? 'Open now' : 'Closed now'} • Response ~${escapeHtml(String(mech.responseMins || '—'))} mins • Travel ${escapeHtml(String(mech.travelKm || '—'))} km</p>
          </div>
          <dl class="metrics" aria-label="Mechanic metrics">
            <div><dt>Rating</dt><dd>${escapeHtml(String(mech.rating || '—'))}</dd></div>
            <div><dt>Jobs</dt><dd>${escapeHtml(String(mech.jobs || '—'))}</dd></div>
          </dl>
        </div>
        <div class="matched-mechanic__actions" role="group" aria-label="Contact actions">
          ${phoneButtons}
        </div>
      </article>
    `.trim();
  }

  function renderResults(mechs) {
    const host = resultsContainer();
    if (!host) return;

    host.innerHTML = '';

    if (!mechs || !mechs.length) {
      const empty = $('[data-state="results-empty"]') || $('[data-state="match-empty"]');
      if (empty) empty.hidden = false;
      toast('No matches found');
      return;
    }

    const top = mechs.slice(0, 3).map(renderMechanicCard).join('');
    host.insertAdjacentHTML('beforeend', top);

    const wrap = host.closest('[hidden]');
    if (wrap) wrap.hidden = false;

    const empty = $('[data-state="results-empty"]') || $('[data-state="match-empty"]');
    if (empty) empty.hidden = true;

    toast('Matched mechanics ready');
  }

  function renderResultsFromLast() {
    if (!lastMatch.requestId) return;
    renderResults(lastMatch.mechanics);
  }

  // ------------------------- inbox/admin -------------------------
  function inboxListEl() {
    return $('[data-component="inbox-list"]') || $('#inboxList') || $('[data-bind="inboxList"]');
  }

  function renderInbox() {
    const host = inboxListEl();
    if (!host) return;

    host.innerHTML = '';

    const list = Array.isArray(state.requests) ? state.requests.slice().reverse() : [];
    if (!list.length) {
      const empty = $('[data-state="inbox-empty"]');
      if (empty) empty.hidden = false;
      return;
    }

    const empty = $('[data-state="inbox-empty"]');
    if (empty) empty.hidden = true;

    const html = list
      .slice(0, 50)
      .map((r) => {
        const title = `${r.location.county || 'Ireland'} • ${r.category || 'Request'}`;
        const when = formatRelative(r.createdAt);
        const preview = (r.description || '').slice(0, 90);
        return `
          <li class="thread" data-entity="request" data-request-id="${escapeHtml(r.id)}">
            <button class="thread__button" type="button" data-action="open-request" data-request-id="${escapeHtml(r.id)}">
              <span class="avatar" aria-hidden="true">RQ</span>
              <span class="thread__meta">
                <span class="thread__title">${escapeHtml(title)}</span>
                <span class="thread__preview">${escapeHtml(preview || 'No description')}</span>
              </span>
              <span class="thread__time">${escapeHtml(when)}</span>
            </button>
          </li>
        `.trim();
      })
      .join('');

    host.insertAdjacentHTML('beforeend', html);
  }

  function openRequestDetail(id, triggerEl) {
    const req = (state.requests || []).find((r) => r.id === id);
    if (!req) {
      toast('Request not found');
      return;
    }

    state.lastSelectedRequestId = id;
    saveState();

    const dlg = ensureRequestDialog();
    const slot = dlg.querySelector('[data-bind="requestDetail"]');
    if (slot) slot.innerHTML = renderRequestDetail(req);

    openDialog('request-detail', triggerEl);
  }

  function renderRequestDetail(req) {
    const lines = [
      ['Created', new Date(req.createdAt).toLocaleString()],
      ['Location', [req.location.city, req.location.county].filter(Boolean).join(', ') || '—'],
      ['Car', [req.car.make, req.car.model, req.car.year].filter(Boolean).join(' ') || '—'],
      ['Category', req.category || '—'],
      ['Urgency', req.urgency || '—'],
      ['Contact', req.contact || '—'],
      ['Phone', req.phone || '—']
    ];

    const dl = lines
      .map(([k, v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(String(v || '—'))}</dd></div>`)
      .join('');

    const desc = req.description ? `<p><strong>Description</strong></p><p>${escapeHtml(req.description)}</p>` : '<p>No description.</p>';

    return `
      <section class="panel" aria-label="Request summary">
        <dl class="metrics" aria-label="Request fields">${dl}</dl>
        ${desc}
      </section>
    `.trim();
  }

  function requestToText(req) {
    return [
      `Request ID: ${req.id}`,
      `Created: ${new Date(req.createdAt).toLocaleString()}`,
      `Location: ${[req.location.city, req.location.county].filter(Boolean).join(', ')}`,
      `Car: ${[req.car.make, req.car.model, req.car.year].filter(Boolean).join(' ')}`,
      `Category: ${req.category || ''}`,
      `Urgency: ${req.urgency || ''}`,
      `Contact: ${req.contact || ''}`,
      `Phone: ${req.phone || ''}`,
      `Description: ${req.description || ''}`
    ]
      .filter(Boolean)
      .join('\n');
  }

  async function copySelectedRequest() {
    const id = state.lastSelectedRequestId;
    const req = (state.requests || []).find((r) => r.id === id);
    if (!req) {
      toast('Nothing to copy');
      return;
    }
    const ok = await copyText(requestToText(req));
    toast(ok ? 'Copied request' : 'Copy failed');
  }

  // ------------------------- utilities -------------------------
  function cssEscape(v) {
    if (window.CSS && CSS.escape) return CSS.escape(v);
    return String(v).replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatRelative(iso) {
    const t = Date.parse(iso || '');
    if (!Number.isFinite(t)) return '';
    const diff = Date.now() - t;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'now';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
  }

  // ------------------------- events -------------------------
  function onClick(e) {
    const el = e.target.closest('[data-action], [data-route]');
    if (!el) return;

    if (el.dataset.route) {
      e.preventDefault();
      navigate(el.dataset.route);
      return;
    }

    const action = el.dataset.action;

    if (action === 'toggle-theme') {
      toggleTheme();
      return;
    }

    if (action === 'dismiss-toast') {
      dismissToast();
      return;
    }

    if (action === 'open-dialog') {
      openDialog(el.dataset.dialog, el);
      return;
    }

    if (action === 'close-dialog') {
      closeDialog(el.dataset.dialog);
      return;
    }

    if (action === 'copy-number') {
      const num = el.dataset.number || el.getAttribute('data-number') || '';
      copyText(num).then((ok) => toast(ok ? 'Copied number' : 'Copy failed'));
      return;
    }

    if (action === 'open-request') {
      const id = el.dataset.requestId;
      openRequestDetail(id, el);
      return;
    }

    if (action === 'copy-request') {
      copySelectedRequest();
      return;
    }

    if (action === 'request-help') {
      navigate('request');
      return;
    }

    if (action === 'go-home') {
      navigate('home');
      return;
    }
  }

  function onSubmit(e) {
    const form = e.target;
    const requestForm = getRequestForm();
    if (!requestForm || form !== requestForm) return;

    e.preventDefault();
    clearErrors(form);

    const region = ensureErrorRegion(form);
    const errors = validateSection(form, form);

    if (errors.length) {
      const first = errors[0].field;
      if (region) {
        region.hidden = false;
        region.textContent = `Please fix ${errors.length} field${errors.length === 1 ? '' : 's'} before continuing.`;
      }
      if (first && first.focus) first.focus({ preventScroll: false });
      return;
    }

    const req = collectRequest(form);

    // Save to local "mock DB"
    state.requests = Array.isArray(state.requests) ? state.requests : [];
    state.requests.push(req);
    saveState();

    // Match
    const matches = matchMechanics(req);
    lastMatch = { requestId: req.id, mechanics: matches };

    // Render + route
    renderResults(matches);
    toast('Request received');
    navigate('results');

    // keep form ready for next request
    try { form.reset(); } catch { /* ignore */ }
  }

  function onKeydown(e) {
    if (e.key === 'Escape' && activeDialog) {
      e.preventDefault();
      closeDialog();
      return;
    }
    trapFocus(e);
  }

  // ------------------------- init -------------------------
  function init() {
    setTheme(state.theme);

    doc.addEventListener('click', onClick, { passive: false });
    doc.addEventListener('submit', onSubmit, { passive: false });
    doc.addEventListener('keydown', onKeydown, { passive: false });

    window.addEventListener('hashchange', onRouteChange);

    // optional JSON load (non-blocking)
    tryLoadMechanics().finally(() => {
      // initial route
      const initial = getRoute() || state.lastRoute || 'home';
      if (!location.hash) location.hash = `#${initial}`;
      showRoute(getRoute());
      renderInbox();
    });
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

/* js/app.min.js */
/* (minified version is provided in the chat response) */