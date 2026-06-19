# 13 — Learning Management System (LMS) Panel

> **Purpose:** author and deliver training, assess competence, issue and renew certificates, and prove
> compliance training completion. Feeds HR (training) and the Driver panel (e-learning), and produces
> the competence evidence Compliance needs.
> **Primary users:** Trainer / LMS Admin (HR + Compliance read; Driver/Employee take courses).
> **Status overall:** 🟡 — the *evidence* layer exists (training records, policy acknowledgements,
> toolbox talks); the *authoring/delivery/assessment* layer is 🔴 new.

---

## 1. Navigation & screens

| Section | Screens | Status |
|---------|---------|--------|
| **Course Management** | Course catalogue, create/edit, assign, mandatory flags | 🟡 |
| **Content Management** | Lessons (video/doc/slide/text), media library | 🔴 |
| **Assessments** | Quizzes, pass marks, attempts, results | 🔴 |
| **Certification** | Issue, expiry, **renewals**, certificate library | 🔴 |
| **Learning Analytics** | Completion rates, overdue, by role/branch | 🟡 |
| **Toolbox Talks** | Short safety briefings, assign + sign-off | 🟢 |
| **Policies** | Policy library + digital acknowledgements | 🟢 |

---

## 2. Course catalogue (from the vision)

Driver Induction · Health & Safety · Manual Handling · Road Safety · GDPR · Cybersecurity · Dangerous
Goods Awareness · Customer Service — plus the transport-specific set from the compliance design (HGV
induction, tachograph, drivers' hours, walk-around checks, defect reporting, load security, fatigue,
drug & alcohol, mobile phone policy, etc.). Each course: target roles, mandatory?, validity period
(drives renewals).

---

## 3. Key views

### 3.1 Course management (🟡)
Catalogue (search/filter by category/role/mandatory/validity); create/edit course = metadata + ordered
**lessons** + an optional **assessment** + a **certificate template** + validity. Assign to roles/
branches/individuals (auto-assign mandatory courses on hire — ties to onboarding `06`).

### 3.2 Content management (🔴)
Lesson types: **video, document/PDF, slides, rich text**. Media library with reuse. Ordering,
prerequisites, estimated duration. SCORM/xAPI import is a *later* nicety.

### 3.3 Assessments (🔴)
Quiz builder (multiple-choice/true-false/short), **pass mark**, attempts allowed, randomisation, instant
result; a pass contributes to completion + certificate.

### 3.4 Delivery (learner side)
The **e-learning** experience used by Drivers (`08`) and staff: assigned courses, progress %, take
lesson → assessment → **digital sign-off**, certificate on completion. Mobile-friendly.

### 3.5 Certification & renewals (🔴)
Issue certificates on completion (PDF), with **expiry/validity**; **renewal reminders** before expiry
(CPC-style); certificate library per employee (ties to HR record + Compliance competence).

### 3.6 Analytics (🟡)
Completion rates, overdue/expiring, by course/role/branch/individual; mandatory-training compliance %
(feeds the Compliance people/driver scores and Executive KPIs).

### 3.7 Toolbox talks & policies (🟢)
Existing: issue short safety briefings (winter driving, tyre safety, bridge strikes, load security,
mobile use, tacho infringements, fuel theft, yard rules, speeding) with assigned/signed/not-signed +
manager sign-off; policy library with digital acknowledgements. Keep; surface inside LMS.

---

## 4. Data
`Course, Lesson/Content, Assessment, Enrolment/Progress, Certificate, TrainingRecord, ToolboxTalk(+
Assignment), PolicyAcknowledgement`. See `02`. The existing `TrainingRecord/PolicyAcknowledgement/
ToolboxTalk` are the **completion-evidence** layer the LMS authoring writes into.

## 5. Workflows
Author course→assign (auto for mandatory)→learner takes→assess→complete→certificate→renewal reminder→
re-take. Toolbox talk issue→assign→sign→manager sign-off.

## 6. Alerts
Course assigned, due, overdue; certificate expiring (renewal); assessment failed (needs retake);
mandatory-training non-compliance; unsigned policy/toolbox talk.

## 7. Permissions
Trainer/LMS Admin full; HR assigns + reads; Compliance reads competence; Driver/Employee take own
courses + view own certificates. (`01`)

## 8. MVP vs later
- **MVP (P3):** course catalogue + simple lessons (doc/video link) + basic assessment + completion +
  certificate + assign mandatory on hire; keep toolbox talks + policy sign-off (have them).
- **Later:** rich authoring, SCORM/xAPI, advanced analytics, gamification, external course marketplace.

## 9. Open questions
- Host video in-app or link external (YouTube/Vimeo/private)? *(Assume link/private store for MVP.)*
- Is a formal **assessment/quiz** required in MVP or is read-and-sign enough? *(Assume read-and-sign +
  optional simple quiz for MVP.)*

*Next: [14 — Executive / Director Panel](14-panel-executive.md)*
