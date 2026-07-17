const request = require('supertest');
const app = require('../server');
const prisma = require('../src/config/database');
const { getCsrf } = require('./helpers');
const { runWithTenant, DEFAULT_TENANT_ID } = require('../src/utils/tenantContext');
const { provisionTenant } = require('../src/services/provisioning.service');
const { calculateAndStore } = require('../src/services/compliance.service');

// Regression: scoreDate used to be globally unique, so the first dashboard
// load of any second tenant crashed with P2025 on complianceScore.upsert.
describe('per-tenant compliance scores', () => {
  const stamp = Date.now();
  const tenantIds = [];
  const tempPasswords = [];

  beforeAll(async () => {
    for (const n of [1, 2]) {
      const { tenant, tempPassword } = await provisionTenant({
        tradingName: `Score Test ${n} Ltd ${stamp}`,
        adminEmail: `score-test-${n}-${stamp}@example-fleet.co`,
        adminFirst: 'Score', adminLast: `Tester${n}`,
      });
      tenantIds.push(tenant.id);
      tempPasswords.push(tempPassword);
    }
  });

  afterAll(async () => {
    for (const tenantId of tenantIds) {
      await prisma.complianceScore.deleteMany({ where: { tenantId } });
      await prisma.subscription.deleteMany({ where: { tenantId } });
      await prisma.user.deleteMany({ where: { tenantId } });
      await prisma.branch.deleteMany({ where: { tenantId } });
      await prisma.company.deleteMany({ where: { tenantId } });
      await prisma.tenant.delete({ where: { id: tenantId } });
    }
  });

  test('two tenants can both store a score for the same day', async () => {
    // Platform tenant may already have today's row — compute it too, then both new tenants.
    await calculateAndStore(); // no tenant context -> platform tenant
    for (const tenantId of tenantIds) {
      await runWithTenant(tenantId, async () => {
        const result = await calculateAndStore();
        expect(result.overall).toBeGreaterThanOrEqual(0);
      });
    }

    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (const tenantId of tenantIds) {
      const row = await prisma.complianceScore.findFirst({ where: { tenantId, scoreDate: today } });
      expect(row).not.toBeNull();
    }
    const platformRow = await prisma.complianceScore.findFirst({ where: { tenantId: DEFAULT_TENANT_ID, scoreDate: today } });
    expect(platformRow).not.toBeNull();
  });

  test('the reported journey: onboarded admin logs in, sets password, dashboard renders', async () => {
    const email = `score-test-2-${stamp}@example-fleet.co`;
    const agent = request.agent(app);
    const token = await getCsrf(agent);
    agent.set('X-CSRF-Token', token);
    await agent.post('/login').type('form')
      .send({ email, password: tempPasswords[1], _csrf: token }).expect(302);

    // First-login forced password change.
    await agent.post('/set-password').type('form').send({
      _csrf: token, currentPassword: tempPasswords[1],
      newPassword: 'BrandNew_@2026x', confirmPassword: 'BrandNew_@2026x',
    }).expect(302);

    // The dashboard used to 500 here with prisma.complianceScore.upsert P2025.
    const res = await agent.get('/').expect(200);
    expect(res.text).toContain('Dashboard');
    expect(res.text).not.toContain('complianceScore');
  });

  test('re-running the same day updates rather than crashing', async () => {
    await runWithTenant(tenantIds[0], async () => {
      await expect(calculateAndStore()).resolves.toBeTruthy();
    });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const rows = await prisma.complianceScore.findMany({ where: { tenantId: tenantIds[0], scoreDate: today } });
    expect(rows).toHaveLength(1);
  });
});
