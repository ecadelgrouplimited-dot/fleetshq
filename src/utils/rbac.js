const ROLE_LABELS = {
  super_admin: 'Super Admin',
  director: 'Director / Executive',
  transport_manager: 'Compliance / Transport Manager',
  hr_manager: 'HR Manager',
  operations_manager: 'Dispatcher / Operations',
  fleet_manager: 'Fleet Manager',
  finance_officer: 'Finance Officer',
  trainer: 'Trainer / LMS Admin',
  driver: 'Driver',
  client: 'Client / Customer',
  garage: 'Garage / Maintenance',
};

const PANEL_LABELS = {
  super_admin: 'Super Admin',
  executive: 'Executive',
  hr: 'HR',
  client: 'Client Portal',
  driver: 'Driver',
  dispatch: 'Dispatcher/Ops',
  fleet: 'Fleet Manager',
  finance: 'Finance',
  compliance: 'Compliance & Safety',
  lms: 'LMS',
};

const PANEL_HOME = {
  super_admin: '/super-admin',
  executive: '/executive',
  hr: '/hr',
  client: '/portal',
  driver: '/driver/jobs',
  dispatch: '/dispatch',
  fleet: '/fleet/overview',
  finance: '/finance',
  compliance: '/compliance',
  lms: '/lms',
};

const ROLE_PANELS = {
  super_admin: ['super_admin', 'executive', 'hr', 'dispatch', 'fleet', 'finance', 'compliance', 'lms'],
  director: ['super_admin', 'executive', 'hr', 'dispatch', 'fleet', 'finance', 'compliance', 'lms'],
  hr_manager: ['hr', 'finance', 'compliance', 'lms'],
  operations_manager: ['dispatch', 'fleet', 'compliance'],
  fleet_manager: ['dispatch', 'fleet', 'finance', 'compliance'],
  finance_officer: ['executive', 'hr', 'fleet', 'finance'],
  transport_manager: ['hr', 'dispatch', 'fleet', 'compliance', 'lms'],
  trainer: ['hr', 'compliance', 'lms'],
  driver: ['hr', 'driver', 'finance', 'compliance', 'lms'],
  client: ['client', 'finance'],
  garage: ['fleet', 'finance', 'compliance'],
};

const getUserRoles = (user = {}) => {
  const roles = Array.isArray(user.roles) ? user.roles.filter(Boolean) : [];
  if (user.role) roles.unshift(user.role);
  return [...new Set(roles)];
};

const hasAnyRole = (user, roles = []) => getUserRoles(user).some((role) => roles.includes(role));

const getUserPanels = (user = {}) => {
  const panels = getUserRoles(user).flatMap((role) => ROLE_PANELS[role] || []);
  return [...new Set(panels)].map((id) => ({ id, label: PANEL_LABELS[id], href: PANEL_HOME[id] || '/' }));
};

const hasPanel = (user, panel) => getUserPanels(user).some((item) => item.id === panel);

const roleLabel = (role) => ROLE_LABELS[role] || String(role || '').replace(/_/g, ' ');

module.exports = {
  ROLE_LABELS,
  PANEL_LABELS,
  PANEL_HOME,
  ROLE_PANELS,
  getUserRoles,
  getUserPanels,
  hasAnyRole,
  hasPanel,
  roleLabel,
};
