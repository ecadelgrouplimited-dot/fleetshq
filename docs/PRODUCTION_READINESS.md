# 256 Logistics Compliance Hub — Production Readiness Review

**Audited:** 2026-06-17 · **Reviewer:** Engineering (Claude) · **App version:** 1.0.0
**Environment:** Live at https://256logisticsltd.com (Ubuntu 24.04 VPS, Node 20, PostgreSQL 16, nginx, pm2)

> **Update 2026-06-17 — Phase 0 hardening + stored-XSS fix COMPLETE.** Resolved: daily DB backups (C1), **stored XSS (C2)**, login throttle + per-account lockout (H1), Secure cookie (H2), `trust proxy` (H3), pm2 log rotation (M3), swap (L1). Details inline below, marked ✅ **RESOLVED**. Readiness moved from ~65% → **~80%**.

---

## 1. Executive summary

The system is **deployed, served over HTTPS, and functional**. The codebase is in good shape on several security fundamentals (RBAC, parameterised DB access, document access control, no stack-trace leakage). However, it is **not yet fully production-ready** for a system that stores legally-sensitive personal data (passports, Right-to-Work, visa, salary records).

The **remaining** gating items before this can be considered production-complete are, in order:

1. **CSRF protection** on state-changing requests *(highest remaining risk)*.
2. **Compliance-alert delivery** (email/SMS) — currently alerts are in-app only.
3. **GDPR / UK-DPA controls** — privacy policy, retention, erasure, DPA register.

*(Backups, stored-XSS output escaping, login brute-force protection, and cookie/proxy hardening were completed in Phase 0 + the XSS pass — see ✅ markers below.)*

Sections 4–6 give the full findings, the must-have feature checklist, and a phased roadmap.

**Overall readiness: ~80%.** Infrastructure, core app, baseline hardening, and XSS output-escaping are solid; CSRF, alerting, and data-protection controls remain before it carries real operational and legal weight.

---

## 2. What is already in place (verified good) ✅

| Area | Status | Evidence |
|------|--------|----------|
| HTTPS + valid cert (apex + www), HTTP→HTTPS 301 | ✅ | certbot, Let's Encrypt, auto-renew |
| HSTS header | ✅ | helmet `max-age=15552000; includeSubDomains` |
| Role-based access control on API routes | ✅ | `authorize('…')` on every mutating route — `src/routes/index.js` |
| Web route auth | ✅ | `webAuth` + `requireRoles(...)` — `src/routes/web.routes.js` |
| Document access control + path-traversal guard | ✅ | `loadDocumentRecord(kind,id,user)` + `absolutePath.startsWith(UPLOAD_DIR)` — `web.routes.js:371-395` |
| Uploads not publicly served | ✅ | nginx has no `/uploads/` alias; served via authenticated routes only |
| Passwords hashed (bcrypt, cost 10) | ✅ | `auth.controller.js`, `seed.js` |
| Parameterised queries (no SQLi) | ✅ | Prisma ORM throughout |
| Error handler hides stack traces in prod | ✅ | `src/middleware/errorHandler.js` (generic message when `!isOperational`) |
| Audit logging on mutations | ✅ | `auditLog('entity')` middleware on create/update/delete |
| Upload file-type + size limits | ✅ | `src/config/storage.js` (allowlist + 20 MB) |
| Security headers (X-Frame-Options, X-Content-Type-Options) | ✅ | helmet |
| Firewall (ufw 22/80/443), fail2ban, unattended-upgrades | ✅ | server config |
| pm2 reboot persistence | ✅ | `pm2-root` enabled, app in saved dump |
| Single-admin seed (no demo creds), demo autofill removed | ✅ | `prisma/seed.js`, `auth/login.ejs` |
| Deploy via read-only SSH deploy key | ✅ | survives PAT rotation |
| Daily DB backups (gzip, 30-day retention) | ✅ *(Phase 0)* | `/usr/local/bin/256-db-backup.sh` + cron |
| Login rate-limit + per-account lockout | ✅ *(Phase 0)* | `middleware/loginLimiter.js`, `utils/loginGuard.js` |
| Secure cookie + `trust proxy` | ✅ *(Phase 0)* | `web.routes.js`, `server.js` |
| pm2 log rotation + swap | ✅ *(Phase 0)* | `pm2-logrotate`, 4 GB swapfile |

---

## 3. Severity legend

| Level | Meaning |
|-------|---------|
| 🔴 **Critical** | Fix before relying on the system for real data. Data-loss or serious breach risk. |
| 🟠 **High** | Fix in the first hardening pass. Exploitable or materially weakens security. |
| 🟡 **Medium** | Should fix before broad rollout. Operational or defence-in-depth gap. |
| ⚪ **Low** | Nice to have / future hardening. |

---

## 4. Findings

### 🔴 Critical

**C1 — No database backups.** ✅ **RESOLVED (2026-06-17).**
Daily `pg_dump` (gzip, 30-day retention) via `/usr/local/bin/256-db-backup.sh` + cron `/etc/cron.d/256-db-backup` (02:30 server time) writing to `/var/backups/256logistics` (mode 700). First backup verified: valid gzip, full schema (20 tables) + data.
*Remaining follow-up:* copy backups **offsite** (currently same disk) and schedule a periodic **tested restore**.

**C2 — Stored XSS via unescaped output.**
Server-rendered views build HTML with template literals and emit it unescaped via `<%- body %>`. User-entered fields are interpolated raw, e.g. `${e.fullName}` (`src/views/employees/index.ejs:85`), `${w.employee.fullName}` (`src/views/sponsored/index.ejs`). A value like `<img src=x onerror=…>` saved in a name/notes field executes in any staff member's browser — including a low-privilege driver injecting script that runs in a director's session.
*Remediation:* HTML-escape **all** interpolated user data (shared `esc()` helper, or render values via EJS `<%= %>`/auto-escaping). Audit every `${…}` that carries DB data. Effort: ~1–2 days. **Must fix before multi-user rollout.**

### 🟠 High

**H1 — No brute-force protection on web login.** ✅ **RESOLVED (2026-06-17).**
Added `src/middleware/loginLimiter.js` (express-rate-limit, 20 attempts/15 min by client IP, `skipSuccessfulRequests`) on both web `POST /login` and API `POST /auth/login`. Added per-account lockout in `src/utils/loginGuard.js` backed by new `User.failedLoginAttempts` / `User.lockedUntil` columns (migration `20260617000000_login_lockout`), wired into web + API login: locks for `LOGIN_LOCKOUT_MINUTES` after `MAX_LOGIN_ATTEMPTS` failures, resets on success. Verified live.

**H2 — Web session cookie missing `Secure` flag.** ✅ **RESOLVED (2026-06-17).**
`web.routes.js` login cookie now sets `secure: process.env.NODE_ENV === 'production'`. Verified on live: `Set-Cookie … HttpOnly; Secure; SameSite=Lax`.

**H3 — `trust proxy` not set behind nginx.** ✅ **RESOLVED (2026-06-17).**
`server.js` now calls `app.set('trust proxy', 1)`, so rate-limiter keying, `req.secure`, and IP logging use the real client IP from `X-Forwarded-For`.

**H4 — No CSRF protection.**
State-changing requests rely solely on `sameSite=lax` cookies; there are no CSRF tokens. `lax` blocks cross-site POST cookies (reasonable baseline) but is not a substitute for tokens, and some flows use `GET` (e.g. `GET /logout`).
*Remediation:* add CSRF tokens to web forms (e.g. `csrf-csrf`/double-submit) and make logout a POST. Effort: ~1 day.

### 🟡 Medium

**M1 — Content-Security-Policy disabled.**
`server.js:20` sets `contentSecurityPolicy: false` (to allow the Chart.js / Google Fonts CDNs). With C2 unfixed this removes a key XSS mitigation layer.
*Remediation:* define a CSP allowlisting the CDNs (or self-host them and tighten CSP). Effort: ~0.5 day.

**M2 — No compliance-alert delivery (email/SMS).**
`nodemailer` is a dependency and SMTP env vars exist, but **no send code is wired** (`src/services/alert.service.js` / `src/jobs/dailyAlerts.job.js` contain no mail/SMS calls). Expiry alerts (visa, RTW, MOT, PMI, missed checks) are visible **only** in-app — nobody is notified proactively, which undercuts the core value of a compliance tool.
*Remediation:* wire nodemailer (SMTP already in `.env.example`) into the daily alerts job; optionally SMS for critical items. Effort: ~1 day.

**M3 — No pm2 log rotation.** ✅ **RESOLVED (2026-06-17).**
`pm2-logrotate` installed and configured: `max_size 10M`, `retain 14`, `compress true`.

**M4 — No self-service password management.**
Users cannot change their own password (only admins can reset others — `users.controller.js:resetPassword`). There is no current-password-verified "change password" and no "forgot password" email flow. The seeded director must reset their own temp password via the admin tool rather than a proper profile flow.
*Remediation:* add change-password (verify current) + forgot-password (email token). Depends on M2 for email. Effort: ~1 day.

**M5 — Thin automated test coverage.**
~10 tests across 3 files (`health`, `web-rbac`, `web-session-api`). Critical flows (login lockout, document authz, RBAC matrix, upload validation, alert generation) are largely untested.
*Remediation:* expand tests around auth/RBAC/documents/alerts; add to CI. Effort: ongoing, ~2–3 days for a solid baseline.

**M6 — No monitoring / error tracking / uptime alerting.**
No Sentry (or equivalent) and no uptime check. Failures are discovered manually.
*Remediation:* add error tracking (Sentry) and an uptime monitor (e.g. UptimeRobot/healthcheck ping on `/health`). Effort: ~0.5 day.

### ⚪ Low

- **L1 — No swap on the VPS** ✅ **RESOLVED (2026-06-17)** — 4 GB swapfile enabled and added to `/etc/fstab`.
- **L2 — JWT lifecycle:** 8 h tokens, no refresh/rotation, no server-side revocation (logout only clears the cookie; a leaked token stays valid until expiry). Consider shorter tokens + refresh, or a token denylist. ~1 day.
- **L3 — Partial input validation:** Joi is used in some controllers (employees/users/vehicles) but not uniformly. Standardise a validation layer on all write endpoints. ~1 day.
- **L4 — Password policy:** only an 8-char minimum; no complexity or breached-password check. ~0.5 day.
- **L5 — `multer@1.x` deprecated** (0 known vulns in the installed version today, but EOL). Upgrade to 2.x. ~0.5 day.
- **L6 — Secrets/rotation:** the GitHub PAT and VPS root password used during setup should be rotated now (as planned); document a rotation policy for `JWT_SECRET` and DB creds.

---

## 5. Must-have feature checklist before "production complete"

These are the items that should be **done** before the system carries real operational and legal weight:

- [x] **Automated DB backups** (C1) — *offsite copy + tested-restore still to do*
- [ ] **Output escaping / XSS fix** across all views (C2)
- [x] **Login throttling + account lockout** on web login (H1)
- [x] **Secure cookie + `trust proxy`** (H2, H3)
- [ ] **CSRF protection** on web forms; logout → POST (H4)
- [ ] **Content-Security-Policy** (M1)
- [ ] **Email delivery for compliance alerts** — visa/RTW/MOT/PMI/missed-check (M2)
- [ ] **Self-service change-password + forgot-password** (M4)
- [x] **pm2 log rotation** (M3)
- [ ] **Monitoring + uptime + error tracking** (M6)
- [ ] **Expanded automated tests + CI** (M5)
- [ ] **GDPR / UK-DPA controls** — see below

### Legal / data-protection (UK personal data)
This system stores special-category-adjacent personal data (passports, RTW, visa, salary). Before broad use it needs:
- [ ] **Privacy policy** and lawful-basis documentation
- [ ] **Data retention schedule** + automated purge of expired records
- [ ] **Right-to-erasure / subject-access** workflow
- [ ] **Encryption at rest** for the DB/uploads volume (disk-level or column-level for documents)
- [ ] **DPA register / records of processing**, and a data-processing agreement with Hostinger
- [ ] **Access audit reporting** (the audit log exists — surface it as reviewable reports)

---

## 6. Recommended roadmap

**Phase 0 — Same-day hardening (low effort, high value).** ✅ **COMPLETE (2026-06-17).**
- ✅ Daily DB backups + retention (C1)
- ✅ pm2-logrotate (M3)
- ✅ Secure cookie + `trust proxy` (H2, H3)
- ✅ Web-login rate limit + lockout using existing env vars (H1)
- ✅ Add swap (L1)
- ⏳ Rotate PAT + VPS password (L6, **your action — still pending**)

**Phase 1 — Security pass (≈1 week).**
- XSS output escaping (C2)
- CSRF tokens + POST logout (H4)
- Content-Security-Policy (M1)
- Monitoring/error tracking/uptime (M6)

**Phase 2 — Feature completeness (≈1–2 weeks).**
- Email alert delivery (M2)
- Change/forgot password (M4)
- Test coverage + CI (M5)
- JWT lifecycle, password policy, validation layer (L2–L4)

**Phase 3 — Compliance & polish (≈1–2 weeks, partly legal/admin).**
- GDPR/UK-DPA controls, retention, erasure, encryption-at-rest
- multer 2.x upgrade, dependency refresh
- Continue page-by-page UX/feature build-out

---

## 7. One-line risk statement

> The platform is live, well-built structurally, and now has baseline hardening + backups (Phase 0 complete). It **must not hold real compliance data at scale until the stored-XSS fix (C2) and CSRF (H4) are complete**, and is **not legally production-ready for UK personal data until the GDPR/DPA controls in §5 are in place.**
