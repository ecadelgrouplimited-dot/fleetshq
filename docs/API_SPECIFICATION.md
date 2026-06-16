# API Specification — 256 Logistics Compliance Hub

**Base URL:** `/api/v1`
**Auth:** `Authorization: Bearer <jwt_token>` on all routes except `/auth/login`

---

## Authentication

### `POST /auth/login`
```json
Request:
{ "email": "manager@256logistics.co.uk", "password": "SecurePass123" }

Response 200:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": "uuid", "name": "John Smith", "role": "transport_manager", "email": "..." }
  }
}
```

### `POST /auth/logout`
```json
Response 200: { "success": true, "message": "Logged out" }
```

### `GET /auth/me`
Returns the current authenticated user profile.

---

## Dashboard

### `GET /dashboard/summary`
Returns all data needed to render the main dashboard.

```json
Response 200:
{
  "success": true,
  "data": {
    "people": {
      "totalEmployees": 42,
      "sponsoredWorkers": 8,
      "rightToWorkDue": 3,
      "visaExpiryAlerts": 2,
      "contractsMissing": 1,
      "emergencyContactsMissing": 4
    },
    "safety": {
      "trainingOverdue": 6,
      "inductionIncomplete": 2,
      "policyAcknowledgementsMissing": 11,
      "refresherTrainingDue": 3,
      "cpcExpiryAlerts": 1,
      "toolboxTalksPending": 2
    },
    "fleet": {
      "totalVehicles": 18,
      "activeVehicles": 15,
      "vehiclesVor": 2,
      "pmiDueSoon": 3,
      "motExpiryAlerts": 1,
      "insuranceExpiryAlerts": 0,
      "openDefects": 4,
      "brakeTestDue": 1
    },
    "driverRisk": {
      "tachoInfringements": 3,
      "missedWalkAroundChecks": 2,
      "licenceChecksDue": 5,
      "highRiskDrivers": 1,
      "driverDebriefsP ending": 2
    },
    "auditEvidence": {
      "homeOfficePackPercent": 82,
      "dvsaPackPercent": 76,
      "missingDocuments": 14,
      "managementSignOffsPending": 3
    },
    "complianceScore": {
      "people": 88.5,
      "fleet": 76.2,
      "driver": 81.0,
      "overall": 82.3
    },
    "alerts": [
      { "type": "pmi_due", "severity": "warning", "message": "FN16 EVK PMI due in 5 days", "entityId": "uuid", "daysUntil": 5 },
      { "type": "mot_expiry", "severity": "notice", "message": "NU66 XVB MOT expires in 21 days", "entityId": "uuid", "daysUntil": 21 }
    ]
  }
}
```

---

## Module 1: People & Compliance

### Employees

#### `GET /employees`
Query params: `?status=active&department=drivers&page=1&limit=20&search=john`

```json
Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fullName": "James Okello",
      "jobTitle": "HGV Driver",
      "department": "Drivers",
      "employmentStatus": "active",
      "isSponsored": true,
      "isDriver": true,
      "startDate": "2023-04-01",
      "assignedVehicle": { "id": "uuid", "registration": "FN16 EVK" },
      "documentStatus": { "missing": ["cpc_card"], "expired": [], "expiringSoon": ["driving_licence"] }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 42 }
}
```

#### `POST /employees`
```json
Request:
{
  "fullName": "James Okello",
  "dateOfBirth": "1990-05-15",
  "homeAddress": "12 High Street, Birmingham, B1 1AA",
  "phone": "07700900000",
  "email": "james.okello@email.com",
  "emergencyContactName": "Mary Okello",
  "emergencyContactPhone": "07700900001",
  "nextOfKin": "Mary Okello (Wife)",
  "jobTitle": "HGV Driver",
  "department": "Drivers",
  "startDate": "2024-01-15",
  "employmentStatus": "active",
  "contractedHours": 45,
  "salary": 32000,
  "workLocation": "Birmingham Depot",
  "lineManagerId": "uuid",
  "isDriver": true,
  "isSponsored": false
}
```

#### `GET /employees/:id`
Returns full employee profile with all sub-records.

```json
Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "fullName": "James Okello",
    "...all fields...",
    "documents": [ { "id": "uuid", "documentType": "passport", "status": "present", "expiryDate": "2029-03-20" } ],
    "trainingMatrix": [ { "trainingType": "induction", "status": "completed", "completedDate": "2024-01-20" } ],
    "sponsoredWorker": null
  }
}
```

#### `PUT /employees/:id`
Update any employee field. Audit log records previous and new state.

#### `PATCH /employees/:id/status`
```json
Request: { "status": "terminated", "terminationDate": "2024-12-31", "reason": "Resignation" }
```

---

### Sponsored Workers

#### `GET /sponsored-workers`
Query params: `?visaExpiryBefore=2025-06-01&rightToWorkDue=true`

#### `POST /sponsored-workers`
Creates sponsored_workers record extending an existing employee.

```json
Request:
{
  "employeeId": "uuid",
  "cosNumber": "F1LC0D0A5001",
  "socCode": "8211",
  "sponsoredJobTitle": "HGV Driver",
  "salaryOnCos": 30000,
  "actualSalary": 30000,
  "contractedHours": 40,
  "actualWorkingPattern": "Monday-Friday, day shifts",
  "workLocation": "Birmingham Depot",
  "visaExpiryDate": "2026-08-15",
  "rightToWorkCheckDate": "2024-01-15",
  "rightToWorkFollowupDate": "2026-07-15",
  "rightToWorkDocumentType": "BRP"
}
```

#### `POST /sponsored-workers/:id/changes`
Records a mandatory change event.

```json
Request:
{
  "changeType": "salary",
  "previousValue": "30000",
  "newValue": "32000",
  "effectiveDate": "2024-04-01",
  "reportedToHomeOffice": false,
  "notes": "Annual salary review"
}
```

#### `GET /sponsored-workers/audit-pack-status`
Returns checklist of all documents required for Home Office audit pack with present/missing status.

---

### Documents

#### `POST /employees/:id/documents`
`Content-Type: multipart/form-data`

```
Fields:
- file: (binary)
- documentType: "passport"
- expiryDate: "2029-03-20" (optional)
- notes: "Renewed passport" (optional)
```

#### `GET /employees/:id/documents`
Lists all documents for employee with download URLs.

#### `GET /documents/:id/download`
Returns a presigned URL (S3) or streams file (local). URL valid for 15 minutes.

#### `DELETE /documents/:id`
Soft delete. Audit log entry written. Role: director, hr_manager only.

---

## Module 2: Safety & Competency

### Training Records

#### `GET /employees/:id/training`
Returns full training matrix for an employee.

```json
Response 200:
{
  "success": true,
  "data": {
    "employeeId": "uuid",
    "employeeName": "James Okello",
    "trainingMatrix": [
      { "trainingType": "induction", "status": "completed", "completedDate": "2024-01-20", "trainer": "Tom Hughes" },
      { "trainingType": "cpc", "status": "completed", "completedDate": "2021-09-15", "expiryDate": "2026-09-14", "daysUntilExpiry": 284 },
      { "trainingType": "refresher", "status": "not_started", "completedDate": null }
    ],
    "completionPercent": 78
  }
}
```

#### `PUT /employees/:id/training/:trainingType`
Update a single training record.

```json
Request:
{
  "status": "completed",
  "completedDate": "2024-03-15",
  "expiryDate": "2026-03-14",
  "trainerName": "Safety Solutions Ltd",
  "certificateNumber": "CPC-2024-4521"
}
```

### Policy Acknowledgements

#### `GET /employees/:id/acknowledgements`
Lists all policy acknowledgements for an employee.

#### `POST /employees/:id/acknowledgements`
Driver signs a policy.

```json
Request:
{
  "policyType": "tachograph_rules",
  "policyVersion": "v2.1",
  "signatureData": "data:image/png;base64,...",
  "signedAt": "2024-03-15T09:30:00Z"
}
```
IP address is captured server-side from `req.ip`.

### Toolbox Talks

#### `GET /toolbox-talks`
Query params: `?status=pending_signoff&dateFrom=2024-01-01`

#### `POST /toolbox-talks`
```json
Request:
{
  "topic": "Winter Driving Safety",
  "description": "Key hazards and procedures for winter driving conditions.",
  "dateIssued": "2024-11-15",
  "assignedEmployeeIds": ["uuid1", "uuid2", "uuid3"]
}
```

#### `GET /toolbox-talks/:id`
Returns talk with full signed/unsigned staff list.

#### `POST /toolbox-talks/:id/sign`
Driver signs the toolbox talk.

```json
Request: { "signatureData": "data:image/png;base64,..." }
```

#### `POST /toolbox-talks/:id/manager-signoff`
Transport Manager or Director signs off a completed talk.

---

## Module 3: Fleet & Roadworthiness

### Vehicles

#### `GET /vehicles`
Query params: `?status=active&pmiDueDays=14&motExpiryDays=30`

```json
Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "registration": "FN16 EVK",
      "make": "Volvo", "model": "FH", "year": 2016,
      "status": "active",
      "motExpiryDate": "2025-02-28",
      "motDaysRemaining": 42,
      "lastPmiDate": "2024-11-01",
      "nextPmiDate": "2024-12-13",
      "pmiDaysRemaining": 5,
      "insuranceExpiryDate": "2025-06-30",
      "openDefects": 1,
      "assignedDriver": { "id": "uuid", "fullName": "James Okello" }
    }
  ]
}
```

#### `POST /vehicles`
```json
Request:
{
  "registration": "FN16 EVK",
  "vinNumber": "YV2A4B4C3GA123456",
  "make": "Volvo", "model": "FH", "year": 2016,
  "operatorLicenceDisc": "OL-2024-1234",
  "motExpiryDate": "2025-02-28",
  "roadTaxExpiryDate": "2025-03-31",
  "insuranceExpiryDate": "2025-06-30",
  "tachoCalibratio nExpiry": "2025-08-15",
  "pmiIntervalWeeks": 6,
  "lastPmiDate": "2024-11-01",
  "currentMileage": 245000,
  "assignedDriverId": "uuid",
  "status": "active"
}
```

#### `GET /vehicles/:id`
Full vehicle profile including all maintenance documents, recent checks, open defects.

#### `PUT /vehicles/:id`
#### `PATCH /vehicles/:id/status`
```json
Request: { "status": "vor", "reason": "Brake failure reported", "authorisedBy": "uuid" }
```

#### `GET /vehicles/pmi-planner`
Returns all vehicles in PMI schedule view.

```json
Response:
{
  "overdue": [...],
  "dueSoon": [...],       // within threshold days
  "booked": [...],
  "completed": [...],
  "missingPmiDate": [...],
  "missingBrakeTest": [...]
}
```

### Vehicle Documents

#### `POST /vehicles/:id/documents`
`Content-Type: multipart/form-data` — same pattern as employee documents.

#### `GET /vehicles/:id/documents`

---

### Daily Walk-Around Checks

#### `POST /checks`
Driver submits a daily check.

```json
Request:
{
  "vehicleId": "uuid",
  "checkDate": "2024-12-10",
  "checkTime": "06:45",
  "location": "Birmingham Depot",
  "mileage": 245320,
  "nilDefect": false,
  "items": [
    { "item": "tyres_wheel_nuts", "status": "ok" },
    { "item": "lights_indicators", "status": "defect_found", "notes": "Nearside front indicator not working" },
    { "item": "brakes", "status": "ok" }
  ],
  "signatureData": "data:image/png;base64,..."
}
```

If any item has `status: "defect_found"`, a defect case is automatically created.

#### `GET /checks`
Query params: `?vehicleId=uuid&driverId=uuid&dateFrom=2024-12-01&dateTo=2024-12-10`

#### `GET /checks/:id`
Full check record with all items.

#### `GET /checks/missed`
Returns vehicles that have not had a check submitted today (or for a given date).

---

### Defects

#### `GET /defects`
Query params: `?status=reported,under_review&severity=serious,dangerous&vehicleId=uuid`

```json
Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "referenceNumber": "DEF-2024-0042",
      "vehicle": { "registration": "FN16 EVK" },
      "reportedBy": { "fullName": "James Okello" },
      "reportedAt": "2024-12-10T06:47:00Z",
      "defectCategory": "Lights",
      "description": "Nearside front indicator not working",
      "severity": "minor",
      "vehicleAllowedToContinue": true,
      "status": "under_review",
      "daysOpen": 2
    }
  ]
}
```

#### `POST /defects`
Manual defect report (if not from a walk-around check).

```json
Request:
{
  "vehicleId": "uuid",
  "defectCategory": "Brakes",
  "description": "Brake pedal feels spongy",
  "severity": "serious",
  "vehicleAllowedToContinue": false,
  "photos": []
}
```

#### `GET /defects/:id`
Full defect case with timeline of status changes.

#### `PATCH /defects/:id/status`
Transport Manager progresses the defect workflow.

```json
Request:
{
  "status": "repair_booked",
  "repairGarage": "Midlands Truck Centre",
  "repairAction": "Replace nearside indicator unit",
  "reviewNotes": "Minor defect, vehicle can remain in service"
}
```

Valid transitions:
- `reported` → `under_review`
- `under_review` → `repair_booked`
- `repair_booked` → `repaired`
- `repaired` → `signed_off`

#### `POST /defects/:id/photos`
`Content-Type: multipart/form-data`

#### `POST /defects/:id/final-signoff`
```json
Request: { "signoffNotes": "Repair verified, vehicle returned to service" }
```
Role: transport_manager, director only.

---

### VOR Records

#### `GET /vor`
Query params: `?active=true`

#### `POST /vor`
```json
Request:
{
  "vehicleId": "uuid",
  "defectCaseId": "uuid",
  "takenOffRoadDate": "2024-12-10",
  "reason": "Serious brake defect, vehicle prohibited",
  "repairGarage": "Midlands Truck Centre",
  "estimatedReturnDate": "2024-12-14"
}
```

#### `PATCH /vor/:id/return`
```json
Request:
{
  "actualReturnDate": "2024-12-13",
  "signoffNotes": "Brake system repaired and tested. Vehicle roadworthy."
}
```
Automatically updates vehicle status from `vor` to `active`.

---

## Module 4: Driver Risk (MVP Partial)

### Driver Risk Summary

#### `GET /drivers/risk-summary`
Returns risk indicators per driver.

```json
Response:
{
  "success": true,
  "data": [
    {
      "driverId": "uuid",
      "driverName": "James Okello",
      "vehicle": "FN16 EVK",
      "tachoInfringements30Days": 2,
      "missedChecks30Days": 0,
      "openDefectsReported": 1,
      "cpcExpiryDate": "2026-09-14",
      "licenceCheckDue": false,
      "riskLevel": "low"
    }
  ]
}
```

---

## Reports

### `GET /reports/home-office/staff-list`
### `GET /reports/home-office/sponsored-workers`
### `GET /reports/home-office/right-to-work`
### `GET /reports/home-office/audit-pack-status`

### `GET /reports/dvsa/fleet-list`
### `GET /reports/dvsa/pmi-planner`
### `GET /reports/dvsa/defect-report`
### `GET /reports/dvsa/vor-history`
### `GET /reports/dvsa/daily-checks`

### `GET /reports/management/compliance-score`
### `GET /reports/management/overdue-actions`
### `GET /reports/management/driver-risk-ranking`

All reports accept `?format=json` (default) or `?format=csv`.

---

## Alerts

### `GET /alerts`
Query params: `?severity=critical,warning&resolved=false&type=pmi_due`

### `PATCH /alerts/:id/resolve`
```json
Request: { "resolutionNote": "PMI completed, sheet uploaded." }
```

---

## Audit Logs

### `GET /audit-logs`
Query params: `?entityType=defect_case&entityId=uuid&userId=uuid&dateFrom=...`
Role: director only.

---

## User Management

### `GET /users`
Role: director only.

### `POST /users`
```json
Request:
{
  "email": "driver.jones@256logistics.co.uk",
  "password": "TempPass123!",
  "role": "driver",
  "firstName": "David",
  "lastName": "Jones",
  "phone": "07700900002",
  "employeeId": "uuid"
}
```

### `PUT /users/:id`
### `PATCH /users/:id/deactivate`
### `POST /users/:id/reset-password`
