# Modules Specification — 256 Logistics Compliance Hub

---

## Module 1: People & Compliance

**Purpose:** Replace BrightHR. A transport and Home Office-focused HR system that proves 256 Logistics has full control over its workforce.

### 1.1 Employee Profile

Every employee record must be complete before the employee is considered "compliant". Missing fields trigger dashboard alerts.

**Required fields for compliance:**
- Full name, date of birth, home address
- Phone and email
- Emergency contact name and phone
- Next of kin
- Job title, department, start date
- Employment status, contracted hours, salary
- Work location, line manager

**Completion Score:** Each employee has a profile completion percentage. Incomplete profiles appear in the dashboard alert feed.

**Driver-specific fields (when `is_driver = true`):**
- Assigned vehicle
- CPC card number and expiry
- Digital tachograph card number
- Driving licence number and categories

### 1.2 Document Management

Each document type has an expected status:

| Document | Expiry Tracked | Alert Threshold |
|----------|---------------|----------------|
| Employment contract | No | Missing = alert |
| Passport copy | Yes | 90/30/14 days |
| Right to Work evidence | Yes | 90/30/14 days |
| Driving licence | Yes | 90/30/14 days |
| CPC card | Yes | 90/30/14 days |
| Digital tachograph card | Yes | 90/30/14 days |
| Offer letter | No | Missing = alert |
| Job description | No | Missing = alert |
| National Insurance evidence | No | Missing = alert |

**Upload rules:**
- Accepted formats: PDF, JPG, PNG, DOCX
- Max file size: 20 MB per file
- Files are stored with the employee ID in the path: `employees/{employeeId}/{documentType}/{filename}`

### 1.3 Home Office Sponsor Compliance

**The sponsored worker sub-module is the highest-risk compliance area.** A missed alert or incorrect record can result in a Home Office civil penalty of up to £20,000 per worker.

**Alert thresholds (auto-calculated daily):**

| Alert | Critical | Warning | Notice |
|-------|---------|---------|--------|
| Visa expiry | 14 days | 30 days | 90 days |
| Right to Work expiry | 14 days | 30 days | 90 days |
| Follow-up check due | 7 days | 14 days | 30 days |
| Unauthorised absence | Same day | — | — |
| Missing contact details | Immediate | — | — |

**Change reporting obligations:**
When any of the following change for a sponsored worker, the change must be logged immediately (and in some cases reported to the Home Office within 10 working days):
- Salary (if it drops below the CoS stated salary)
- Working hours
- Job duties (if substantially different from sponsored role)
- Work location
- End of employment (must be reported within 10 working days)

The system records the change, flags whether it has been reported to the Home Office, and alerts management if an unreported change is older than 7 days.

### 1.4 Home Office Audit Pack

One-click checklist view showing every required document for a Home Office sponsor licence audit. Status displayed as:
- **Present** (green) — document uploaded and not expired
- **Expiring Soon** (amber) — within alert threshold
- **Missing** (red) — no document uploaded
- **Expired** (red) — document past expiry

Pack contents:
1. Full staff list (name, job title, nationality, start date, employment status)
2. Sponsored worker list (CoS numbers, visa dates, right to work dates)
3. Right to Work check records (document type, check date, follow-up date)
4. Employment contracts
5. Job descriptions
6. Salary and hours records
7. Change event log
8. Absence records (last 12 months)
9. Contact details for all sponsored workers
10. Management sign-off records

---

## Module 2: Safety & Competency

**Purpose:** Prove that every driver and staff member is trained, competent, and aware of company procedures. This module provides evidence to the Traffic Commissioner and DVSA that 256 Logistics has an effective safety culture.

### 2.1 Training Matrix

The training matrix is the central evidence document for a DVSA investigation. It must show, for every driver:

- Which training has been completed, with dates and trainer details
- Which training is pending or overdue
- When refresher training is next due
- CPC periodic training hours (35 hours every 5 years)

**Completion rules:**
- A driver cannot be marked "fully inducted" until all induction training types are marked complete
- The system calculates overall induction completion percentage per driver
- Incomplete induction appears as a critical alert if the driver has been employed for more than 4 weeks

**CPC Tracking:**
- CPC expiry date stored and tracked
- 90/30/14 day expiry alerts
- If CPC expires, driver is flagged as "training non-compliant" regardless of other records

### 2.2 Digital Policy Acknowledgements

**Why this matters:** If a driver commits a tachograph infringement, the Traffic Commissioner will ask for evidence that the operator told the driver the rules. A signed digital acknowledgement is legally defensible evidence.

**Signing flow:**
1. Manager creates or selects a policy version in the system
2. Policy is assigned to one or more drivers
3. Driver logs in, reads the policy text on-screen, and draws or types their signature
4. System records: driver ID, policy version, timestamp, IP address, device info
5. Signed acknowledgement is immutably stored and cannot be edited or deleted

**Policy versions:** Policies can be updated (e.g., v1.0 → v2.0). When updated, all assigned drivers must re-sign. Previous signed versions are retained.

### 2.3 Toolbox Talks

**Toolbox talks** are short safety briefings (5–15 minutes) held with groups of staff. Evidence that these were held and signed is required by the Traffic Commissioner.

**Creation workflow:**
1. Transport Manager creates a new toolbox talk: topic, date, description, assigns drivers
2. Drivers sign digitally (in-person or via app login)
3. Manager sees live view: signed / not yet signed per driver
4. Manager signs off completed talk (certifying it was conducted)
5. Record is archived with all signatures

**Missed toolbox talk:** If a driver is added to a talk but hasn't signed within 7 days, a dashboard alert fires.

### 2.4 Training Alert Engine

Alerts are generated by the daily cron job at 06:00 UTC:

```
For each employee:
  1. Check all training_records where expiry_date IS NOT NULL
     → Generate alert if within threshold
  2. Check training_records where status = 'not_started'
     → If employee start_date > 28 days ago, generate 'induction_incomplete' alert
  3. Check cpc training record expiry_date
     → Generate alert at 90/30/14 days
  4. Check policy_acknowledgements for each active policy
     → If not signed and assigned > 7 days ago, generate alert
  5. Check toolbox_talk_assignments where signed_at IS NULL
     → If assigned > 7 days ago, generate alert
```

---

## Module 3: Fleet & Roadworthiness

**Purpose:** The DVSA-focused module. Demonstrates to the DVSA and Traffic Commissioner that 256 Logistics maintains all vehicles to roadworthy standards, has a systematic maintenance programme, and manages defects correctly.

### 3.1 Vehicle Profile

Each vehicle is the central entity around which all fleet compliance records cluster. The vehicle profile is the first document a DVSA examiner will request.

**Status colour coding:**
- Active → Green
- Awaiting Repair → Amber
- VOR → Red
- Sold / Hired → Grey (archived view)

**Auto-calculated fields:**
- `next_pmi_date` = `last_pmi_date` + (`pmi_interval_weeks` × 7 days)
- `pmi_days_remaining` = `next_pmi_date` - today
- `mot_days_remaining` = `mot_expiry_date` - today

### 3.2 PMI Planner

The Preventive Maintenance Inspection (PMI) planner is the backbone of fleet compliance. The Traffic Commissioner expects a systematic maintenance programme with documented evidence.

**PMI intervals (configurable per vehicle):**
- Standard: every 6 weeks
- High mileage: every 4 weeks
- Low usage: every 8 weeks (requires justification)

**PMI Planner view (tabular):**

| Vehicle | Last PMI | Next PMI | Days Until | Status | Brake Test | Sheet Uploaded |
|---------|---------|---------|-----------|--------|-----------|---------------|
| FN16 EVK | 01 Nov | 13 Dec | 5 | DUE SOON | Yes | Yes |
| NU66 XVB | 15 Oct | 26 Nov | OVERDUE | OVERDUE | No | No |

**Brake test requirement:** Every PMI must have a corresponding brake test report uploaded. A PMI without a brake test is considered incomplete.

### 3.3 Daily Walk-Around Checks

**Legal requirement:** Under the Road Traffic Act 1988 and DVSA guidance, drivers must complete a daily safety check before using a vehicle.

**Check submission rules:**
- One check per vehicle per day per driver
- If a driver has not submitted a check for their assigned vehicle by a configurable time (default: 07:30), a "missed check" alert fires
- Checks cannot be submitted backdated more than 24 hours
- Nil defect declaration requires explicit confirmation (not the default)

**Photo evidence:** If a defect is reported, the check form prompts the driver to upload at least one photo before submission.

**Digital signature:** Every check must end with the driver drawing their signature on-screen. This is stored as a base64 PNG and displayed in the audit view.

### 3.4 Defect Management State Machine

```
Defect Reported (from check OR manual)
    │
    ▼
[REPORTED] ──── Transport Manager notified immediately
    │
    ▼
[UNDER REVIEW] ── TM reviews: severity, vehicle allowed to continue, VOR decision
    │
    ├── VOR = true ──→ VOR record created, vehicle status → VOR
    │
    ▼
[REPAIR BOOKED] ── Repair garage assigned, repair action recorded
    │
    ▼
[REPAIRED] ── Date repaired, invoice uploaded, completion confirmed
    │
    ▼
[SIGNED OFF] ── Transport Manager signs off, defect closed
                Vehicle returned to service (if was VOR)
```

**Dangerous defect rule:** If severity = `dangerous`, the vehicle MUST be marked VOR (`vehicle_allowed_to_continue = false`). The system enforces this — a dangerous defect cannot be progressed without setting VOR.

**SLA targets** (configurable, for dashboard overdue tracking):
- Minor defects: closed within 14 days
- Serious defects: closed within 7 days
- Dangerous defects: closed within 3 days

### 3.5 VOR Management

VOR (Vehicle Off Road) records are scrutinised by the Traffic Commissioner as evidence of defect control discipline.

**VOR record requirements:**
- Every VOR must have an authorising manager recorded
- Every VOR must have evidence uploaded (repair invoice or inspection sheet) before the return can be signed off
- Return to service requires Transport Manager sign-off — not just marking the date

**VOR duration reporting:** If a vehicle has been VOR for more than 7 days, a dashboard flag appears for the Director.

### 3.6 DVSA Audit Pack

One-click checklist for a DVSA Maintenance Investigation or Traffic Commissioner Public Inquiry:

1. Fleet list (registration, make, model, MOT expiry, insurance expiry, status)
2. Vehicle maintenance planner (PMI schedule for all vehicles)
3. PMI history (all completed PMI sheets per vehicle, last 12 months)
4. MOT status (current certificates for all vehicles)
5. Brake test evidence (one per vehicle per PMI)
6. Defect reports (all defect cases, open and closed, last 12 months)
7. VOR history (all VOR records with durations and authorisations)
8. Daily walk-around checks (all checks, last 28 days, per vehicle)
9. Driver training records (tachograph training, walk-around check training)
10. Tachograph calibration certificates (all vehicles)
11. Maintenance provider details (garage names and contacts)
12. Management sign-off records

---

## Module 4: Driver Risk Management

**Purpose:** Identify drivers who are becoming a compliance risk before they cause an incident or attract regulatory attention. Provides the Transport Manager with an early-warning system.

### 4.1 Driver Risk Score

Each driver accumulates risk points across multiple categories. The score is recalculated weekly.

**Risk scoring model:**

| Event | Points |
|-------|--------|
| Tachograph infringement | +5 per infringement |
| Missed walk-around check | +3 per missed check |
| Open serious/dangerous defect reported by driver | +2 |
| Accident (at fault) | +10 |
| Speeding event | +4 |
| Customer complaint | +3 |
| Licence points (each) | +2 per point |
| Late training completion | +2 |
| Policy breach | +5 |
| Completed debrief with no repeat | -3 |
| Full month with zero infringements | -2 |

**Risk levels:**
- 0–10 points → Low (green)
- 11–25 points → Medium (amber) — manager notification
- 26–50 points → High (red) — immediate manager review required
- 51+ points → Critical (red flashing) — Director escalation

### 4.2 Driver Debrief Records

When a driver has an infringement or issue, a formal debrief must be recorded.

**Debrief workflow:**
1. Alert triggers or manager identifies issue
2. Manager creates debrief record: issue date, type, description
3. Meeting held — driver explanation recorded
4. Manager comments added
5. Corrective training assigned (if required)
6. Driver signs debrief record digitally
7. Follow-up date set
8. At follow-up: outcome recorded, case closed or escalated

**Debrief types:** Tachograph infringement, Missed daily check, Reported defect pattern, Accident, Customer complaint, Policy breach, Licence points

### 4.3 Driver Compliance Alerts

| Alert | Trigger | Severity |
|-------|---------|---------|
| Licence check due | DVLA check date + 12 months | Warning |
| CPC card expiring | 90 / 30 / 14 days before expiry | Notice / Warning / Critical |
| Tacho card expiring | 90 / 30 / 14 days before expiry | Notice / Warning / Critical |
| Repeated tachograph infringements | 3+ infringements in 28 days | Critical |
| Repeated missed checks | 3+ missed checks in 14 days | Warning |
| Accident history | Any at-fault accident | Warning |
| Debrief not completed | Debrief open > 7 days | Warning |

---

## Module 5: Audit & Legal Evidence Centre

**Purpose:** The strongest differentiator over generic HR software. When the Home Office, DVSA, or Traffic Commissioner requests evidence, 256 Logistics can produce a coherent, timestamped, management-signed evidence file within minutes — not weeks.

### 5.1 Evidence Folders

Seven pre-built evidence folders, each with a checklist of expected documents:

| Folder | Primary Authority | Key Documents |
|--------|-----------------|--------------|
| Home Office Sponsor Licence Audit | Home Office | Sponsored worker records, Right to Work, salary evidence, change logs |
| DVSA Maintenance Investigation | DVSA | Fleet list, PMI history, defect records, brake tests, VOR history |
| Traffic Commissioner Public Inquiry | Traffic Commissioner | All of the above plus management sign-offs and training evidence |
| Insurance Claim Evidence | Insurer | Accident report, walk-around check on incident date, driver training record, vehicle maintenance history |
| Accident Investigation File | Internal / Police | Same as insurance + driver debrief, tachograph data, witness statements (uploaded) |
| Employment Dispute | Employment Tribunal | Employee profile, contract, disciplinary records, absence records, correspondence |
| Driver Disciplinary File | Internal / Employment Tribunal | Driver profile, debrief records, policy acknowledgements, infringement history |

Each folder shows:
- Required documents: checklist with present/missing/expired status
- Percentage complete
- Missing document alerts
- Last updated timestamp
- Responsible manager (who needs to action missing items)

### 5.2 Audit Trail

Every significant action in the system writes an immutable audit log entry. The audit trail is the system's legal backbone.

**Logged events:**

| Action | Logged Fields |
|--------|-------------|
| Document uploaded | Who, what file, which employee/vehicle, timestamp |
| Document deleted | Who, what file, reason, timestamp |
| Policy signed | Who, which policy, version, IP address, timestamp |
| Training record updated | Who changed it, previous value, new value, timestamp |
| Defect case status changed | Who, from status, to status, timestamp |
| VOR authorised / return approved | Who, vehicle, timestamp |
| Employee record changed | Who, which field, old value, new value, timestamp |
| Sponsored worker change logged | Who, change type, values, timestamp |
| Toolbox talk signed off | Manager, timestamp |
| User account created/deactivated | Who acted, who was affected, timestamp |

**Audit log properties:**
- Immutable: no edit or delete permitted, enforced at database level
- Indexed for fast retrieval by entity or date range
- Exportable to CSV for legal proceedings
- Viewable only by Director role

### 5.3 Management Sign-Offs

Certain compliance decisions require a named manager sign-off:

| Decision | Required Role | Recordeds |
|----------|-------------|---------|
| Defect case final closure | Transport Manager / Director | Name, timestamp, digital signature |
| VOR return to service | Transport Manager / Director | Name, timestamp, notes |
| Toolbox talk completion | Transport Manager / Director | Name, timestamp |
| Home Office audit pack ready | HR Manager / Director | Name, timestamp |
| DVSA audit pack ready | Transport Manager / Director | Name, timestamp |
| Training record update (manual) | Transport Manager / HR Manager / Director | Name, timestamp, reason |

Sign-off records are stored separately to the primary record, ensuring they cannot be overwritten if the main record is later edited.

---

## Cross-Module: Compliance Scoring Engine

The compliance score is the headline KPI for the Director. It runs as part of the daily cron job.

### People Score (0–100)

```
Score = 100
- 5 for each employee with missing mandatory documents
- 3 for each employee with expired documents
- 10 for each sponsored worker with unresolved visa/RTW alert
- 5 for each sponsored worker with unreported change event > 7 days
- 2 for each employee without emergency contact details
```

### Fleet Score (0–100)

```
Score = 100
- 15 for each vehicle with overdue PMI
- 10 for each vehicle with MOT expiry alert (< 14 days)
- 10 for each vehicle with no brake test on last PMI
- 5 per open serious defect > 7 days old
- 10 per open dangerous defect > 3 days old
- 8 per vehicle VOR > 14 days without sign-off update
```

### Driver Score (0–100)

```
Score = 100
- 5 for each driver with incomplete induction (> 28 days employed)
- 3 for each driver with unsigned policy (> 14 days since assigned)
- 8 for each driver with CPC expiry alert (< 30 days)
- 3 for each missed daily check in last 14 days
- 5 for each open debrief > 7 days
```

### Overall Score

```
Overall = (People × 0.35) + (Fleet × 0.35) + (Driver × 0.30)
```

Weights reflect that people and fleet compliance carry equal regulatory risk, with driver risk weighted slightly lower as it is partly covered by fleet checks.
