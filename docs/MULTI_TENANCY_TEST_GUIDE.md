# Multi-Tenancy Test Guide

> **Purpose:** Verify that every query, route, and data mutation in 256 Logistics is correctly scoped
> to the authenticated user's tenant — no data leaks across tenant boundaries.
>
> **Architecture recap:** every domain model has a `tenantId` column defaulting to the seeded default
> tenant `00000000-0000-4000-8000-000000000001`. Prisma middleware intercepts every `findMany`,
> `findFirst`, `findUnique`, `create`, `update`, and `delete` call to inject `where: { tenantId }`
> automatically via AsyncLocalStorage. The tenant context is set in the web auth middleware on every
> authenticated request.
>
> **Legend:** ✅ pass · ❌ fail (data leak) · ⚠️ not yet tested · ➡️ expected behaviour

---

## 1. Pre-conditions — provision two test tenants

Before running any scenario, set up two tenants with isolated data.

### 1.1 Create Tenant A (default — already seeded)
- Tenant ID: `00000000-0000-4000-8000-000000000001`
- Director login: `director@256logisticsltd.com`
- Seed data: all existing employees, vehicles, shipments, etc.

### 1.2 Create Tenant B (new)
Run this in `psql` or a seed script:

```sql
INSERT INTO "Tenant" (id, name, slug, status, "createdAt", "updatedAt")
VALUES (
  '11111111-1111-4000-8000-000000000002',
  'Rival Logistics Ltd',
  'rival-logistics',
  'active',
  NOW(), NOW()
);

INSERT INTO "Company" (id, name, "tenantId", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Rival Logistics Ltd',
  '11111111-1111-4000-8000-000000000002',
  NOW(), NOW()
);
```

Then create a director user for Tenant B via `/super-admin` → Users (assign tenantId manually or
add a `tenantId` column to the User table and set it for this user).

> **Note:** Full per-tenant user isolation (User.tenantId) is on the polish roadmap. For now, use
> a distinct user email for Tenant B testing and verify at the data layer.

---

## 2. Tenant-scoped models checklist

The `tenantScopedModels` Set in `src/config/database.js` must include every model with a `tenantId`
column. Verify this set is complete:

| Model | In tenantScopedModels? | Has tenantId in schema? |
|-------|----------------------|------------------------|
| Employee | ✅ | ✅ |
| EmployeeDocument | ✅ | ✅ |
| SponsoredWorker | ✅ | ✅ |
| SponsoredWorkerChange | ✅ | ✅ |
| Vehicle | ✅ | ✅ |
| VehicleDocument | ✅ | ✅ |
| FuelLog | ✅ | ✅ |
| WalkAroundCheck | ✅ | ✅ |
| DefectCase | ✅ | ✅ |
| DefectPhoto | ✅ | ✅ |
| VorRecord | ✅ | ✅ |
| PmiRecord | ✅ | ✅ |
| TrainingRecord | ✅ | ✅ |
| ToolboxTalk | ✅ | ✅ |
| PolicyAcknowledgement | ✅ | ✅ |
| ComplianceScore | ✅ | ✅ |
| Alert | ✅ | ✅ |
| AuditLog | ✅ | ✅ |
| AuditFolder | ✅ | ✅ |
| AuditEvidence | ✅ | ✅ |
| Customer | ✅ | ✅ |
| Shipment | ✅ | ✅ |
| Parcel | ✅ | ✅ |
| TrackingEvent | ✅ | ✅ |
| Job | ✅ | ✅ |
| ProofOfDelivery | ✅ | ✅ |
| Invoice | ✅ | ✅ |
| ServiceType | ✅ | ✅ |
| Branch | ✅ | ✅ |
| PublicLead | ✅ | ✅ |
| LeaveRequest | ✅ | ✅ |
| Course | ✅ | ✅ |
| CourseEnrolment | ✅ | ✅ |
| Expense | ✅ | ✅ |

**Action:** After any new model is added, run this check:
```bash
node -e "
const db = require('./src/config/database');
const { Prisma } = require('@prisma/client');
const models = Object.keys(Prisma.ModelName);
// compare with tenantScopedModels
console.log(models);
"
```

---

## 3. Test scenarios

### 3.1 Data isolation — read

**Goal:** User from Tenant A cannot see data belonging to Tenant B.

#### SC-01: Employee list isolation
1. Insert an employee into Tenant B: `INSERT INTO "Employee" (..., "tenantId") VALUES (..., '11111111-...')`
2. Log in as Tenant A director → `/employees`
3. **Expected:** Tenant B employee does NOT appear in the list ➡️ ✅
4. **Fail indicator:** Tenant B employee appears in Tenant A's list ❌

#### SC-02: Vehicle isolation
1. Insert a vehicle with Tenant B's `tenantId`
2. Log in as Tenant A → `/fleet`
3. **Expected:** Tenant B vehicle is not listed ➡️ ✅

#### SC-03: Shipment isolation
1. Create a shipment under Tenant B's `tenantId`
2. Log in as Tenant A → `/shipments`
3. **Expected:** Tenant B shipment invisible to Tenant A ➡️ ✅

#### SC-04: Invoice isolation
1. Create an invoice under Tenant B
2. Log in as Tenant A → `/invoices`
3. **Expected:** Tenant B invoice not visible ➡️ ✅

#### SC-05: Finance data isolation
1. Add expenses and invoices under Tenant B
2. Log in as Tenant A → `/finance`
3. **Expected:** P&L, revenue, expenses show only Tenant A figures ➡️ ✅

#### SC-06: LMS isolation
1. Create a course under Tenant B
2. Log in as Tenant A → `/lms`
3. **Expected:** Tenant B course does not appear in Tenant A's catalogue ➡️ ✅

#### SC-07: Leave requests isolation
1. Create a leave request under Tenant B
2. Log in as Tenant A → `/leave`
3. **Expected:** Tenant B leave request not visible ➡️ ✅

#### SC-08: Executive BI isolation
1. Ensure Tenant B has revenue data (invoices)
2. Log in as Tenant A → `/executive`
3. **Expected:** Revenue, shipments, employee counts reflect only Tenant A data ➡️ ✅

---

### 3.2 Data isolation — write / mutation

**Goal:** A Tenant A user cannot create, update, or delete Tenant B records even with a crafted request.

#### SC-09: Direct-ID update attack
1. Note the UUID of a Tenant B employee (from DB)
2. As Tenant A, send: `PUT /api/v1/employees/<tenant-B-id>` with modified data
3. **Expected:** 404 Not Found (Prisma WHERE clause includes tenantId, so the record isn't found) ➡️ ✅
4. **Fail indicator:** 200 OK and Tenant B record is modified ❌

#### SC-10: Direct-ID delete attack
1. As Tenant A, send: `DELETE /api/v1/vehicles/<tenant-B-vehicle-id>`
2. **Expected:** 404 Not Found ➡️ ✅
3. **Fail indicator:** Tenant B vehicle is deleted ❌

#### SC-11: Shipment status update attack
1. Note a Tenant B shipment ID
2. As Tenant A dispatcher, `PUT /api/v1/shipments/<tenant-B-id>/status` → `{ status: 'delivered' }`
3. **Expected:** 404 ➡️ ✅

#### SC-12: Invoice mark-paid attack
1. As Tenant A finance officer: `POST /invoices/<tenant-B-invoice-id>/pay`
2. **Expected:** 404 ➡️ ✅

#### SC-13: Cross-tenant enrolment
1. As Tenant A (LMS admin), POST to assign Tenant B employee to a Tenant A course
2. **Expected:** Either 404 on employee lookup, or validation error ➡️ ✅

---

### 3.3 Public-facing routes (no auth)

**Goal:** Public routes only expose data they intend to.

#### SC-14: Public shipment tracking
- `GET /track?ref=<tenant-B-shipment-ref>`
- **Expected:** Tracking page shows for correct reference regardless of tenant (public tracking is reference-based, not tenant-filtered)
- **Verify:** no internal tenant data (employee names, costs, other shipments) is exposed

#### SC-15: Public lead capture
- Submit contact form → `/contact` → `POST /api/v1/leads`
- **Expected:** Lead saved with `tenantId = default tenant` ✅ (or platform-level)
- **Verify:** no tenant context required for public routes

---

### 3.4 API endpoints — header/cookie spoofing

**Goal:** Tenant cannot be switched by manipulating cookies or headers.

#### SC-16: Tenant ID header injection
1. Log in as Tenant A user
2. Add header `X-Tenant-Id: 11111111-1111-4000-8000-000000000002` to an API request
3. **Expected:** Header is ignored; response returns Tenant A data only ➡️ ✅
4. **Verify:** Check `src/middleware/webAuth.js` — tenant is resolved from the JWT/session user record, not from request headers

#### SC-17: JWT tenant field tampering
1. Decode the auth JWT
2. Attempt to modify the `tenantId` claim and re-sign (without the secret)
3. **Expected:** JWT verification fails → 401 Unauthorized ➡️ ✅

---

### 3.5 Super Admin — platform-level access

**Goal:** Platform Super Admin can see all tenants; tenant-level admins cannot.

#### SC-18: Super Admin tenant list
- Log in as platform super admin → `/super-admin`
- **Expected:** All tenant records listed (Tenant A + Tenant B) ➡️ ✅

#### SC-19: Tenant admin cannot access Super Admin
- Log in as Tenant A director → `GET /super-admin`
- **Expected:** 403 Forbidden or redirect ➡️ ✅

---

### 3.6 Audit log scoping

**Goal:** Audit logs are tenant-scoped and don't expose cross-tenant actions.

#### SC-20: Audit log isolation
1. Perform an action in Tenant B (e.g., create employee)
2. Log in as Tenant A → `/audit-evidence` or audit log view
3. **Expected:** Tenant B action not visible ➡️ ✅

---

### 3.7 File / document isolation

**Goal:** Documents uploaded by Tenant B cannot be served to Tenant A users.

#### SC-21: Document access control
1. Upload a document under Tenant B (employee record / vehicle document)
2. Capture the storage key / URL
3. As Tenant A, attempt to fetch the same document URL
4. **Expected:** 404 or 403 (auth middleware checks ownership + tenant) ➡️ ✅

---

## 4. Automated isolation test skeleton

Add to `tests/` alongside existing tests:

```js
// tests/tenant-isolation.test.js
const request = require('supertest');
const app = require('../server');
const prisma = require('../src/config/database');

const TENANT_A = '00000000-0000-4000-8000-000000000001';
const TENANT_B = '11111111-1111-4000-8000-000000000002';

describe('Tenant isolation', () => {
  let tokenA; // JWT for Tenant A director
  let tenantBEmployeeId;

  beforeAll(async () => {
    // Create a Tenant B employee directly in DB
    const emp = await prisma.$executeRaw`
      INSERT INTO "Employee" (id, "tenantId", "fullName", "employmentStatus", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${TENANT_B}, 'Rival Employee', 'active', NOW(), NOW())
      RETURNING id
    `;
    // tokenA = login as Tenant A director and capture JWT
  });

  test('SC-01: Tenant A cannot read Tenant B employee', async () => {
    const res = await request(app)
      .get('/api/v1/employees')
      .set('Cookie', `authToken=${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.data.map(e => e.tenantId)).not.toContain(TENANT_B);
  });

  test('SC-09: Tenant A cannot update Tenant B employee by ID', async () => {
    const res = await request(app)
      .put(`/api/v1/employees/${tenantBEmployeeId}`)
      .set('Cookie', `authToken=${tokenA}`)
      .send({ fullName: 'HACKED' });
    expect(res.status).toBe(404);
  });

  afterAll(async () => {
    await prisma.$executeRaw`DELETE FROM "Employee" WHERE "tenantId" = ${TENANT_B}`;
    await prisma.$disconnect();
  });
});
```

---

## 5. Prisma middleware verification

Inspect `src/config/database.js` — the middleware should:

```js
prisma.$use(async (params, next) => {
  const tenantId = getTenantId(); // from AsyncLocalStorage
  if (tenantId && tenantScopedModels.has(params.model)) {
    if (['findMany', 'findFirst', 'findUnique'].includes(params.action)) {
      params.args.where = { ...params.args.where, tenantId };
    }
    if (['create'].includes(params.action)) {
      params.args.data.tenantId = tenantId;
    }
    if (['update', 'delete', 'updateMany', 'deleteMany'].includes(params.action)) {
      params.args.where = { ...params.args.where, tenantId };
    }
  }
  return next(params);
});
```

**Check:** `updateMany` and `deleteMany` are also covered (bulk operations can be a leak vector).

---

## 6. Known gaps & roadmap items

| Gap | Risk | Planned fix |
|-----|------|-------------|
| `User` model does not have `tenantId` | Users from different companies share the same user table; a user login resolves tenant via company association | Add `User.tenantId` in a future migration |
| `ComplianceScore` — verify scoping | Score aggregation queries use raw joins | Confirm each sub-query includes tenantId WHERE clause |
| Public tracking `GET /track` | Reference-based; any reference string can retrieve a shipment if guessed | Consider adding HMAC-signed references |
| Audit log queries in exec/compliance routes | Complex multi-model queries — verify each sub-query is tenant-scoped | Manual SQL audit of complex queries |
| File storage keys | Keys are UUIDs — hard to guess but not cryptographically bound to tenant | Add tenant prefix to storage keys and verify in serve endpoint |

---

*Generated: 2026-06-20 · 256 Logistics Platform · Next review: before first multi-tenant go-live*
