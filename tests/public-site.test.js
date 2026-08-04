const request = require('supertest');
const app = require('../server');
const prisma = require('../src/config/database');

const csrfFrom = (res) => {
  const cookie = (res.headers['set-cookie'] || []).find((value) => value.startsWith('csrfToken='));
  return cookie ? cookie.split(';')[0].split('=')[1] : '';
};

describe('public site', () => {
  const createdEmails = [];

  afterAll(async () => {
    if (createdEmails.length) {
      await prisma.publicLead.deleteMany({ where: { email: { in: createdEmails } } });
    }
    await prisma.$disconnect();
  });

  it.each([
    ['/welcome', 'operating system for transport companies'],
    ['/contact', 'Send an enquiry'],
    ['/track', 'Track a shipment'],
  ])('renders %s', async (path, expectedText) => {
    const res = await request(app).get(path).expect(200);
    expect(res.text).toContain(expectedText);
  });

  it.each(['/about', '/services'])('redirects retired page %s to /welcome', async (path) => {
    const res = await request(app).get(path).expect(301);
    expect(res.headers.location).toBe('/welcome');
  });

  it('renders public tracking for a supplied reference', async () => {
    const res = await request(app).get('/track?ref=256-TEST-001').expect(200);
    // Unknown references echo back and report a friendly not-found result.
    expect(res.text).toContain('256-TEST-001');
    expect(res.text).toContain('ETA window');
  });

  it('shows live status for a real shipment reference', async () => {
    const svc = require('../src/services/shipment.service');
    const created = await svc.createShipment({
      serviceName: 'Test lane',
      pickupAddress: '1 Test Way', deliveryAddress: '2 Test Road',
      weightKg: 10, distanceMiles: 5,
    }, null);
    try {
      const res = await request(app).get(`/track?ref=${created.reference}`).expect(200);
      expect(res.text).toContain(created.reference);
      expect(res.text).toContain('Booked');
    } finally {
      await prisma.trackingEvent.deleteMany({ where: { shipmentId: created.id } });
      await prisma.shipment.delete({ where: { id: created.id } });
    }
  });

  it('captures a contact lead', async () => {
    const agent = request.agent(app);
    const page = await agent.get('/contact').expect(200);
    const token = csrfFrom(page);
    const email = `public-${Date.now()}@example.com`;
    createdEmails.push(email);

    await agent
      .post('/contact')
      .type('form')
      .send({
        _csrf: token,
        name: 'Public Test Lead',
        email,
        phone: '07000000000',
        company: 'Example Freight',
        enquiryType: 'quote',
        message: 'Please price a regular lane.',
      })
      .expect(302)
      .expect('Location', '/contact?sent=1');

    const lead = await prisma.publicLead.findFirst({ where: { email } });
    expect(lead).toMatchObject({
      name: 'Public Test Lead',
      enquiryType: 'quote',
      company: 'Example Freight',
    });
  });
});
