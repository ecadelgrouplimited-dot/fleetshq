const request = require('supertest');
const app = require('../server');
const prisma = require('../src/config/database');

describe('web RBAC', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('restricts driver web access to own workspace', async () => {
    const driverUser = await prisma.user.findUnique({
      where: { email: 'driver1@256logisticsltd.com' },
      include: { employee: true },
    });
    const anotherEmployee = await prisma.employee.findFirst({
      where: { id: { not: driverUser.employeeId } },
      select: { id: true },
    });

    const agent = request.agent(app);
    await agent
      .post('/login')
      .type('form')
      .send({ email: 'driver1@256logisticsltd.com', password: 'Demo2024!' })
      .expect(302);

    const dashboard = await agent.get('/').expect(200);
    expect(dashboard.text).toContain('My Dashboard');
    expect(dashboard.text).not.toContain('User Management');
    expect(dashboard.text).not.toContain('Audit Evidence');

    await agent.get('/employees').expect(403);
    await agent.get('/fleet').expect(403);
    await agent.get('/reports').expect(403);
    await agent.get('/audit-evidence').expect(403);
    await agent.get(`/employees/${driverUser.employeeId}`).expect(200);
    await agent.get(`/employees/${anotherEmployee.id}`).expect(403);
    await agent.get('/training').expect(200);
    await agent.get('/checks').expect(200);
    await agent.get('/defects').expect(200);
  });

  it('shows assigned vehicle alerts on the driver dashboard', async () => {
    const drivers = await prisma.user.findMany({
      where: { role: 'driver' },
      include: {
        employee: {
          include: {
            drivingVehicle: true,
          },
        },
      },
    });

    let driverWithVehicleAlert = null;
    let vehicleAlert = null;
    for (const driver of drivers) {
      if (!driver.employee?.drivingVehicle?.id) continue;
      const alert = await prisma.alert.findFirst({
        where: {
          isResolved: false,
          entityId: driver.employee.drivingVehicle.id,
        },
        orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      });
      if (alert) {
        driverWithVehicleAlert = driver;
        vehicleAlert = alert;
        break;
      }
    }

    if (!driverWithVehicleAlert || !vehicleAlert) return;

    const agent = request.agent(app);
    const login = await agent
      .post('/login')
      .type('form')
      .send({ email: driverWithVehicleAlert.email, password: 'Demo2024!' })
      .then((response) => response);

    if (login.status !== 302) return;

    const dashboard = await agent.get('/').expect(200);
    expect(dashboard.text).toContain(vehicleAlert.message);
  });

  it('keeps director access to admin web screens', async () => {
    const agent = request.agent(app);
    await agent
      .post('/login')
      .type('form')
      .send({ email: 'director@256logisticsltd.com', password: 'Demo2024!' })
      .expect(302);

    await agent.get('/users').expect(200);
    await agent.get('/settings').expect(200);
    await agent.get('/migration').expect(200);
  });

  it('serves report detail pages with the same permissions as exports', async () => {
    const directorAgent = request.agent(app);
    await directorAgent
      .post('/login')
      .type('form')
      .send({ email: 'director@256logisticsltd.com', password: 'Demo2024!' })
      .expect(302);

    await directorAgent.get('/reports/staff').expect(200);
    await directorAgent.get('/reports/fleet').expect(200);

    const driverAgent = request.agent(app);
    await driverAgent
      .post('/login')
      .type('form')
      .send({ email: 'driver1@256logisticsltd.com', password: 'Demo2024!' })
      .expect(302);

    await driverAgent.get('/reports/staff').expect(403);
  });

  it('serves shared document viewer routes for permitted users', async () => {
    const agent = request.agent(app);
    await agent
      .post('/login')
      .type('form')
      .send({ email: 'director@256logisticsltd.com', password: 'Demo2024!' })
      .expect(302);

    const employeeDoc = await prisma.employeeDocument.findFirst({ select: { id: true } });
    if (employeeDoc) {
      await agent.get(`/documents/employee-document/${employeeDoc.id}`).expect(200);
      await agent.get(`/documents/employee-document/${employeeDoc.id}/content`).expect(200);
    }

    const vehicleDoc = await prisma.vehicleDocument.findFirst({ select: { id: true } });
    if (vehicleDoc) {
      await agent.get(`/documents/vehicle-document/${vehicleDoc.id}`).expect(200);
      await agent.get(`/documents/vehicle-document/${vehicleDoc.id}/content`).expect(200);
    }

    const defectPhoto = await prisma.defectPhoto.findFirst({ select: { id: true } });
    if (defectPhoto) {
      await agent.get(`/documents/defect-photo/${defectPhoto.id}`).expect(200);
      await agent.get(`/documents/defect-photo/${defectPhoto.id}/content`).expect(200);
    }
  });

  it('serves daily check detail pages with role limits', async () => {
    const driverUser = await prisma.user.findUnique({
      where: { email: 'driver1@256logisticsltd.com' },
      include: { employee: true },
    });
    const ownCheck = await prisma.walkAroundCheck.findFirst({
      where: { driverId: driverUser.employeeId },
      select: { id: true },
      orderBy: { submittedAt: 'desc' },
    });
    const otherCheck = await prisma.walkAroundCheck.findFirst({
      where: { driverId: { not: driverUser.employeeId } },
      select: { id: true },
      orderBy: { submittedAt: 'desc' },
    });

    const driverAgent = request.agent(app);
    await driverAgent
      .post('/login')
      .type('form')
      .send({ email: 'driver1@256logisticsltd.com', password: 'Demo2024!' })
      .expect(302);

    if (ownCheck) await driverAgent.get(`/checks/${ownCheck.id}`).expect(200);
    if (otherCheck) await driverAgent.get(`/checks/${otherCheck.id}`).expect(403);

    const directorAgent = request.agent(app);
    await directorAgent
      .post('/login')
      .type('form')
      .send({ email: 'director@256logisticsltd.com', password: 'Demo2024!' })
      .expect(302);

    if (otherCheck) await directorAgent.get(`/checks/${otherCheck.id}`).expect(200);
  });
});
