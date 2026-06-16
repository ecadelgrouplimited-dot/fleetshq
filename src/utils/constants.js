const ROLES = {
  DIRECTOR: 'director',
  TRANSPORT_MANAGER: 'transport_manager',
  HR_MANAGER: 'hr_manager',
  OPERATIONS_MANAGER: 'operations_manager',
  DRIVER: 'driver',
  GARAGE: 'garage',
};

const PERMISSIONS = {
  'employees:list':     ['director', 'transport_manager', 'hr_manager', 'operations_manager'],
  'employees:create':   ['director', 'hr_manager'],
  'employees:update':   ['director', 'hr_manager'],
  'employees:terminate':['director', 'hr_manager'],
  'employees:docs:upload': ['director', 'hr_manager'],
  'employees:docs:delete': ['director', 'hr_manager'],
  'sponsored:manage':   ['director', 'hr_manager'],
  'training:update':    ['director', 'transport_manager', 'hr_manager'],
  'toolbox:create':     ['director', 'transport_manager'],
  'toolbox:signoff':    ['director', 'transport_manager'],
  'vehicles:create':    ['director', 'transport_manager'],
  'vehicles:update':    ['director', 'transport_manager'],
  'vehicles:status':    ['director', 'transport_manager'],
  'checks:view_all':    ['director', 'transport_manager', 'operations_manager'],
  'defects:review':     ['director', 'transport_manager'],
  'defects:signoff':    ['director', 'transport_manager'],
  'vor:create':         ['director', 'transport_manager'],
  'vor:approve':        ['director', 'transport_manager'],
  'audit:view':         ['director'],
  'users:manage':       ['director'],
  'reports:home_office':['director', 'hr_manager'],
  'reports:dvsa':       ['director', 'transport_manager'],
  'reports:management': ['director', 'transport_manager', 'hr_manager'],
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

module.exports = {
  ROLES, PERMISSIONS, DEFECT_STATUS_TRANSITIONS,
  ALERT_THRESHOLDS, TRAINING_TYPES, TRAINING_LABELS,
  CHECK_ITEMS, CHECK_ITEM_LABELS,
};
