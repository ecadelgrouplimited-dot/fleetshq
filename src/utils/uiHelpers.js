// ─────────────────────────────────────────────────────────────────────────────
// uiHelpers — Phase A (dashboard redesign)
//
// HTML-returning helpers exposed as view locals (like `esc` / `formatDate`).
// Our EJS views build their body as a template-literal string, so reusable
// "partials" are implemented as functions that return safe HTML strings rather
// than as `<%- include %>` partials.
//
// Everything that interpolates user data goes through `esc` to stay XSS-safe.
// ─────────────────────────────────────────────────────────────────────────────
const { esc } = require('./escapeHtml');

// Deterministic avatar tint from a string (name), so a given person keeps the
// same colour across the app. Returns one of a fixed, theme-friendly palette.
const AVATAR_TINTS = [
  ['#2563eb', '#dbeafe'], // blue
  ['#0891b2', '#cffafe'], // cyan
  ['#7c3aed', '#ede9fe'], // violet
  ['#db2777', '#fce7f3'], // pink
  ['#ea580c', '#ffedd5'], // orange
  ['#16a34a', '#dcfce7'], // green
  ['#ca8a04', '#fef9c3'], // amber
  ['#0d9488', '#ccfbf1'], // teal
];

function tintFor(str) {
  const s = String(str || '');
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * avatar — circular driver/person avatar.
 * Renders the uploaded photo when `photoStorageKey` is present (served via the
 * authenticated /employees/:id/photo route), otherwise a tinted initials chip.
 *
 * @param {object} person  { id, fullName, photoStorageKey }
 * @param {object} [opts]  { size = 36, withName = false, sub = '' }
 */
function avatar(person, opts = {}) {
  const size = opts.size || 36;
  const name = (person && person.fullName) || opts.name || '';
  const fontSize = Math.max(10, Math.round(size * 0.36));
  let chip;
  if (person && person.photoStorageKey && person.id) {
    chip = `<img class="ui-avatar-img" src="/employees/${esc(person.id)}/photo" alt="${esc(name)}" width="${size}" height="${size}" loading="lazy" style="width:${size}px;height:${size}px">`;
  } else {
    const [fg, bg] = tintFor(name);
    chip = `<span class="ui-avatar-fallback" style="width:${size}px;height:${size}px;font-size:${fontSize}px;color:${fg};background:${bg}">${esc(initialsOf(name))}</span>`;
  }
  if (!opts.withName) return `<span class="ui-avatar" style="width:${size}px;height:${size}px">${chip}</span>`;
  const sub = opts.sub ? `<span class="ui-avatar-sub">${esc(opts.sub)}</span>` : '';
  return `<span class="ui-avatar-row">
    <span class="ui-avatar" style="width:${size}px;height:${size}px">${chip}</span>
    <span class="ui-avatar-meta"><span class="ui-avatar-name">${esc(name)}</span>${sub}</span>
  </span>`;
}

/**
 * vehicleThumb — rounded-rect vehicle photo thumbnail.
 * Uses the uploaded image (served via /fleet/:id/photo) or a generic truck
 * silhouette placeholder.
 *
 * @param {object} vehicle { id, registration, imageStorageKey }
 * @param {object} [opts]  { size = 44 }
 */
function vehicleThumb(vehicle, opts = {}) {
  const size = opts.size || 44;
  const reg = (vehicle && vehicle.registration) || '';
  if (vehicle && vehicle.imageStorageKey && vehicle.id) {
    return `<span class="ui-vthumb" style="width:${size}px;height:${size}px"><img src="/fleet/${esc(vehicle.id)}/photo" alt="${esc(reg)}" loading="lazy" style="width:${size}px;height:${size}px"></span>`;
  }
  // Inline truck silhouette so an empty fleet still looks intentional.
  return `<span class="ui-vthumb ui-vthumb-empty" style="width:${size}px;height:${size}px" title="${esc(reg)}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="${Math.round(size * 0.55)}" height="${Math.round(size * 0.55)}"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 19a2 2 0 100-4 2 2 0 000 4zM18 19a2 2 0 100-4 2 2 0 000 4z"/></svg>
  </span>`;
}

/**
 * kpiDelta — a small trend pill comparing current vs a prior period.
 * Positive = green ▲, negative = red ▼, zero = neutral. `invert: true` flips the
 * colour semantics for metrics where down is good (e.g. defects, overdue items).
 *
 * @param {number} current
 * @param {number} previous
 * @param {object} [opts] { suffix = '', label = 'vs last period', invert = false, pct = false }
 */
function kpiDelta(current, previous, opts = {}) {
  const cur = Number(current) || 0;
  const prev = Number(previous) || 0;
  const diff = cur - prev;
  const label = opts.label || 'vs last period';
  let dir = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
  // good/bad tone (independent of direction when inverted)
  let tone = 'flat';
  if (diff !== 0) {
    const positiveIsGood = !opts.invert;
    const isGood = diff > 0 ? positiveIsGood : !positiveIsGood;
    tone = isGood ? 'good' : 'bad';
  }
  const arrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '—';
  let magnitude;
  if (opts.pct) {
    const base = prev === 0 ? (cur === 0 ? 0 : 100) : Math.abs((diff / prev) * 100);
    magnitude = `${base.toFixed(0)}%`;
  } else {
    magnitude = `${Math.abs(diff)}${opts.suffix || ''}`;
  }
  return `<span class="ui-delta ${tone}"><span class="ui-delta-arrow">${arrow}</span>${esc(magnitude)} <span class="ui-delta-label">${esc(label)}</span></span>`;
}

/**
 * expiryClass — CSS class for a compliance date based on how soon it expires.
 * Returns 'expired' | 'soon' | 'ok' | '' (no date). Pair with .ui-date-* CSS.
 *
 * @param {Date|string|null} date
 * @param {number} [soonDays=30]
 */
function expiryClass(date, soonDays = 30) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (days < 0) return 'expired';
  if (days <= soonDays) return 'soon';
  return 'ok';
}

/**
 * expiryDate — formatted date wrapped in a colour-coded span + a "(N days)" hint.
 * @param {Date|string|null} date
 * @param {object} [opts] { fmt = formatDate, soonDays = 30, showDays = true }
 */
function expiryDate(date, opts = {}) {
  if (!date) return '<span class="ui-date">—</span>';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '<span class="ui-date">—</span>';
  const cls = expiryClass(d, opts.soonDays || 30);
  const fmt = opts.fmt || ((x) => new Date(x).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
  const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
  let hint = '';
  if (opts.showDays !== false) {
    hint = days < 0 ? `(${Math.abs(days)}d overdue)` : days === 0 ? '(today)' : `(${days}d)`;
  }
  return `<span class="ui-date ui-date-${cls}">${esc(fmt(d))}${hint ? ` <span class="ui-date-hint">${esc(hint)}</span>` : ''}</span>`;
}

/**
 * sparkline — tiny inline SVG line chart for trend cells/cards.
 * @param {number[]} values
 * @param {object} [opts] { width = 80, height = 24, color = 'var(--primary)' }
 */
function sparkline(values, opts = {}) {
  const data = (values || []).map((v) => Number(v) || 0);
  const w = opts.width || 80;
  const h = opts.height || 24;
  const color = opts.color || 'var(--primary)';
  if (data.length < 2) {
    return `<svg class="ui-spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"></svg>`;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = w / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = i * stepX;
    const y = h - 2 - ((v - min) / span) * (h - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = pts[pts.length - 1].split(',');
  return `<svg class="ui-spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="1.8" fill="${color}"/>
  </svg>`;
}

module.exports = { avatar, vehicleThumb, kpiDelta, expiryClass, expiryDate, sparkline, initialsOf };
