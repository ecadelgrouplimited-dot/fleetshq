# 256 Logistics Compliance Hub

> A transport-specific compliance management system for UK HGV operators.

256 Logistics Compliance Hub combines HR, Home Office sponsor compliance, DVSA fleet compliance, driver training, maintenance records, and legal evidence into one controlled platform — replacing tools like BrightHR with something purpose-built for transport operators.

---

## Positioning Statement

**256 Logistics Compliance Hub** is a transport-focused HR, training and fleet compliance platform designed to help UK HGV operators manage staff, sponsored workers, drivers, vehicle maintenance, roadworthiness, defects, training evidence and audit readiness in one system.

---

## Modules

| # | Module | Purpose |
|---|--------|---------|
| 1 | People & Compliance | Employee records, Right to Work, sponsor compliance |
| 2 | Safety & Competency | Driver training, digital signatures, toolbox talks |
| 3 | Fleet & Roadworthiness | Vehicle profiles, PMI planner, maintenance records |
| 4 | Driver Risk Management | Risk scoring, debrief records, compliance alerts |
| 5 | Audit & Legal Evidence Centre | Evidence folders, audit packs, management sign-offs |

---

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT + Role-Based Access Control
- **File Storage:** Multer + AWS S3 (or local for dev)
- **Alerts/Jobs:** node-cron
- **Email:** Nodemailer
- **Logging:** Winston

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Seed demo data
npm run seed

# Start development server
npm run dev
```

Server runs at `http://localhost:3000`

---

## Project Structure

```
256Logistics/
├── src/
│   ├── config/          # DB, JWT, storage config
│   ├── middleware/       # Auth, RBAC, audit logging, file upload
│   ├── models/          # Prisma schema models
│   ├── routes/          # API route definitions
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic (alerts, compliance scoring)
│   └── utils/           # Helpers, validators, date utilities
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.js          # Demo data seeder
├── docs/                # Full project documentation
├── .env.example
├── package.json
└── README.md
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Project Overview](docs/PROJECT_OVERVIEW.md) | Business context, goals, positioning |
| [MVP Features](docs/MVP_FEATURES.md) | Demo-ready feature scope and acceptance criteria |
| [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md) | Stack decisions, system design, folder layout |
| [Database Schema](docs/DATABASE_SCHEMA.md) | All entities, fields, and relationships |
| [API Specification](docs/API_SPECIFICATION.md) | All REST endpoints by module |
| [User Roles & Permissions](docs/USER_ROLES_PERMISSIONS.md) | Role definitions and access matrix |
| [Modules Specification](docs/MODULES_SPECIFICATION.md) | Detailed feature specs for all 5 modules |
| [Development Roadmap](docs/DEVELOPMENT_ROADMAP.md) | Phased plan: MVP → advanced features |

---

## User Roles

| Role | Access Level |
|------|-------------|
| Director | Full access to all modules and reports |
| Transport Manager | Fleet, PMI, defects, VOR, driver risk, training, DVSA pack |
| HR Manager | Employee records, Right to Work, absence, Home Office pack |
| Operations Manager | Driver allocation, vehicle status, defects, training status |
| Driver | Own profile, walk-around checks, defect reports, training tasks |
| Garage Provider | Assigned defects, PMI uploads, repair evidence, invoices |

---

## MVP Scope (Demo)

The 5 core areas required for the client demo:

1. Employee records with document uploads
2. Right to Work checks and sponsor compliance tracking
3. Training records with digital signatures
4. Vehicle profiles and PMI planner
5. Daily walk-around checks, defect management, and VOR records

See [MVP Features](docs/MVP_FEATURES.md) for full acceptance criteria.
