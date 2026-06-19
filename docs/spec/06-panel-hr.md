# 06 — HR Panel

> **Purpose:** the full people lifecycle for a transport operator — hire, onboard (with Right-to-Work),
> employ, train, pay, appraise — with the transport/Home-Office specifics baked in.
> **Primary users:** HR Manager (Director read; Finance reads payroll inputs; Compliance reads RTW).
> **Status overall:** 🟡 (employee records, documents, sponsorship, training links exist today; HR
> workflows — recruitment, leave, payroll, performance — are 🔴 new).

---

## 1. Navigation & screens

| Section | Screens | Status |
|---------|---------|--------|
| **Employee Management** | Employee records, personal info, contracts, employment history, emergency contacts | 🟢🟡 |
| **Recruitment** | Vacancies, applications, screening, interviews, hiring workflow | 🔴 |
| **Driver Onboarding** | Registration, document collection, ID verification, **Right-to-Work**, background checks | 🟡 |
| **Leave Management** | Annual / sick / emergency leave, approvals | 🔴 |
| **Payroll Support** | Salary records, driver earnings, overtime, bonuses, deductions | 🔴 |
| **Training Management** | Course assignment, progress, certificates, compliance monitoring | 🟡 (→ LMS `13`) |
| **Performance Management** | Appraisals, KPIs, driver ratings, improvement plans | 🔴 |
| **HR Reports** | Staff, attendance, leave, training reports | 🟡 |

---

## 2. Key views

### 2.1 Employee record (🟢, extend)
The existing rich profile (name, DOB, address, contacts, **emergency contact + next of kin**, job title,
dept, start date, status, hours, salary, location, line manager, assigned vehicle) + the document vault
(contract, offer, JD, passport, RTW, licence, CPC, tacho card, proof of address, NI, payroll,
disciplinary, appraisal, termination). Add **employment history** (role/salary changes timeline) and
make it the hub linking to leave, payroll, training, performance, and (for drivers) jobs/checks.

### 2.2 Recruitment (🔴)
- **Vacancies:** role, branch, JD, status (open/closed).
- **Applications:** candidate, CV, source, stage (applied → screened → interview → offer → hired/
  rejected) — a **pipeline board** (kanban).
- **Screening & interviews:** notes, scorecards, scheduling.
- **Hiring → onboarding handoff:** a hired candidate becomes an Employee + Onboarding checklist.

### 2.3 Driver onboarding (🟡)
- Onboarding **checklist**: registration, collect documents, **ID verification**, **Right-to-Work
  check** (date + evidence + follow-up date — reuse sponsorship/RTW from compliance), background/DBS,
  licence + CPC + tacho card capture, induction (→ LMS), policy acknowledgements (already exists).
- Progress %, blockers, sign-off. New driver can't be allocated jobs until onboarding clears (ties to
  Dispatcher).

### 2.4 Leave management (🔴)
Requests (annual/sick/emergency) with balances, approval workflow (line manager/HR), calendar view of
who's off (feeds Dispatcher availability), accruals.

### 2.5 Payroll support (🔴)
Not a full payroll engine for MVP — a **payroll support** layer: salary records, **driver earnings**
(from Jobs/DriverPayment in Finance), overtime, bonuses, deductions, period export to the accounting/
payroll system. Shared with Finance (`11`).

### 2.6 Performance management (🔴)
Appraisals (period, KPIs, rating), **driver ratings** (delivery performance, on-time %, incidents —
pulled from ops/compliance), improvement plans with follow-ups.

### 2.7 HR reports
Staff list, headcount, attendance, leave, training/compliance — exportable; several already exist
(staff/sponsored/RTW/expiry) and carry over.

---

## 3. Data
`Employee(+history), EmployeeDocument, SponsoredWorker, Vacancy, Application, OnboardingTask,
LeaveRequest, PayrollRecord, Appraisal, Enrolment/Certificate (LMS), DriverRating`. See `02`.

## 4. Workflows
Hire→onboard→active; leave request→approval→calendar; appraisal cycle; document-expiry monitoring
(RTW/visa/licence/CPC/tacho — reuse alert engine).

## 5. Alerts
RTW/visa/follow-up due, licence/CPC/tacho expiring, onboarding incomplete, contract/JD missing,
emergency contact missing, probation review due, leave clashes affecting cover. (Many already exist.)

## 6. Permissions
HR Manager full; Director read; Finance reads payroll inputs; Compliance reads RTW/onboarding; Driver
sees own record/leave/payslip. (`01`)

## 7. MVP vs later
- **MVP (P3):** employee records (have it), onboarding+RTW, leave requests+approval, basic payroll
  export, training assignment via LMS, HR reports.
- **Later:** full recruitment pipeline, performance/appraisal suite, automated payroll engine,
  background-check integrations.

## 8. Open questions
- Build payroll **export to** an external system, or compute payslips in-app? *(Assume export for MVP.)*
- Is recruitment in scope for the first release or deferred? *(Assume deferred to P3+.)*

*Next: [07 — Client Portal](07-panel-client-portal.md)*
