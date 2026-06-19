# 04 — Public Site / Landing

> **Status:** 🟡 Partial — a cinematic landing already exists at `/welcome` (hero, stakes, system,
> pillars, audit, score, ECADEL credit). This spec **expands it into a full public marketing site** with
> the pages the new vision lists, repositioned around the **logistics platform** (not just compliance),
> and adds the **loading screen + light/dark toggle**.
> **Primary users:** prospective customers, prospective operators, recruits, the public. Pre-login.

---

## 1. Purpose

Sell the platform and the company before anyone signs in. The new vision is explicit: *"This must come
before the login / sign in."* The site must (a) explain what 256 Logistics does, (b) build trust, (c)
route the right person to the right door (Client sign-in, staff sign-in, "Book a shipment", "Track a
parcel", "Careers", "Contact"), and (d) carry the ECADEL signature.

---

## 2. Navigation & pages

Sticky translucent top nav on every public page: **brand · Services · About · Contact · Track ·
[theme toggle] · Sign in · Get a quote (CTA)**.

| # | Page / section | Route | Status |
|---|----------------|-------|--------|
| 1 | **Loading screen** (logo + app name, brief) | overlay on first load | 🔴 |
| 2 | **Home** (hero, what-we-do, highlights, CTA) | `/` (pre-login) → `/welcome` | 🟡 reposition |
| 3 | **Mission & Vision** | `/about#mission` or section | 🔴 |
| 4 | **About us** | `/about` | 🔴 |
| 5 | **Services** | `/services` | 🔴 |
| 6 | **Contact us** | `/contact` | 🔴 |
| 7 | **Track a shipment** (public tracking by ref) | `/track` | 🔴 |
| 8 | **Footer** (links, legal, ECADEL credit) | global | 🟡 |
| — | Privacy / legal | `/privacy` | 🟢 |

> Routing note: today, an unauthenticated `/` redirects to `/welcome`. Keep the public site as the
> front door; the landing becomes the **Home** page of a multi-page public site.

---

## 3. Page specs

### 3.1 Loading screen
- Full-screen brand splash: 256 Logistics logo + name, subtle animated mark, ≤1.5s or until first
  paint ready; respects reduced-motion (instant). Themed.

### 3.2 Home
- **Hero:** headline on the *logistics platform* value ("Run your whole operation in one place" —
  booking, dispatch, fleet, people, finance, compliance), sub-copy, primary CTA **Get a quote** +
  secondary **Track a shipment** / **Sign in**. Cinematic background (reuse orbs/grid + an SVG of the
  shipment spine / a delivery scene).
- **What we do** — the platform in 3–5 pillars (Deliver, Operate, Maintain, Comply, Grow) with custom
  SVG icons. Reuse the existing pillar pattern but reframed from compliance-only to the full platform.
- **For whom** — Customers (book & track), Operators (run the business), Drivers (work the jobs).
- **Trust strip** — UK HGV compliance, DVSA/Home-Office ready, secure, audit-grade.
- **CTA band** + ECADEL credit band + footer.

### 3.3 Mission & Vision
- Short, confident statements. Mission (what we do daily) + Vision (where it's going). Themed cards.

### 3.4 About us
- The company story, what makes 256 different (one connected system), leadership/credibility, the
  ECADEL build partnership. Optional stats (fleet size, deliveries, on-time %).

### 3.5 Services
- The service catalogue that mirrors **ServiceType** in pricing: same-day, next-day, economy, pallet/
  freight, courier, returns, scheduled/contract logistics. Each: what it is, who it's for, CTA to quote.
- Mirrors what the Client Portal can actually book — keep in sync with pricing config.

### 3.6 Contact us
- Contact form (name, email, phone, company, message, enquiry type) → creates a **lead/ticket**, sends
  email via the notification service. Office address, phone, hours, map, and role-routed links
  (sales / support / careers).

### 3.7 Track a shipment (public)
- Single input: tracking reference (+ optional postcode for privacy). Shows the **tracking timeline**
  and current status/ETA without login. Reuses the Shipment TrackingEvent timeline (`07`,`08`).

### 3.8 Footer
- Columns: Platform (Services, Track, Sign in, Get a quote), Company (About, Mission, Careers, Contact),
  Legal (Privacy, Terms), Social. **ECADEL credit signature** + copyright.

---

## 4. Behaviours

- **Theme toggle** in nav; persists; default to system. Works on every public page.
- **Lead capture** (Contact + Get a quote) writes to a leads table and notifies sales.
- **SEO:** server-rendered, per-page titles/meta/OG tags, sitemap, fast first paint.
- **Analytics** hook (configurable in Super Admin → System Config).
- **Responsive** + reduced-motion (already patterned on the landing).

---

## 5. Permissions
Public (no auth). Contact/quote forms are rate-limited + CSRF-protected (patterns already in place).

## 6. MVP vs later
- **MVP (P0):** Home (repositioned), About+Mission, Services, Contact (+lead), Footer, loading screen,
  theme toggle, public Track stub.
- **Later:** Careers/recruitment public pages (feeds HR), live quote calculator on the public site,
  blog/news, multi-language.

## 7. Open questions
- Is there a **public self-serve quote calculator**, or does "Get a quote" route to sign-up/contact for
  MVP? *(Assume contact/sign-up in MVP; live calculator later.)*
- Careers page now or later? *(Later; HR recruitment is internal first.)*

*Next: [05 — Super Admin Panel](05-panel-super-admin.md)*
