# FLEET.HQ — Self-Serve Onboarding, Subscriptions & Client Sovereignty — Implementation Plan

**Status:** Phases 0–1 built (2026-07-17): SMTP live, `/register` flow with email
verification codes, tier selection, Platform Admin review queue, `provisionTenant()`
service. Activation is currently manual (payment confirmed by team → Activate).
Phase 2 (Stripe checkout + automated activation) awaits pricing + gateway sign-off (§10).
**Date:** 2026-07-17
**Source:** Client brief (onboarding & registration, subscription & payment gateway, client sovereignty & control)
**Sender for verification codes:** `alerts@fleetshq.com` (mailbox being set up manually; DNS ready)

---

## 1. What the client asked for (restated)

1. **Onboarding & Registration** — companies self-register on the portal (company name,
   registration ID, contact info, fleet size, operational region); FLEET.HQ rapidly
   validates the credentials before the account is considered authentic.
2. **Subscription & Payment** — tier selection by fleet scale; **mandatory prepaid annual
   licence**; payment in full before the backend is provisioned; multi-year discounts;
   **automated activation** ("Environment Deployment") on confirmed funds.
3. **Client Sovereignty & Control** — each company gets a **siloed environment**; a dedicated
   **Admin Control Panel**; full self-service over their own data (drivers, routes, pricing);
   ability to trigger internal updates/patches once the dev team pushes improvements.

---

## 2. Where we are today (current state)

| Capability | Today |
|---|---|
| Multi-tenancy | ✅ Row-level: every model carries `tenantId`, scoped in `src/config/database.js`. One shared Node app + one PostgreSQL DB |
| Tenant onboarding | ✅ **Manual only** — Platform Admin (`/platform/onboard`, super_admin/director) creates tenant + company + branch + admin user with temp password |
| Tenant model | `Tenant { name, slug, plan: "starter", status: active\|suspended\|trial, branding, contact fields }` — `plan` is a free string, nothing enforces it |
| Payments / billing | ❌ Nothing — no models, no gateway, no invoices |
| Public registration | ❌ None — no `/register`; sign-in only |
| Email | ✅ `src/services/mail.service.js` (nodemailer) — safe no-op until `SMTP_*` env is set. `alerts@fleetshq.com` mailbox pending manual creation; MX/SPF/DKIM/DMARC already live on fleetshq.com |
| First-login flow | ✅ `mustChangePassword` forced password change exists (reusable for provisioned admins) |
| Scheduled jobs | ✅ node-cron in-app (daily alerts) — reusable for renewal/dunning jobs |

**Gap summary:** we have solid tenant plumbing and a manual concierge flow; everything
public-facing (registration, verification, payment, automated provisioning, billing
self-service) is new build.

---

## 3. Architecture decision: what "siloed instance" means

The brief says *"each company receives a siloed instance"* and *"private instance."*
Two honest interpretations:

**Option A — Logical isolation (recommended, phase 1–4).**
Keep the single app + single DB with strict row-level tenancy (what we have). Each tenant
experiences a private environment: own users, branding, data, subdomain-style entry later
if desired. This is how the vast majority of B2B SaaS ("private instance" in marketing
terms) actually ships.
*Pros:* one deploy, one DB to back up, features land for everyone, cheap to run on the
current KVM 4 VPS. *Cons:* isolation is enforced in code, not infrastructure; "version
control per client" is limited to feature flags (see §7).

**Option B — Physical isolation (defer; price it as Enterprise).**
Per-tenant containerised app + DB (Docker per tenant, or schema-per-tenant). True
infrastructure silo and true per-tenant versioning.
*Pros:* matches the brief literally; sellable as a premium tier. *Cons:* order-of-magnitude
more ops (provisioning, migrations × N, backups × N, monitoring × N); the current VPS
could host only a handful; automated "environment deployment" becomes real infra work.

**Recommendation:** build everything in this plan on **Option A**, wording the product as
"private environment." Keep the provisioning step behind a single `provisionTenant()`
service function so an Option B backend can be swapped in later for an Enterprise tier
without reworking registration/billing. **Needs client sign-off.**

---

## 4. Feature area 1 — Self-serve registration & verification

### Flow

```
/register (public)
  → collect: company name, company registration ID (Companies House no.),
    contact name/email/phone, fleet size band, operational region
  → create RegistrationRequest (status: pending_verification)
  → email 6-digit code from alerts@fleetshq.com
/register/verify
  → code correct → status: verified → redirect to tier selection (§5)
```

### Verification ("rapid validation of provided credentials")

Two layers, in order of increasing effort:

1. **Email ownership (must-have):** 6-digit numeric code, 15-min expiry, max 5 attempts,
   resend throttled (60s + max 3/hour). Codes stored hashed. This is the "verification
   codes via alerts@fleetshq.com" the client mentioned.
2. **Company authenticity (should-have, UK-specific):** validate the Registration ID
   against the **Companies House API** (free, needs an API key) — check the company
   exists, is active, and the name roughly matches. Store the lookup result on the
   request. Failures don't hard-block: they flag the request for **manual review** in
   Platform Admin (`/platform` gets a "Pending registrations" queue with approve/reject).
   This keeps "rapid validation" true without turning sales away on a typo.

### Data model (new)

```prisma
model RegistrationRequest {
  id            String   @id @default(uuid())
  companyName   String
  companyRegNo  String?          // Companies House number
  contactName   String
  contactEmail  String
  contactPhone  String?
  fleetSize     String           // band: "1-5" | "6-20" | "21-50" | "50+"
  region        String
  status        RegistrationStatus @default(pending_verification)
  // pending_verification | verified | pending_payment | provisioned | rejected | expired
  chLookup      Json?            // Companies House validation snapshot
  tenantId      String?          // set on provisioning
  createdAt / updatedAt / verifiedAt / provisionedAt
}

model VerificationCode {
  id        String   @id @default(uuid())
  requestId String   // or polymorphic target later (password reset reuse)
  codeHash  String
  attempts  Int      @default(0)
  expiresAt DateTime
  usedAt    DateTime?
}
```

### Abuse controls

- Rate-limit `/register` + `/register/verify` per IP (existing `express-rate-limit` pattern).
- Reject disposable-email domains (small static blocklist to start).
- CAPTCHA only if abuse actually appears (don't add friction speculatively).
- All public forms behind existing CSRF middleware.

---

## 5. Feature area 2 — Subscription tiers & payment

### Tiers (placeholder — **pricing needs client input**)

| Tier | Fleet size | Annual price | Notes |
|---|---|---|---|
| Starter | 1–5 vehicles | £TBD | |
| Growth | 6–20 | £TBD | |
| Scale | 21–50 | £TBD | |
| Enterprise | 50+ | Custom / invoice | candidate for Option B silo later |

- **Billing model:** prepaid annual only (per brief). No monthly.
- **Multi-year:** 2-year and 3-year prepay at a discount (suggest 10% / 15%, **TBD**).
- Tier + pricing definitions live in code/config (a `plans.js` catalogue), not hardcoded
  in views; `Tenant.plan` stops being a free string and references the catalogue key.

### Payment gateway

**Recommendation: Stripe Checkout** (hosted page) + webhooks.

- Prepaid annual = a Stripe **subscription with yearly interval** (gives us renewal
  invoicing, card-on-file, dunning emails for free) — or one-off `payment` mode invoices
  if the client prefers manual renewals. Start with subscription-yearly; it automates §6
  renewals.
- Multi-year = separate Prices (2y/3y) or a discount Coupon at checkout.
- Webhook endpoint `/webhooks/stripe` (raw-body route, signature-verified, **outside**
  CSRF + auth middleware) handles `checkout.session.completed`,
  `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`.
- Alternative if the client wants VAT/merchant-of-record handled for them: **Paddle**.
  Decision point before Phase 2 starts — swapping later is expensive. Bank-transfer/manual
  invoicing for Enterprise can be recorded through Platform Admin ("mark as paid").

### Data model (new)

```prisma
model Subscription {
  id            String   @id @default(uuid())
  tenantId      String   @unique
  plan          String                 // catalogue key
  status        SubscriptionStatus     // pending | active | past_due | suspended | cancelled
  termYears     Int      @default(1)
  currentPeriodStart / currentPeriodEnd DateTime
  stripeCustomerId / stripeSubscriptionId String?
  payments      Payment[]
}

model Payment {
  id             String   @id @default(uuid())
  subscriptionId String
  amountPence    Int
  currency       String  @default("gbp")
  status         String                 // paid | failed | refunded
  stripeInvoiceId / stripePaymentIntentId String?
  paidAt         DateTime?
  invoiceUrl     String?                // Stripe-hosted invoice PDF
}
```

### Automated activation ("Environment Deployment")

On `checkout.session.completed` (funds confirmed):

1. `provisionTenant(registrationRequest, plan)` — single service function
   (`src/services/provisioning.service.js`) that wraps what `/platform/onboard` does
   today: create Tenant (status `active`) + Company + head-office Branch + admin User
   (temp password, `mustChangePassword: true`) inside one transaction.
2. Create `Subscription` (active, period = term) linked to the tenant.
3. Send welcome email from `alerts@fleetshq.com`: sign-in URL, admin email, temp
   password, invoice link.
4. Mark `RegistrationRequest` provisioned.
5. If any step fails after payment: request goes to a **failed-provisioning queue**
   visible in Platform Admin; never leave a paid customer silently stuck.

The existing manual `/platform/onboard` flow **stays** — refactored to call the same
`provisionTenant()` — for concierge/Enterprise deals.

### Lifecycle (renewals, suspension)

- Nightly cron (reuse existing scheduler): warn at T-30/T-14/T-3 before
  `currentPeriodEnd` (email director + platform admin).
- `invoice.payment_failed` → status `past_due`, grace period (suggest 14 days, **TBD**).
- Grace expired → `Tenant.status = suspended` — sign-in shows "subscription expired"
  screen (data retained, nothing deleted). Reactivation on payment is automatic via
  webhook.
- Data retention after cancellation: propose 90 days then anonymise/export — **needs
  client decision** (GDPR-relevant).

---

## 6. Feature area 3 — Client sovereignty & Admin Control Panel

Mostly **already true** in the product (tenant users manage their own employees, drivers,
fleet, documents). What's genuinely new:

1. **Tenant Admin Control Panel** (`/admin` or extend existing director views) —
   one place for the tenant's director to manage:
   - Company profile & **branding** (`Tenant.branding` / `Company.branding` exist but
     have no self-service UI — logo, accent colour, public name).
   - **Users & roles** (exists in `/users` — link it in).
   - **Local pricing configurations** — tenant-scoped rate cards (per-mile / per-drop /
     zone rates) stored in `SystemConfig` (already tenant-scoped) or a small
     `RateCard` model. *Scope check: the brief mentions "delivery routes and local
     pricing" — routes exist in the shipment spine; pricing config is new.*
   - **Billing & subscription page** — current plan, term, renewal date, payment
     history, invoice downloads (Stripe-hosted URLs), "contact us to upgrade" (automated
     mid-term upgrades with proration are out of scope for v1 — **flag to client**).
2. **Suspension-aware UX** — banner when subscription is in grace; lock screen when
   suspended.

---

## 7. Feature area 4 — "Self-managed updates / version control"

The brief: *clients trigger internal system updates or configuration patches via their
dashboard once the core dev team pushes improvements to the main branch.*

**Reality on Option A (shared instance):** a deploy updates everyone simultaneously;
clients cannot literally hold back or pull versions. What we can honestly deliver:

- **Release channel per tenant** — new features ship behind **feature flags**
  (`Tenant.featureFlags Json`). Tenants on the "stable" channel see a **"What's new —
  updates available"** card in the Admin Control Panel and click **Apply updates** to
  enable the new feature set for their environment; "early access" channel gets them
  immediately. This gives the requested dashboard-triggered update experience.
- **Changelog / release notes** — a `Release` record per deploy (version, notes,
  flag keys) maintained by the dev team; powers the "updates available" UI.
- **Configuration patches** — tenant-scoped settings (branding, rate cards, alert
  thresholds) are already self-service; nothing blocks on us.

True per-tenant version pinning requires Option B (physical isolation) and is deferred
to an Enterprise tier decision. **This trade-off must be communicated to the client —
recommend positioning feature-flag channels as "controlled rollout."**

---

## 8. Email infrastructure (prerequisite for everything above)

- [ ] Mailboxes `alerts@fleetshq.com` + `director@fleetshq.com` created in hPanel (**user, manual**).
- [ ] Wire SMTP on the VPS `.env`: `SMTP_HOST=smtp.hostinger.com`, `SMTP_PORT=465`,
      `SMTP_SECURE=true`, `SMTP_USER=alerts@fleetshq.com`, `SMTP_PASS=…` →
      mail service lights up automatically (`src/services/mail.service.js`).
- [ ] Send a test message; check DKIM/SPF pass (headers) — DNS already in place.
- [ ] Minimal branded HTML email templates: **verification code**, **welcome /
      credentials**, **payment receipt**, **renewal reminder**, **suspension notice**.
      One shared layout helper; keep them plain-HTML (no external assets).

---

## 9. Delivery phases

| Phase | Scope | Depends on | Rough size |
|---|---|---|---|
| **0 — Email live** | SMTP wired, test send, base email template | mailboxes (manual) | ½ day |
| **1 — Registration + verification** | `/register`, `RegistrationRequest` + `VerificationCode` models & migration, code emails, rate limits, Companies House lookup, Platform Admin review queue | 0 | 3–5 days |
| **2 — Tiers + payment + auto-provisioning** | plan catalogue, Stripe Checkout, `/webhooks/stripe`, `Subscription`/`Payment` models, `provisionTenant()` extraction, welcome email, failed-provisioning queue | 1; **client: pricing + gateway sign-off** | 5–8 days |
| **3 — Lifecycle** | renewal reminders cron, grace/suspension flow, lock screen, reactivation | 2 | 2–3 days |
| **4 — Admin Control Panel** | tenant billing page + invoices, branding self-service, rate cards, suspension banners | 2 | 4–6 days |
| **5 — Release channels** | feature-flag plumbing, `Release` model, "What's new / Apply updates" UI | none (parallel after 0) | 2–3 days |

Each phase lands as its own migration + tests (registration flow, webhook handling with
Stripe CLI fixtures, provisioning transaction, suspension gate) and is deployable alone.

---

## 10. Open questions for the client (blockers marked ⚠)

1. ⚠ **Pricing:** actual £ per tier, fleet-size band boundaries, multi-year discount %.
2. ⚠ **Gateway:** Stripe acceptable? (Paddle if they want VAT handled; bank transfer for Enterprise?)
3. "Siloed instance": is logical isolation (Option A, §3) acceptable for launch, with
   physical silo reserved for Enterprise?
4. Failed Companies House validation: manual-review queue OK, or hard reject?
5. Grace period length on failed renewal (proposed 14 days) and data retention after
   cancellation (proposed 90 days).
6. Mid-term tier upgrades: manual/contact-us for v1?
7. Refund policy for the prepaid annual licence (needed for T&Cs and Stripe config).
8. Who is the merchant/legal entity on invoices — 256 Digital Technologies?

---

## 11. Explicitly out of scope (this plan)

- Physical per-tenant deployments (Option B) — revisit with Enterprise demand.
- Monthly billing, usage-based billing, in-app card capture (Stripe-hosted only).
- Custom domains per tenant / white-label subdomains (natural follow-on to branding).
- SMS verification (email codes only for v1).
