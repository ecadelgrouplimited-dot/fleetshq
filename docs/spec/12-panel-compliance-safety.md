# 12 — Compliance & Safety Panel

> **Purpose:** prove that drivers and vehicles are legal and safe, manage incidents, and keep regulators
> (DVSA, Home Office, Traffic Commissioner) satisfied with one-click evidence. **This is essentially the
> app we already built**, re-housed as one panel of the platform.
> **Primary users:** Compliance Officer / Transport Manager (Director read; HR/Fleet read across).
> **Status overall:** 🟢 Largely built — this is the most complete panel today.

> Depth reference: `docs/256 Logistics Compliance App Design.pdf` (Modules 1–5) remains the detailed
> spec for everything in this panel. This doc maps it into the platform.

---

## 1. Navigation & screens

| Section | Screens | Status |
|---------|---------|--------|
| **Compliance Dashboard** | People/Fleet/Driver/Overall scores, alerts, audit-pack % | 🟢 |
| **Risk Monitoring** | Live alerts across people, fleet, drivers | 🟢 |
| **Driver Compliance** | Licences, CPC, tacho cards, infringements | 🟢🟡 |
| **Vehicle Compliance** | MOT, road tax, insurance, safety inspections, PMI evidence | 🟢 |
| **Daily Checks** | Walk-around checks, nil-defect, photos, signatures | 🟢 |
| **Defects & VOR** | Defect cases, VOR workflow, sign-offs | 🟢 |
| **Driver Risk** | Risk scores, debriefs, follow-ups | 🟡 |
| **Incident Management** | Accidents, damage, investigations | 🔴 |
| **Sponsorship (Home Office)** | RTW, visa, CoS, change reporting, absence | 🟢 |
| **Audit Evidence Centre** | Evidence folders, audit trail, sign-offs, audit packs | 🟢🟡 |
| **Compliance Reporting** | Home-Office / DVSA / management reports | 🟢 |

---

## 2. Key views (mostly built — extend where noted)

### 2.1 Compliance dashboard (🟢)
People / Fleet / Driver / **Overall** compliance scores (gauges), live alert feed by severity, defect
pressure, risk hotspots, audit-pack completeness %. Already shipped; keep.

### 2.2 Driver compliance (🟢🟡)
Licence checks, **CPC**, **tacho card** expiry, **tachograph infringements**, missed checks, debriefs.
Pulls from HR documents + driver activity. Extend: tacho infringement capture/import (P5 integration).

### 2.3 Vehicle compliance (🟢)
MOT/road-tax/insurance/tacho-cal status, PMI evidence, brake tests, prohibition notices, rectification —
the regulatory **evidence** view over Fleet (`10`) maintenance data.

### 2.4 Daily checks / Defects / VOR (🟢)
The existing flows: walk-around checks (with the full checklist), **defect cases** (category, severity
Minor/Serious/Dangerous, allow-continue, VOR decision, TM review, repair, invoice, final sign-off),
**VOR** (off-road date, reason, authoriser, garage, est/actual return, evidence, sign-off). Now also
fed by the **Driver panel** at shift start (`08`).

### 2.5 Driver risk (🟡, complete it)
**Driver risk score** from weighted factors (tacho infringements, missed checks, defects, accidents,
speeding, complaints, licence points, late training, policy breaches) → band; **debrief records** (issue,
explanation, manager comments, corrective training, signature, follow-up). The score exists in concept;
finish the weighting + debrief workflow.

### 2.6 Incident management (🔴, new)
Accidents/damage/breakdowns (often raised from Driver/Dispatcher exceptions): parties, vehicle, shipment,
severity, investigation, evidence, outcome, insurance link. Feeds evidence folders.

### 2.7 Sponsorship — Home Office (🟢)
CoS number, SOC code, sponsored vs. actual salary/hours, visa expiry, RTW + follow-up dates, absence
monitoring, change reporting (duties/salary/location/end). Already built.

### 2.8 Audit Evidence Centre (🟢🟡)
Ready-made **evidence folders**: Home Office Sponsor Licence, DVSA Maintenance Investigation, Traffic
Commissioner Public Inquiry, Insurance Claim, Accident Investigation, Employment Dispute, Driver
Disciplinary. **Audit trail** (who uploaded/signed/closed/changed/approved + when). **Management
sign-offs** (Director/TM/HR/Ops/Yard). **One-click audit packs** (Home Office + DVSA) assembling staff/
sponsored/RTW/contracts/maintenance/PMI/defects/VOR/checks/training/sign-offs. Folder UI + icons exist;
finish pack generation + completeness %.

### 2.9 Compliance scoring (🟢)
People (records, RTW, contracts, absence, sponsorship), Fleet (PMI, MOT, defect closure, VOR, brake
tests), Driver (training, tacho, checks, licences, debriefs) → **Overall**. Already implemented; keep as
the cross-panel KPI input to Executive (`14`).

---

## 3. Data
`ComplianceScore, Alert, WalkAroundCheck, DefectCase, VorRecord, DriverRiskScore, DriverDebrief,
Incident, SponsoredWorker, EvidenceFolder, SignOff, AuditPack, AuditLog`. See `02`.

## 4. Workflows
Check→defect→VOR→repair→sign-off; RTW/visa monitoring→change reporting; risk event→debrief→follow-up;
incident→investigation→evidence; audit request→one-click pack. All audit-logged.

## 5. Alerts (catalogue carries over)
PMI/MOT/insurance/tacho-cal expiring; defect open/not-closed; missed checks; repeated infringements;
RTW/visa/follow-up due; unauthorised absence; unsigned policy; audit pack % below target. (Matches the
example dashboard alerts in the compliance PDF.)

## 6. Permissions
Compliance/Transport Manager full; Director read; HR reads sponsorship/RTW; Fleet reads vehicle
compliance; Garage scoped to assigned defects/PMI evidence. (`01`)

## 7. MVP vs later
- **MVP (P2):** everything already built (checks, defects, VOR, sponsorship, scores, evidence folders,
  reports) + finish driver-risk weighting + audit-pack generation.
- **Later:** incident management, tacho infringement integration, automated audit-pack export, predictive
  risk.

## 8. Notes
This panel is the platform's **regulatory backbone** and its biggest existing asset — protect its
behaviour during the re-housing; don't regress the shipped compliance flows.

*Next: [13 — LMS Panel](13-panel-lms.md)*
