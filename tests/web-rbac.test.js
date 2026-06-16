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
});
