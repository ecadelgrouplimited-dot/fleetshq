const app = require('../server');
const prisma = require('../src/config/database');
const { loginAgent } = require('./helpers');

describe('web session API access', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('allows a logged-in director cookie session to create a user', async () => {
    const email = `session-test-${Date.now()}@fleetshq.local`;
    const agent = await loginAgent(app, 'director@fleetshq.local');

    await agent
      .post('/api/v1/users')
      .send({
        email,
        password: 'ChangeMe2026!',
        role: 'operations_manager',
        firstName: 'Session',
        lastName: 'Test',
      })
      .expect(201);

    const created = await prisma.user.findUnique({ where: { email } });

    await agent
      .delete(`/api/v1/users/${created.id}`)
      .expect(200);

    const deleted = await prisma.user.findUnique({ where: { email } });
    expect(deleted).toBeNull();
  });

  it('allows a logged-in director cookie session to create and delete clean employee and vehicle records', async () => {
    const employeeEmail = `employee-delete-${Date.now()}@fleetshq.local`;
    const registration = `DL${String(Date.now()).slice(-4)}`;
    const agent = await loginAgent(app, 'director@fleetshq.local');

    const employeeRes = await agent
      .post('/api/v1/employees')
      .send({
        fullName: 'Delete Test Employee',
        dateOfBirth: '1992-01-15',
        homeAddress: '1 Test Close',
        phone: '07700900999',
        email: employeeEmail,
        jobTitle: 'Planner',
        department: 'Operations',
        startDate: '2026-06-16',
        contractedHours: 40,
        salary: 32000,
        workLocation: 'Main Depot',
        isDriver: false,
        isSponsored: false,
      })
      .expect(201);

    const vehicleRes = await agent
      .post('/api/v1/vehicles')
      .send({
        registration,
        vinNumber: `VIN${Date.now()}`,
        make: 'DAF',
        model: 'XF',
        year: 2020,
        motExpiryDate: '2027-06-16',
        insuranceExpiryDate: '2027-06-16',
        pmiIntervalWeeks: 6,
        currentMileage: 100000,
        status: 'active',
      })
      .expect(201);

    await agent
      .delete(`/api/v1/employees/${employeeRes.body.data.id}`)
      .expect(200);

    await agent
      .delete(`/api/v1/vehicles/${vehicleRes.body.data.id}`)
      .expect(200);

    expect(await prisma.employee.findUnique({ where: { id: employeeRes.body.data.id } })).toBeNull();
    expect(await prisma.vehicle.findUnique({ where: { id: vehicleRes.body.data.id } })).toBeNull();
  });
});
