# 03 — Design System & Theming

> The visual language for the whole platform, and the **light/dark theming** requirement that affects
> every screen. Builds on what already exists: the macOS app aesthetic (`public/css/app.css`), the
> cinematic public/landing language, and the ECADEL gold maker's signature.

---

## 1. Two surfaces, one family

| Surface | Language | Where |
|---------|----------|-------|
| **Public site** | Cinematic, dark navy, ambient orbs + grid, animated SVG, big type | `04` landing, marketing pages |
| **App panels** | macOS desktop app — frosted sidebar, clean content, cards, tables, charts | `05`–`14` |

They share **tokens, palette, type, and the ECADEL signature**, so moving from the marketing site into
the app feels like one product. The public site leans expressive; the panels lean calm and dense.

---

## 2. Light & dark theme (platform requirement)

**Every screen must support light and dark.** This is explicit in the new vision
("Light and dark theme that affects all the app system").

### Mechanics
- Implement with **CSS custom properties** on `:root`, switched by a `data-theme="light|dark"` attribute
  on `<html>`.
- **Persisted preference:** user's choice saved (User.themePreference) + a cookie for instant
  first-paint; default to **system** (`prefers-color-scheme`) until the user chooses.
- **Toggle** lives in the top bar of every panel and in the public-site nav. Switching is instant, no
  reload, no flash (set the attribute before first paint from the cookie).
- Charts, maps, and SVG art read theme tokens (no hard-coded hex in components).

### Token sets (illustrative — finalise in `app.css`)

| Token | Light | Dark |
|-------|-------|------|
| `--bg` | `#f0f4f8` | `#0a1424` |
| `--surface` (card) | `#ffffff` | `#0f1d35` |
| `--surface-2` | `#f8fafc` | `#13233f` |
| `--text` | `#0f172a` | `#e8eef6` |
| `--text-muted` | `#64748b` | `#93a4bd` |
| `--border` | `#e2e8f0` | `rgba(148,163,184,.16)` |
| `--primary` | `#2563eb` | `#3b82f6` |
| `--sidebar` | frosted navy (already dark) | deeper navy |

The **sidebar is already dark** in both themes (it's the app's anchor); the **content area** is what
flips. Semantic colours (success/warning/danger/notice/info) keep hue, adjust luminance per theme.

### Rule for new CSS
> No component may hard-code a background/text/border colour. Always use a token. A screen is "done"
> only when it has been viewed in **both** themes with no contrast failures.

---

## 3. Palette

- **Brand:** navy `#0a1628`, primary blue `#2563eb` / light `#3b82f6`, info cyan `#06b6d4`,
  success green `#10b981`.
- **Status / traffic-light:** red `#ef4444`, amber `#f59e0b`, green `#10b981` — the compliance and
  shipment-status language.
- **ECADEL signature (maker's mark only):** gold gradient `#fde68a → #f59e0b → #b45309`. Reserved for
  the ECADEL credit; never a product UI accent.

---

## 4. Typography

- **App:** system stack (`-apple-system, 'SF Pro Text', 'Inter', 'Segoe UI'`) — crisp, dense, native.
- **Public site:** **Inter** (300–900) for expressive headings.
- Scale: page title 26px/800, section 18–21px/700, body 13.5–15px, micro 11–12px. Tabular numerals for
  data tables and money.

---

## 5. Core components (shared library)

Already built (reuse): `.card`, `.stat-card` (gradient top-accent), `.btn` (primary/outline/ghost),
`.badge`, `.form-control`, `.table`, `.page-head` (+ eyebrow w/ pip), sidebar shell + mobile drawer,
`.empty-state`, `.alert-item`, dashboard hero (orb+grid+gauge), Chart.js wrappers
(`.dashboard-canvas-wrap` fixed-height rule).

To add for the platform:
- **Data table pro** — sortable, filterable, paginated, column-stick on mobile, row actions, bulk
  select, CSV/PDF export. (The booking lists, shipment lists, invoices, fleet lists all need it.)
- **Status pill** — shipment lifecycle states with consistent colour mapping.
- **Timeline** — tracking events / audit trail (a timeline component already exists; generalise).
- **Stepper / wizard** — booking flow, onboarding, import (import wizard exists; generalise).
- **Map panel** — live shipments/drivers (Dispatcher) + tracking (Client). Theme-aware tiles.
- **Kanban / board** — dispatch allocation, recruitment pipeline.
- **Signature pad + OTP entry + camera capture** — driver POD.
- **KPI tile + sparkline** — executive dashboards.
- **Panel switcher** — for multi-role users.
- **Theme toggle**, **notification bell + drawer**, **command palette** (the `/` spotlight exists).

Every new component ships **theme-aware** and **responsive** (the `.main { min-width:0 }` +
`.table-wrap` scroll rule is mandatory to avoid overflow).

---

## 6. Layout & navigation

- **Shell:** frosted dark sidebar (panel nav, grouped sections, role-aware) + translucent top bar
  (search, theme toggle, notifications, user/panel switcher) + content area. Already built; extend
  nav groups per panel.
- **Public site:** sticky translucent nav (brand + theme toggle + Sign in), full-bleed sections,
  ECADEL credit band + footer.
- **Responsive:** ≤900px sidebar → hamburger drawer; wide tables scroll; Driver panel is **mobile-first**.
- **Density:** comfortable default; a compact toggle for data-heavy ops screens (later).

---

## 7. Motion & feel

- Calm, purposeful: 150–220ms ease transitions; scroll-reveal on the public site; subtle hover lifts on
  cards; animated gauges/KPIs that count up once in view; the eyebrow **pip** pulse as the signature
  motif. Respect `prefers-reduced-motion` everywhere (already done on the public site).

---

## 8. The ECADEL signature

- The gold maker's seal (`/img/ecadel-mark.svg`) + "Developed & managed by ECADEL GROUP LIMITED"
  appears: public footer band, login, privacy, and the **app sidebar footer** (already shipped). It
  stays consistent across the platform. Gold is reserved for this mark only.

---

## 9. Accessibility

- WCAG AA contrast in **both** themes. Focus-visible rings. Keyboard-navigable nav, tables, and the
  booking/POD flows. Form labels + error text (already patterned). Hit targets ≥40px on Driver/mobile.

---

## 10. Deliverables for P0

1. `data-theme` switching + token sets in `app.css`, no-flash first paint, persisted preference.
2. Theme toggle in app top bar + public nav.
3. Audit existing components for hard-coded colours → tokens.
4. Extend nav shell to render **panels** + panel switcher.
5. Add the shared **data-table pro** + **status pill** + **theme-aware Chart.js** defaults.

*Next: [04 — Public Site / Landing](04-public-site.md)*
