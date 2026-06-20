const prisma = require('../src/config/database');
const svc = require('../src/services/shipment.service');
const pricing = require('../src/services/pricing.service');

describe('pricing engine', () => {
  it('prices base + mileage + overweight + VAT', () => {
    const q = pricing.quote({ baseRate: 45, perMileRate: 1.1, name: 'Next-day' }, 120, 150);
    expect(q.net).toBe(186);            // 45 + 132 + 9
    expect(q.vat).toBe(37.2);
    expect(q.total).toBe(223.2);
    expect(q.lines.length).toBe(3);
  });

  it('omits the weight surcharge under the free allowance', () => {
    const q = pricing.quote({ baseRate: 30, perMileRate: 1, name: 'Economy' }, 10, 50);
    expect(q.lines.length).toBe(2);
    expect(q.net).toBe(40);
  });
});

describe('shipment lifecycle', () => {
  let shipmentId;

  afterAll(async () => {
    if (shipmentId) {
      await prisma.invoice.deleteMany({ where: { shipmentId } });
      await prisma.proofOfDelivery.deleteMany({ where: { shipmentId } });
      await prisma.job.deleteMany({ where: { shipmentId } });
      await prisma.trackingEvent.deleteMany({ where: { shipmentId } });
      await prisma.shipment.delete({ where: { id: shipmentId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it('books → allocates → delivers (POD) → invoices', async () => {
    const ship = await svc.createShipment({
      serviceName: 'Test lane',
      pickupAddress: '1 A St', deliveryAddress: '2 B Rd',
      weightKg: 20, distanceMiles: 30,
    }, null);
    shipmentId = ship.id;
    expect(ship.reference).toMatch(/^256-/);
    expect(ship.status).toBe('booked');

    // a real driver + vehicle from seed data
    const driver = await prisma.employee.findFirst({ where: { isDriver: true } });
    const vehicle = await prisma.vehicle.findFirst();
    await svc.allocate(ship.id, { driverId: driver?.id || null, vehicleId: vehicle?.id || null }, null);
    let s = await prisma.shipment.findUnique({ where: { id: ship.id }, include: { job: true } });
    expect(s.status).toBe('allocated');
    expect(s.job).not.toBeNull();

    await svc.setStatus(ship.id, 'collected', null);
    await svc.setStatus(ship.id, 'in_transit', null);
    await svc.setStatus(ship.id, 'out_for_delivery', null);

    await svc.recordPod(ship.id, { recipientName: 'Test Recipient', signatureData: 'sig' }, null);
    s = await prisma.shipment.findUnique({ where: { id: ship.id }, include: { pod: true, job: true } });
    expect(s.status).toBe('delivered');
    expect(s.pod).not.toBeNull();
    expect(s.job.status).toBe('completed');

    const inv = await svc.generateInvoice(ship.id, null);
    expect(inv.number).toMatch(/^INV-/);
    expect(Number(inv.total)).toBe(Number(s.priceTotal));

    // idempotent: generating again returns the same invoice
    const inv2 = await svc.generateInvoice(ship.id, null);
    expect(inv2.id).toBe(inv.id);

    const events = await prisma.trackingEvent.count({ where: { shipmentId: ship.id } });
    expect(events).toBeGreaterThanOrEqual(5);
  });
});
