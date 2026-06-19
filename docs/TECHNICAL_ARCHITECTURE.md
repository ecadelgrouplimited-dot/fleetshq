> **⚠️ SUPERSEDED FOR SCOPE (2026-06-19).** 256 Logistics is now a full logistics platform. The authoritative specification lives in [`docs/spec/`](spec/README.md). This document predates the platform vision and remains only as a **depth reference** for the compliance/HR/fleet-compliance domains.

# Technical Architecture — 256 Logistics Compliance Hub

## Stack Overview

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Runtime | Node.js 20 LTS | Long-term support, async I/O suits notification workloads |
| HTTP Framework | Express.js 4 | Mature, minimal, well-understood for REST APIs |
| Database | PostgreSQL 15 | Relational integrity critical for audit trails and expiry tracking |
| ORM | Prisma 5 | Type-safe queries, auto-migrations, clear schema definitions |
| Authentication | JSON Web Tokens (JWT) | Stateless auth, mobile-ready for Phase 2 driver app |
| Password Hashing | bcrypt | Industry standard for credential storage |
| File Uploads | Multer | Multipart form handling; plugs into S3 or local storage |
| File Storage | AWS S3 (dev: local disk) | Scalable document storage; presigned URLs for secure access |
| Scheduled Jobs | node-cron | Daily alert calculations (PMI due, visa expiry, etc.) |
| Email Notifications | Nodemailer | SMTP-based alerts to managers |
| Logging | Winston | Structured logs for audit trail and debugging |
| Validation | Joi | Request body validation at controller layer |
| Environment Config | dotenv | Twelve-factor app config |
| PDF Generation | Puppeteer / PDFKit | Audit pack PDF exports (Phase 2) |

---

## System Architecture

```
┌─────────────────────────────────────────────────┐
│                  CLIENT BROWSER                  │
│         (Web App — React or EJS Templates)       │
└────────────────────┬────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────┐
│              EXPRESS.JS API SERVER               │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Routes  │→ │Controllers│→ │   Services   │  │
│  └──────────┘  └──────────┘  └──────┬───────┘  │
│                                      │           │
│  ┌─────────────────────────────────┐│           │
│  │         Middleware Stack         ││           │
│  │  auth → rbac → audit → validate  ││           │
│  └─────────────────────────────────┘│           │
│                                      ▼           │
│  ┌─────────────────────────────────────────────┐│
│  │              Prisma ORM                      ││
│  └─────────────────────┬───────────────────────┘│
└────────────────────────┼────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
┌──────────────────┐         ┌─────────────────────┐
│   PostgreSQL DB  │         │    AWS S3 / Local    │
│  (compliance     │         │  (document uploads)  │
│   data, audit    │         └─────────────────────┘
│   trail, users)  │
└──────────────────┘

          ┌──────────────────────────────┐
          │        node-cron Jobs         │
          │  Runs daily at 06:00 UTC:     │
          │  - PMI expiry calculations    │
          │  - MOT/insurance alerts       │
          │  - Visa/Right to Work alerts  │
          │  - CPC expiry checks          │
          │  - Missed daily check flags   │
          └──────────────────────────────┘
```

---

## Folder Structure

```
256Logistics/
├── prisma/
│   ├── schema.prisma           # Full database schema
│   ├── migrations/             # Auto-generated migration files
│   └── seed.js                 # Demo data for client demo
│
├── src/
│   ├── config/
│   │   ├── database.js         # Prisma client singleton
│   │   ├── jwt.js              # JWT sign/verify helpers
│   │   ├── storage.js          # S3 / local storage config
│   │   └── mailer.js           # Nodemailer transport config
│   │
│   ├── middleware/
│   │   ├── authenticate.js     # Verify JWT, attach user to req
│   │   ├── authorize.js        # Role-based access control (RBAC)
│   │   ├── auditLog.js         # Log every write operation to audit_logs
│   │   ├── upload.js           # Multer config for document uploads
│   │   └── validate.js         # Joi schema validation middleware
│   │
│   ├── models/                 # Prisma-generated types (reference only)
│   │
│   ├── routes/
│   │   ├── index.js            # Mount all routers
│   │   ├── auth.routes.js      # POST /auth/login, POST /auth/logout
│   │   ├── dashboard.routes.js # GET /dashboard/summary
│   │   ├── employees.routes.js # CRUD /employees
│   │   ├── sponsored.routes.js # CRUD /sponsored-workers
│   │   ├── documents.routes.js # Upload/download /documents
│   │   ├── training.routes.js  # Training matrix, acknowledgements
│   │   ├── toolbox.routes.js   # Toolbox talks
│   │   ├── vehicles.routes.js  # CRUD /vehicles
│   │   ├── maintenance.routes.js # PMI, maintenance records
│   │   ├── checks.routes.js    # Daily walk-around checks
│   │   ├── defects.routes.js   # Defect cases and workflow
│   │   ├── vor.routes.js       # VOR records
│   │   ├── alerts.routes.js    # Alert feed
│   │   ├── reports.routes.js   # All report endpoints
│   │   └── users.routes.js     # User management (admin only)
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── employees.controller.js
│   │   ├── sponsored.controller.js
│   │   ├── documents.controller.js
│   │   ├── training.controller.js
│   │   ├── toolbox.controller.js
│   │   ├── vehicles.controller.js
│   │   ├── maintenance.controller.js
│   │   ├── checks.controller.js
│   │   ├── defects.controller.js
│   │   ├── vor.controller.js
│   │   ├── alerts.controller.js
│   │   ├── reports.controller.js
│   │   └── users.controller.js
│   │
│   ├── services/
│   │   ├── alert.service.js        # Date calculations → alert generation
│   │   ├── compliance.service.js   # Compliance score calculations
│   │   ├── document.service.js     # S3 upload/download/presign
│   │   ├── notification.service.js # Email notifications via Nodemailer
│   │   └── auditTrail.service.js   # Write audit log entries
│   │
│   ├── jobs/
│   │   └── dailyAlerts.job.js      # node-cron daily job
│   │
│   └── utils/
│       ├── logger.js               # Winston logger setup
│       ├── validators/             # Joi schemas per entity
│       │   ├── employee.validator.js
│       │   ├── vehicle.validator.js
│       │   ├── defect.validator.js
│       │   └── check.validator.js
│       ├── dateHelpers.js          # Days until expiry, is overdue, etc.
│       ├── errors.js               # Custom error classes
│       └── constants.js            # Enums: roles, statuses, alert types
│
├── docs/                           # All project documentation
├── .env.example                    # Environment variable template
├── .env                            # Local config (gitignored)
├── package.json
├── server.js                       # App entry point
└── README.md
```

---

## Key Design Decisions

### 1. PostgreSQL over MongoDB
Compliance data is relational. Employees link to vehicles, vehicles link to defects, defects link to audit logs. A document DB would lose referential integrity. PostgreSQL enforces foreign keys and supports transactions — critical for defect workflow state changes and audit trail writes.

### 2. Audit Log as First-Class Entity
Every write operation (create, update, delete, sign-off) writes to the `audit_logs` table via middleware. This is not optional — it is the legal defence evidence. The middleware fires after the response is sent, never blocking the main operation.

### 3. Role-Based Access Control (RBAC) via Middleware
Roles are stored in the `users` table. The `authorize.js` middleware checks the user's role against a permission matrix defined in `constants.js`. No hardcoded role checks inside controllers — all access decisions go through the middleware.

### 4. Expiry Alerts as Calculated Fields
Alert thresholds (30, 14, 7 days) are not stored in the database. The `alert.service.js` calculates them dynamically from current dates. The daily cron job calls this service at 06:00 UTC and writes today's alert snapshot to a cache table for fast dashboard loading.

### 5. Document Storage via Presigned URLs
Documents are never served directly from the API. The `document.service.js` generates time-limited presigned URLs from S3, keeping sensitive documents (passport copies, contracts) off the public web. For development, local disk storage mirrors the same interface.

### 6. Defect Workflow as Status Machine
Defect status follows a strict state machine. Invalid transitions (e.g., moving from Reported to Closed without a repair record) are rejected at the service layer. This ensures the audit trail is legally coherent.

---

## Authentication Flow

```
1. POST /auth/login { email, password }
   → bcrypt.compare(password, user.passwordHash)
   → sign JWT { userId, role, companyId } with 8h expiry
   → return { token, user: { id, name, role } }

2. All protected routes:
   → Authorization: Bearer <token>
   → authenticate.js verifies and decodes JWT
   → req.user = { id, role, companyId }
   → authorize.js checks role has permission for this route
   → controller executes with req.user in context

3. POST /auth/logout
   → Client deletes token (stateless — no server-side session)
   → Token blacklist optional in Phase 2
```

---

## Environment Variables

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/logistics256

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=8h

# File Storage
STORAGE_TYPE=local               # 'local' or 's3'
LOCAL_UPLOAD_DIR=./uploads
AWS_REGION=eu-west-2
AWS_BUCKET_NAME=256logistics-docs
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
ALERT_FROM_EMAIL=alerts@256logisticsltd.com

# Alert Thresholds (days)
ALERT_CRITICAL_DAYS=7
ALERT_WARNING_DAYS=14
ALERT_NOTICE_DAYS=30
```

---

## API Conventions

- **Base URL:** `/api/v1`
- **Auth:** Bearer token in `Authorization` header
- **Content-Type:** `application/json` (multipart for file uploads)
- **Pagination:** `?page=1&limit=20`
- **Sorting:** `?sortBy=createdAt&order=desc`
- **Filtering:** Query params per endpoint (e.g., `?status=active&department=drivers`)

**Standard Response Envelope:**

```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "total": 42 }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Right to Work check date is required for sponsored workers",
    "field": "rightToWorkDate"
  }
}
```
