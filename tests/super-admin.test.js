const bcrypt = require('bcryptjs');
const app = require('../server');
const prisma = require('../src/config/database');
const { loginAgent } = require('./helpers');
const { DEFAULT_TENANT_ID } = require('../src/utils/tenantContext');

describe('super admin panel', () => {
  const email = `super-admin-${Date.now()}@fleetshq.local`;
  const branchName = `P0.5 Test Branch ${Date.now()}`;
  const serviceCode = `P05${String(Date.now()).slice(-6)}`;

  beforeAll(async () => {
    await prisma.user.create({
      data: {
        tenantId: DEFAULT_TENANT_ID,
        email,
        passwordHash: await bcrypt.hash('Demo2024!', 10),
        role: 'super_admin',
        roles: ['super_admin', 'director'],
        firstName: 'Super',
        lastName: 'Admin',
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.serviceType.deleteMany({ where: { code: serviceCode } });
    await prisma.branch.deleteMany({ where: { name: branchName } });
    await prisma.systemConfig.deleteMany({ where: { category: 'notifications', key: 'email_sms' } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it('renders the super admin control room for a super admin', async () => {
    const agent = await loginAgent(app, email);
    const res = await agent.get('/super-admin').expect(200);

    expect(res.text).toContain('Platform Tenants');
    expect(res.text).toContain('Service Types & Basic Rates');
    expect(res.text).toContain('System Configuration');
  });

  it('lets super admins manage branches, services, and config', async () => {
    const agent = await loginAgent(app, email);

    await agent
      .post('/super-admin/branches')
      .type('form')
      .send({ name: branchName, address: 'Test Yard', serviceAreas: 'London, Midlands', hours: 'Mon-Fri' })
      .expect(302);

    await agent
      .post('/super-admin/service-types')
      .type('form')
      .send({ name: 'P0.5 Test Service', code: serviceCode, baseRate: '12.50', perMileRate: '1.25' })
      .expect(302);

    await agent
      .post('/super-admin/system-config')
      .type('form')
      .send({ alertFrom: 'alerts@example.com', smtpEnabled: 'false', smsProvider: 'not_configured', publicTrackingEnabled: 'true', leadNotificationsEnabled: 'true' })
      .expect(302);

    await expect(prisma.branch.findFirst({ where: { name: branchName } })).resolves.toBeTruthy();
    await expect(prisma.serviceType.findFirst({ where: { code: serviceCode } })).resolves.toMatchObject({ name: 'P0.5 Test Service' });
    await expect(prisma.systemConfig.findFirst({ where: { category: 'notifications', key: 'email_sms' } })).resolves.toBeTruthy();
  });

  it('keeps director access read-only', async () => {
    const agent = await loginAgent(app, 'director@fleetshq.local');
    const page = await agent.get('/super-admin').expect(200);
    expect(page.text).toContain('Director access is read-only');

    await agent
      .post('/super-admin/system-config')
      .type('form')
      .send({ alertFrom: 'director@example.com' })
      .expect(403);
  });
});
