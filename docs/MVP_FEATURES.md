# MVP Features — 256 Logistics Compliance Hub

## Objective

The MVP delivers the 5 core areas required to demonstrate the platform to 256 Logistics and secure project sign-off. Every feature listed here must be functional, data-backed, and demo-ready.

---

## MVP Scope: 5 Core Areas

### Area 1 — Employee Records

**Goal:** A complete, searchable employee profile system with document upload and expiry tracking.

**Features:**

- Create, read, update, deactivate employee profiles
- Employee profile fields:
  - Full name, date of birth, home address, phone, email
  - Emergency contact and next of kin
  - Job title, department, start date, employment status
  - Contracted hours, salary, work location, line manager
  - Assigned vehicle (if applicable)
- Document upload for each employee:
  - Employment contract, offer letter, job description
  - Passport copy, Right to Work evidence
  - Driving licence, CPC card, digital tachograph card
  - Proof of address, National Insurance evidence
  - Payroll documents, disciplinary records, appraisal records
  - Resignation or termination records
- Document status indicators: Present / Missing / Expired
- Employee list view with filters (department, status, role)
- Missing document alerts per employee

**Acceptance Criteria:**

- [ ] Can create a new employee with all required fields
- [ ] Can upload and view all document types
- [ ] System flags missing documents on the dashboard
- [ ] Employee list shows search and filter by department and status
- [ ] Deactivating an employee removes them from active counts without deleting records

---

### Area 2 — Right to Work & Sponsor Compliance

**Goal:** Track Right to Work checks and all Home Office obligations for sponsored workers.

**Features:**

**Right to Work:**
- Record initial check date and document type
- Record follow-up check date (for time-limited permissions)
- Automated alert when check is approaching expiry (30/14/7 days)
- Flag employees with overdue checks

**Sponsored Worker Module:**
- Certificate of Sponsorship (CoS) number
- SOC code and sponsored job title
- Salary stated on CoS vs actual salary paid
- Contracted hours and actual working pattern
- Work location (must match CoS)
- Visa expiry date and Right to Work check date
- Follow-up check date

**Change Tracking (mandatory Home Office reporting):**
- Salary change record with date and authorisation
- Hours change record
- Job duties change record
- Work location change record
- End of employment report record

**Automated Alerts for sponsored workers:**
- Right to Work expiring (90/30/14 days)
- Visa expiring (90/30/14 days)
- Follow-up check due
- Unauthorised absence (triggered by absence log)
- Sponsored worker does not start (within 28 days of start date)
- Sponsored worker leaves employment
- Contact details missing

**Home Office Audit Pack (one-click generation):**
- Staff list
- Sponsored worker list
- Right to Work checks evidence
- Contracts and job descriptions
- Salary and hours records
- Absence records
- Contact details
- Reporting history
- Compliance alerts log
- Management sign-offs

**Acceptance Criteria:**

- [ ] Sponsored workers are flagged separately from other employees
- [ ] All change events are recorded with date, old value, new value, and authorising manager
- [ ] Dashboard shows visa expiry alerts and Right to Work due counts
- [ ] Alerts fire automatically based on date calculations
- [ ] Audit pack page lists all required documents with present/missing status

---

### Area 3 — Training Records & Digital Signatures

**Goal:** Prove every driver is trained, competent, and has signed required policies.

**Features:**

**Training Matrix per employee:**
- Induction completed (date, trainer)
- HGV driver induction
- Tachograph training
- Drivers' hours training
- Daily walk-around check training
- Defect reporting training
- Load security training
- Health and safety training
- Accident reporting procedure
- Mobile phone policy
- Drug and alcohol policy
- Fatigue management policy
- Fuel card policy
- Yard rules
- Vehicle cleanliness policy
- Customer site rules
- Manual handling training
- Fire safety training
- Refresher training dates and schedule
- CPC card number and expiry date

**Digital Policy Acknowledgements:**
- Driver signs digitally to confirm understanding of:
  - Daily walk-around check duties
  - Defect reporting rules
  - Tachograph rules
  - Drivers' hours rules
  - Fatigue management rules
  - Mobile phone restrictions
  - Drug and alcohol policy
  - Accident reporting rules
  - Serious defects must be reported immediately
- Each acknowledgement captures: driver name, date signed, device/IP, policy version

**Toolbox Talks:**
- Create toolbox talk with topic, date, and assigned staff list
- Topics include: Winter driving, Tyre safety, Bridge strikes, Load security, Mobile phone use, Tachograph infringements, Fuel theft prevention, Yard parking rules, Speeding and penalties
- Record who signed and who has not yet signed
- Manager sign-off on completed toolbox talk
- Dashboard shows pending toolbox talks

**Training Alerts:**
- Induction incomplete (driver has not completed all required modules)
- Refresher training due (date-based)
- CPC card expiring (90/30/14 day alerts)
- Driver has repeated infringements
- Driver has missed safety briefings
- Driver has not signed a required policy

**Acceptance Criteria:**

- [ ] Training matrix shows complete/incomplete status for each employee
- [ ] Digital signature captured with timestamp and IP address
- [ ] Toolbox talk shows signed/not signed per assigned driver
- [ ] Manager can sign off completed toolbox talk
- [ ] CPC expiry alerts appear on dashboard with days remaining
- [ ] Incomplete training is highlighted in red on the training matrix view

---

### Area 4 — Vehicle Profiles & PMI Planner

**Goal:** Full vehicle register with roadworthiness tracking and automated PMI scheduling.

**Features:**

**Vehicle Profile (per truck):**
- Registration number (unique identifier)
- VIN / chassis number
- Make, model, year
- Operator licence disc number
- MOT expiry date
- Road tax expiry date
- Insurance expiry date
- Tachograph calibration expiry date
- PMI interval (in weeks)
- Last PMI date
- Next PMI date (auto-calculated from last PMI + interval)
- Current mileage
- Assigned driver
- Current status: Active, VOR, Sold, Hired, Awaiting Repair

**Maintenance Records (upload and track per vehicle):**
- PMI sheets
- Brake test reports
- MOT certificates
- Service invoices
- Repair invoices
- Tyre reports
- Tachograph calibration certificates
- Safety inspection sheets
- Roadside inspection reports
- Prohibition notices
- Rectification evidence

**PMI Planner:**
- Automatic calculation of next PMI date
- Dashboard view: Next due, Overdue, Completed, Booked
- Vehicles without a PMI date set
- Vehicles with missing PMI inspection sheets
- Vehicles with missing brake test evidence

**Fleet Alerts:**
- PMI due in X days (configurable threshold, default 14 days)
- PMI overdue
- MOT expiring (30/14/7 day alerts)
- Insurance expiring (30/14/7 day alerts)
- Tachograph calibration expiring
- Brake test overdue
- Vehicle with no assigned driver

**Acceptance Criteria:**

- [ ] Vehicle list shows all fleet with status colour coding (Active=green, VOR=red)
- [ ] Next PMI date auto-calculates when last PMI date and interval are set
- [ ] MOT and insurance expiry alerts appear on dashboard
- [ ] Maintenance documents can be uploaded and linked to a vehicle record
- [ ] PMI planner view shows all vehicles in a tabular calendar layout
- [ ] VOR vehicles are clearly separated from active fleet

---

### Area 5 — Daily Walk-Around Checks, Defects & VOR Management

**Goal:** Digital daily check records, full defect case management, and VOR authorisation workflow.

**Features:**

**Daily Walk-Around Checks:**
- Driver completes checklist before vehicle use
- Checklist items:
  - Tyres and wheel nuts, Lights and indicators, Brakes, Steering, Mirrors
  - Windscreen and wipers, Horn, Number plates, Bodywork, Fuel and AdBlue
  - Warning lights, Tachograph, Load security, Leaks, Coupling (if trailer)
  - Fifth wheel, Mudguards, Reflectors
- Each check captures:
  - Driver name and digital signature
  - Vehicle registration
  - Date and time
  - Location
  - Mileage
  - Defects found / Nil defect declaration
  - Photos (where defect reported)
- Missed check alerts: driver has not submitted a check for this vehicle today

**Defect Management:**
When a check reports a defect, or a defect is manually raised, the system creates a defect case:
- Vehicle registration
- Driver name
- Date and time reported
- Defect category
- Description
- Photos
- Severity: Minor / Serious / Dangerous
- Vehicle allowed to continue: Yes / No
- VOR decision
- Transport Manager review (required)
- Repair action recorded
- Invoice upload
- Date repaired
- Final sign-off (Transport Manager)

**Defect Status Workflow:**
```
Reported → Under Review → Repair Booked → Repaired → Signed Off (Closed)
```

- Open defects highlighted on dashboard and fleet view
- Dangerous defects trigger immediate alert to Transport Manager

**VOR Management (Vehicle Off Road):**
- Vehicle taken off road date
- Reason for VOR
- Person who authorised VOR
- Repair garage
- Estimated return date
- Actual return date
- Evidence uploaded (repair invoices, inspection sheets)
- Transport Manager sign-off to return vehicle to service

**Acceptance Criteria:**

- [ ] Driver can submit a daily check with nil defect or reported defect
- [ ] Defect case is created automatically when a defect is reported
- [ ] Transport Manager receives alert for Serious/Dangerous defects
- [ ] Defect case tracks through the full workflow to closure
- [ ] VOR record is created when a vehicle is taken off road
- [ ] Vehicle cannot return to Active status without Transport Manager sign-off
- [ ] Missed daily check appears on dashboard
- [ ] All check records are searchable and filterable by vehicle and date

---

## MVP Dashboard Requirements

The dashboard must show real data for the demo:

- People & Compliance card with counts
- Fleet & Roadworthiness card with counts
- Safety & Competency card with counts
- At least 5 live alert items populated from seeded data
- Compliance score percentages for People, Fleet, and Driver categories
- Quick navigation to each module from the dashboard

---

## Demo Data (Seed)

For the demo, seed data must include:

- Minimum 8 employees (including 2 sponsored workers)
- Minimum 4 vehicles (including 1 VOR, 1 with upcoming PMI due)
- Training matrix records for all drivers (some incomplete)
- At least 3 defect cases (1 open, 1 in repair, 1 closed)
- At least 5 daily walk-around checks (including 1 missed check)
- Policy acknowledgement records (some drivers not signed)
- Expiry alerts: 1 MOT due soon, 1 visa expiry, 1 CPC expiry

---

## Out of MVP Scope (Phase 2)

These features are documented and planned but excluded from the demo:

- Tachograph integration (file import from tacho analysis software)
- Driver risk scoring (automated scoring engine)
- AI compliance alerts
- Garage portal (external login for maintenance providers)
- Home Office audit pack PDF export
- DVSA audit pack PDF export
- Payroll integration
- Mobile app for drivers
- Module 4: Driver Risk Management (full debrief records and scoring)
- Module 5: Audit & Legal Evidence Centre (full evidence folder management)
