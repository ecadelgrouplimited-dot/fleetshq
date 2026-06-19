> **⚠️ SUPERSEDED FOR SCOPE (2026-06-19).** 256 Logistics is now a full logistics platform. The authoritative specification lives in [`docs/spec/`](spec/README.md). This document predates the platform vision and remains only as a **depth reference** for the compliance/HR/fleet-compliance domains.

# User Roles & Permissions — 256 Logistics Compliance Hub

## Role Definitions

| Role | Code | Description |
|------|------|-------------|
| Director | `director` | Full access to all modules, reports, and settings. Can sign off any record. |
| Transport Manager | `transport_manager` | Full fleet and driver management. Reviews defects, authorises VOR, signs off training audits. |
| HR Manager | `hr_manager` | Full employee and sponsored worker management. Manages Right to Work and Home Office pack. |
| Operations Manager | `operations_manager` | Read/manage driver allocation, vehicle status, defects, and training status. Cannot sign off compliance records. |
| Driver | `driver` | Limited access. Can only see their own profile, submit daily checks, report defects, and complete training tasks. |
| Garage Provider | `garage` | External login. Can only see defects and PMI jobs assigned to them, upload repair evidence and invoices. |

---

## Permission Matrix

### Legend
- **Full** — Create, Read, Update, Delete / Sign-off
- **Read** — View only
- **Own** — Only own records
- **Assigned** — Only records assigned to this user
- **Write** — Create and Update, no delete
- **-** — No access

| Resource | Director | Transport Mgr | HR Manager | Operations Mgr | Driver | Garage |
|----------|----------|---------------|------------|----------------|--------|--------|
| **Dashboard** | Full | Full | Partial (people/safety cards) | Partial (fleet/driver cards) | - | - |
| **Employees — View List** | Full | Read | Full | Read | - | - |
| **Employees — Create/Edit** | Full | - | Full | - | - | - |
| **Employees — Terminate** | Full | - | Full | - | - | - |
| **Own Employee Profile** | Full | Full | Full | Full | Read | - |
| **Employee Documents — Upload** | Full | - | Full | - | - | - |
| **Employee Documents — View** | Full | Read | Full | - | Own | - |
| **Employee Documents — Delete** | Full | - | Full | - | - | - |
| **Sponsored Workers** | Full | Read | Full | - | - | - |
| **Home Office Changes Log** | Full | Read | Full | - | - | - |
| **Home Office Audit Pack** | Full | - | Full | - | - | - |
| **Training Matrix — View** | Full | Full | Full | Full | Own | - |
| **Training Matrix — Update** | Full | Full | Write | - | - | - |
| **Policy Acknowledgements — Sign** | Full | Full | Full | Full | Own | - |
| **Policy Acknowledgements — View** | Full | Full | Full | Full | Own | - |
| **Toolbox Talks — Create** | Full | Full | - | - | - | - |
| **Toolbox Talks — Sign** | Full | Full | Full | Full | Own | - |
| **Toolbox Talks — Manager Sign-Off** | Full | Full | - | - | - | - |
| **Vehicles — View List** | Full | Full | - | Full | - | - |
| **Vehicles — Create/Edit** | Full | Full | - | - | - | - |
| **Vehicles — Change Status** | Full | Full | - | Read | - | - |
| **Vehicle Documents — Upload** | Full | Full | - | - | - | Assigned |
| **Vehicle Documents — View** | Full | Full | - | Read | - | Assigned |
| **PMI Planner** | Full | Full | - | Read | - | Assigned |
| **Walk-Around Checks — Submit** | Full | Full | - | - | Own | - |
| **Walk-Around Checks — View** | Full | Full | - | Full | Own | - |
| **Defects — Report** | Full | Full | - | Full | Own | - |
| **Defects — View All** | Full | Full | - | Full | Own | Assigned |
| **Defects — Review/Progress** | Full | Full | - | - | - | - |
| **Defects — Final Sign-Off** | Full | Full | - | - | - | - |
| **Defects — Upload Evidence** | Full | Full | - | - | - | Assigned |
| **Defect Invoice — Upload** | Full | Full | - | - | - | Assigned |
| **VOR — Create** | Full | Full | - | - | - | - |
| **VOR — Approve Return** | Full | Full | - | - | - | - |
| **VOR — View** | Full | Full | - | Full | - | - |
| **Driver Risk Summary** | Full | Full | - | Full | - | - |
| **Driver Debrief Records** | Full | Full | - | - | - | - |
| **Audit Evidence Folders** | Full | Read | Read | - | - | - |
| **Audit Trail Log** | Full | - | - | - | - | - |
| **Reports — Home Office** | Full | - | Full | - | - | - |
| **Reports — DVSA** | Full | Full | - | Read | - | - |
| **Reports — Management** | Full | Full | Read | Read | - | - |
| **Compliance Scores** | Full | Full | Full | Full | - | - |
| **Alerts — View** | Full | Full | Full | Full | Own | - |
| **Alerts — Resolve** | Full | Full | Full | - | - | - |
| **User Management** | Full | - | - | - | - | - |
| **System Settings** | Full | - | - | - | - | - |

---

## RBAC Implementation

### Permission Check Middleware

```javascript
// src/middleware/authorize.js

const PERMISSIONS = {
  'employees:list': ['director', 'transport_manager', 'hr_manager', 'operations_manager'],
  'employees:create': ['director', 'hr_manager'],
  'employees:update': ['director', 'hr_manager'],
  'employees:terminate': ['director', 'hr_manager'],
  'employees:documents:upload': ['director', 'hr_manager'],
  'employees:documents:delete': ['director', 'hr_manager'],
  'sponsored_workers:manage': ['director', 'hr_manager'],
  'training:update': ['director', 'transport_manager', 'hr_manager'],
  'toolbox_talks:create': ['director', 'transport_manager'],
  'toolbox_talks:signoff': ['director', 'transport_manager'],
  'vehicles:create': ['director', 'transport_manager'],
  'vehicles:update': ['director', 'transport_manager'],
  'vehicles:status': ['director', 'transport_manager'],
  'checks:view_all': ['director', 'transport_manager', 'operations_manager'],
  'defects:review': ['director', 'transport_manager'],
  'defects:signoff': ['director', 'transport_manager'],
  'vor:create': ['director', 'transport_manager'],
  'vor:approve_return': ['director', 'transport_manager'],
  'audit_logs:view': ['director'],
  'users:manage': ['director'],
  'reports:home_office': ['director', 'hr_manager'],
  'reports:dvsa': ['director', 'transport_manager'],
};

const authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const hasPermission = requiredPermissions.every(perm => {
      const allowedRoles = PERMISSIONS[perm] || [];
      return allowedRoles.includes(userRole);
    });

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action' }
      });
    }
    next();
  };
};
```

### Route Usage Example

```javascript
// src/routes/employees.routes.js
router.get('/', authenticate, authorize('employees:list'), employeesController.list);
router.post('/', authenticate, authorize('employees:create'), employeesController.create);
router.put('/:id', authenticate, authorize('employees:update'), employeesController.update);
router.patch('/:id/status', authenticate, authorize('employees:terminate'), employeesController.updateStatus);
```

### Driver Own-Record Filter

When a driver hits a list endpoint, the controller applies an additional filter:

```javascript
// In controller
if (req.user.role === 'driver') {
  filters.employeeId = req.user.employeeId;
}
```

### Garage Assigned-Record Filter

```javascript
if (req.user.role === 'garage') {
  filters.assignedGarageId = req.user.id;
}
```

---

## Sign-Off Authority

Some records require a specific role to sign off:

| Record Type | Required Sign-Off Role |
|-------------|----------------------|
| Defect case final closure | transport_manager OR director |
| VOR return to service | transport_manager OR director |
| Toolbox talk completion | transport_manager OR director |
| Home Office audit pack | hr_manager OR director |
| DVSA audit pack | transport_manager OR director |
| Training record (manual update) | transport_manager OR hr_manager OR director |

---

## Session & Security Rules

- JWT tokens expire after 8 hours
- Drivers and garage users are forced to re-login daily
- Failed login attempts: lock account after 5 consecutive failures (15-minute lockout)
- All sign-off actions require the user's current session — no signing on behalf of another user
- Password must be minimum 8 characters with at least one number and one uppercase letter
- Garage users can only be created by a Director and are scoped to a specific company
