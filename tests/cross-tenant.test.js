const request = require('supertest');
const app = require('../server');
const prisma = require('../src/config/database');
const { getCsrf } = require('./helpers');
const { runWithTenant } = require('../src/utils/tenantContext');
const { provisionTenant } = require('../src/services/provisioning.service');

/**
 * HTTP-level tenant isolation: a director of tenant B must never be able to
 * see or reach tenant A's data, nor platform administration.
 */
describe('cross-tenant isolation over HTTP', () => {
  const stamp = Date.now();
  const tenants = {};
  const secretEmployeeName = `Aaron CrossTenant Secret ${stamp}`;
  const secretVehicleReg = `XT${String(stamp).slice(-6)}`;
  let aEmployeeId;
  let aVehicleId;

  const loginDirector = async (key) => {
    const agent = request.agent(app);
    const token = await getCsrf(agent);
    agent.set('X-CSRF-Token', token);
    await agent.post('/login').type('form')
      .send({ email: tenants[key].email, password: tenants[key].password, _csrf: token }).expect(302);
    return agent;
  };

  beforeAll(async () => {
    for (const key of ['a', 'b']) {
      const email = `xt-${key}-${stamp}@example-fleet.co`;
      const { tenant, tempPassword } = await provisionTenant({
        tradingName: `XT ${key.toUpperCase()} Ltd ${stamp}`,
        adminEmail: email, adminFirst: 'Cross', adminLast: `Tenant${key.toUpperCase()}`,
      });
      await prisma.user.updateMany({ where: { tenantId: tenant.id }, data: { mustChangePassword: false } });
      tenants[key] = { id: tenant.id, email, password: tempPassword };
    }

    await runWithTenant(tenants.a.id, async () => {
      const employee = await prisma.employee.create({
        data: {
          fullName: secretEmployeeName, email: `xt-secret-${stamp}@example-fleet.co`, dateOfBirth: new Date('1990-01-01'),
          homeAddress: '1 Secret Street', phone: '07700900999', jobTitle: 'HGV Driver',
          department: 'Drivers', startDate: new Date('2026-01-01'), contractedHours: 40, salary: 32000,
          workLocation: 'Depot', employmentStatus: 'active', isDriver: true,
        },
      });
      aEmployeeId = employee.id;
      const vehicle = await prisma.vehicle.create({
        data: {
          registration: secretVehicleReg, vinNumber: `VIN${stamp}`, make: 'DAF', model: 'XF',
          year: 2023, motExpiryDate: new Date('2027-01-01'), insuranceExpiryDate: new Date('2027-01-01'),
          pmiIntervalWeeks: 6, currentMileage: 100, status: 'active',
        },
      });
      aVehicleId = vehicle.id;
    });
  });

  afterAll(async () => {
    for (const key of ['a', 'b']) {
      const tid = tenants[key]?.id;
      if (!tid) continue;
      await prisma.complianceScore.deleteMany({ where: { tenantId: tid } });
      await prisma.employee.deleteMany({ where: { tenantId: tid } });
      await prisma.vehicle.deleteMany({ where: { tenantId: tid } });
      await prisma.subscription.deleteMany({ where: { tenantId: tid } });
      await prisma.user.deleteMany({ where: { tenantId: tid } });
      await prisma.branch.deleteMany({ where: { tenantId: tid } });
      await prisma.company.deleteMany({ where: { tenantId: tid } });
      await prisma.tenant.delete({ where: { id: tid } });
    }
  });

  test("B cannot open A's employee record by ID", async () => {
    const b = await loginDirector('b');
    const res = await b.get(`/employees/${aEmployeeId}`);
    expect(res.status).not.toBe(200);
    expect(res.text).not.toContain(secretEmployeeName);
  });

  test("B cannot open A's vehicle by ID", async () => {
    const b = await loginDirector('b');
    const res = await b.get(`/fleet/${aVehicleId}`);
    expect(res.status).not.toBe(200);
    expect(res.text).not.toContain(secretVehicleReg);
  });

  test("B's employee list does not include A's employees", async () => {
    const b = await loginDirector('b');
    const res = await b.get('/employees').expect(200);
    expect(res.text).not.toContain(secretEmployeeName);
  });

  test("B's user API only returns B's users", async () => {
    const b = await loginDirector('b');
    const res = await b.get('/api/v1/users').expect(200);
    const emails = JSON.stringify(res.body);
    expect(emails).toContain(tenants.b.email);
    expect(emails).not.toContain(tenants.a.email);
  });

  test('a tenant director cannot reach Platform Admin', async () => {
    const b = await loginDirector('b');
    const res = await b.get('/platform');
    expect(res.status).toBe(403);
    const res2 = await b.get('/platform/settings');
    expect(res2.status).toBe(403);
    const token = await getCsrf(b);
    const res3 = await b.post(`/platform/tenants/${tenants.a.id}/update`).type('form')
      .send({ _csrf: token, status: 'suspended' });
    expect(res3.status).toBe(403);
    const aTenant = await prisma.tenant.findUnique({ where: { id: tenants.a.id } });
    expect(aTenant.status).not.toBe('suspended');
  });

  test('a tenant director cannot read platform billing config or other tenants via settings', async () => {
    const b = await loginDirector('b');
    // Their own tenant-scoped settings page is fine; platform settings is not.
    await b.get('/settings').expect(200);
    const res = await b.get('/platform/settings');
    expect(res.status).toBe(403);
  });

  test('new tenant dashboard shows the getting-started checklist', async () => {
    const b = await loginDirector('b');
    const res = await b.get('/').expect(200);
    expect(res.text).toContain("Let's get your fleet set up");
    expect(res.text).toContain('Add your first vehicle');
  });

  test("tenant A's dashboard checklist reflects its own progress", async () => {
    const a = await loginDirector('a');
    const res = await a.get('/').expect(200);
    // A has an employee and a vehicle -> those steps are done; invite-team is not.
    expect(res.text).toContain('Invite your team');
  });
});
