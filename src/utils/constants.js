const ROLES = {
  SUPER_ADMIN: 'super_admin',
  DIRECTOR: 'director',
  TRANSPORT_MANAGER: 'transport_manager',
  HR_MANAGER: 'hr_manager',
  OPERATIONS_MANAGER: 'operations_manager',
  FLEET_MANAGER: 'fleet_manager',
  FINANCE_OFFICER: 'finance_officer',
  TRAINER: 'trainer',
  DRIVER: 'driver',
  CLIENT: 'client',
  GARAGE: 'garage',
};

const PERMISSIONS = {
  'employees:list':     ['super_admin', 'director', 'transport_manager', 'hr_manager', 'operations_manager', 'finance_officer', 'trainer'],
  'employees:create':   ['super_admin', 'director', 'hr_manager'],
  'employees:update':   ['super_admin', 'director', 'hr_manager'],
  'employees:terminate':['super_admin', 'director', 'hr_manager'],
  'employees:delete':   ['super_admin', 'director', 'hr_manager'],
  'employees:docs:upload': ['super_admin', 'director', 'hr_manager'],
  'employees:docs:delete': ['super_admin', 'director', 'hr_manager'],
  'sponsored:manage':   ['super_admin', 'director', 'hr_manager'],
  'training:update':    ['super_admin', 'director', 'transport_manager', 'hr_manager', 'trainer'],
  'toolbox:create':     ['super_admin', 'director', 'transport_manager', 'trainer'],
  'toolbox:signoff':    ['super_admin', 'director', 'transport_manager'],
  'vehicles:create':    ['super_admin', 'director', 'transport_manager', 'fleet_manager'],
  'vehicles:update':    ['super_admin', 'director', 'transport_manager', 'fleet_manager'],
  'vehicles:status':    ['super_admin', 'director', 'transport_manager', 'fleet_manager'],
  'vehicles:delete':    ['super_admin', 'director', 'transport_manager', 'fleet_manager'],
  'checks:view_all':    ['super_admin', 'director', 'transport_manager', 'operations_manager', 'fleet_manager'],
  'defects:review':     ['super_admin', 'director', 'transport_manager', 'fleet_manager'],
  'defects:signoff':    ['super_admin', 'director', 'transport_manager'],
  'vor:create':         ['super_admin', 'director', 'transport_manager', 'fleet_manager'],
  'vor:approve':        ['super_admin', 'director', 'transport_manager'],
  'audit:view':         ['super_admin', 'director'],
  'users:manage':       ['super_admin', 'director'],
  'reports:home_office':['super_admin', 'director', 'hr_manager'],
  'reports:dvsa':       ['super_admin', 'director', 'transport_manager', 'fleet_manager'],
  'reports:management': ['super_admin', 'director', 'transport_manager', 'hr_manager', 'operations_manager', 'fleet_manager', 'finance_officer', 'trainer'],
};

const DEFECT_STATUS_TRANSITIONS = {
  reported:      ['under_review'],
  under_review:  ['repair_booked'],
  repair_booked: ['repaired'],
  repaired:      ['signed_off'],
  signed_off:    [],
};

const ALERT_THRESHOLDS = {
  CRITICAL: parseInt(process.env.ALERT_CRITICAL_DAYS) || 7,
  WARNING:  parseInt(process.env.ALERT_WARNING_DAYS)  || 14,
  NOTICE:   parseInt(process.env.ALERT_NOTICE_DAYS)   || 30,
};

const TRAINING_TYPES = [
  'induction','hgv_induction','tachograph','drivers_hours','walk_around_check',
  'defect_reporting','load_security','health_safety','accident_reporting',
  'mobile_phone','drug_alcohol','fatigue_management','fuel_card','yard_rules',
  'vehicle_cleanliness','customer_site','manual_handling','fire_safety','refresher','cpc',
];

const TRAINING_LABELS = {
  induction: 'General Induction',
  hgv_induction: 'HGV Driver Induction',
  tachograph: 'Tachograph Training',
  drivers_hours: "Drivers' Hours Rules",
  walk_around_check: 'Daily Walk-Around Check',
  defect_reporting: 'Defect Reporting',
  load_security: 'Load Security',
  health_safety: 'Health & Safety',
  accident_reporting: 'Accident Reporting',
  mobile_phone: 'Mobile Phone Policy',
  drug_alcohol: 'Drug & Alcohol Policy',
  fatigue_management: 'Fatigue Management',
  fuel_card: 'Fuel Card Policy',
  yard_rules: 'Yard Rules',
  vehicle_cleanliness: 'Vehicle Cleanliness Policy',
  customer_site: 'Customer Site Rules',
  manual_handling: 'Manual Handling',
  fire_safety: 'Fire Safety',
  refresher: 'Refresher Training',
  cpc: 'CPC Periodic Training',
};

const CHECK_ITEMS = [
  'tyres_wheel_nuts','lights_indicators','brakes','steering','mirrors',
  'windscreen_wipers','horn','number_plates','bodywork','fuel_adblue',
  'warning_lights','tachograph','load_security','leaks','coupling',
  'fifth_wheel','mudguards','reflectors',
];

const CHECK_ITEM_LABELS = {
  tyres_wheel_nuts: 'Tyres & Wheel Nuts',
  lights_indicators: 'Lights & Indicators',
  brakes: 'Brakes',
  steering: 'Steering',
  mirrors: 'Mirrors',
  windscreen_wipers: 'Windscreen & Wipers',
  horn: 'Horn',
  number_plates: 'Number Plates',
  bodywork: 'Bodywork',
  fuel_adblue: 'Fuel & AdBlue',
  warning_lights: 'Warning Lights',
  tachograph: 'Tachograph',
  load_security: 'Load Security',
  leaks: 'Leaks',
  coupling: 'Coupling (if trailer)',
  fifth_wheel: 'Fifth Wheel',
  mudguards: 'Mudguards',
  reflectors: 'Reflectors',
};

// Compliance tasks (Phase C)
const TASK_CATEGORIES = ['vehicle_compliance', 'driver_compliance', 'tachograph', 'insurance', 'health_safety', 'training', 'licensing', 'other'];
const TASK_CATEGORY_LABELS = {
  vehicle_compliance: 'Vehicle Compliance',
  driver_compliance: 'Driver Compliance',
  tachograph: 'Tachograph',
  insurance: 'Insurance',
  health_safety: 'Health & Safety',
  training: 'Training',
  licensing: 'Licensing',
  other: 'Other',
};
const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const TASK_STATUSES = ['not_started', 'in_progress', 'completed', 'cancelled'];

module.exports = {
  ROLES, PERMISSIONS, DEFECT_STATUS_TRANSITIONS,
  ALERT_THRESHOLDS, TRAINING_TYPES, TRAINING_LABELS,
  CHECK_ITEMS, CHECK_ITEM_LABELS,
  TASK_CATEGORIES, TASK_CATEGORY_LABELS, TASK_PRIORITIES, TASK_STATUSES,
};
