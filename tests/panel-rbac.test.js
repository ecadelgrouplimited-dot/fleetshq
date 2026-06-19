const { getUserPanels, getUserRoles, hasAnyRole, roleLabel } = require('../src/utils/rbac');

describe('panel RBAC helpers', () => {
  it('combines legacy primary role with multi-role assignments', () => {
    const user = {
      role: 'operations_manager',
      roles: ['fleet_manager', 'trainer'],
    };

    expect(getUserRoles(user)).toEqual(['operations_manager', 'fleet_manager', 'trainer']);
    expect(hasAnyRole(user, ['transport_manager', 'fleet_manager'])).toBe(true);
  });

  it('maps multi-role users to distinct panel switcher entries', () => {
    const panels = getUserPanels({
      role: 'operations_manager',
      roles: ['operations_manager', 'fleet_manager', 'trainer'],
    });

    expect(panels.map((panel) => panel.id)).toEqual([
      'dispatch',
      'fleet',
      'compliance',
      'finance',
      'hr',
      'lms',
    ]);
    expect(roleLabel('finance_officer')).toBe('Finance Officer');
  });
});
