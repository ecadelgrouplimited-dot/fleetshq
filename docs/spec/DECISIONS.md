# Decision Log

Authoritative record of product/architecture decisions. Newest first. Supersedes the "Open questions"
sections in the spec docs where they conflict.

---

## 2026-06-19 — Foundational decisions (client)

| # | Decision | Choice | Impact |
|---|----------|--------|--------|
| D1 | **Build starting point** | **P0 Foundations** | Light/dark theming, panel-scoped roles + nav shell, public site refresh, Super Admin (tenants/users/company/branches) lead. Reuses the existing app; everything depends on these. |
| D2 | **Tenancy model** | **Multi-tenant SaaS** | The platform is sold to multiple operators. **Every domain entity is scoped by `Tenant`** from day one. Adds: tenant provisioning/onboarding, per-tenant data isolation, per-tenant branding/config/billing, a **platform-level Super Admin** (manages tenants) distinct from a **tenant Admin** (manages one operator). |
| D3 | **Payments scope (first release)** | **Invoice-only** | Generate/send invoices + record payments manually; close the shipment→cash loop without a live gateway. Card/gateway payments deferred to a later phase. |

### Consequences of D2 (multi-tenant) to apply across the spec
- **Data model (`02`):** introduce `Tenant` as the top of the hierarchy: `Tenant ─< Company/Branch ─< (Users, Vehicles, Shipments, …)`. (For a simple operator a Tenant may have one Company.) Add `tenantId` to every domain table; enforce tenant scoping in a global query layer/middleware. Back-fill existing live data into a **default tenant**.
- **Roles (`01`):** add **Platform Super Admin** (cross-tenant: provision tenants, platform config, billing) above the per-tenant **Admin**. All other roles are tenant-scoped.
- **Super Admin panel (`05`):** gains a **platform/tenant management** layer (create/suspend tenants, per-tenant plan/branding) in addition to the per-tenant settings already specced.
- **Theming/branding (`03`):** branding is **per tenant** (logo, accent, email/invoice header).
- **Security:** tenant isolation is a hard boundary — no query may cross tenants except platform-admin tooling. Add tenant-scoping tests.

### Still open (revisit before the relevant phase)
- Per-tenant **billing/subscription** model (plans, metering) — needed before go-to-market, not for P0 internal use.
- Tenant **onboarding/self-signup** vs. platform-admin-provisioned — *assume platform-admin-provisioned for now.*
- Payment **gateway** choice for the later card-payments phase.
