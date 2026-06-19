const prisma = require('../src/config/database');
const { DEFAULT_TENANT_ID, runWithTenant } = require('../src/utils/tenantContext');

const vehicleData = (registration, vinNumber) => ({
  registration,
  vinNumber,
  make: 'DAF',
  model: 'XF',
  year: 2022,
  motExpiryDate: new Date('2027-06-16'),
  insuranceExpiryDate: new Date('2027-06-16'),
  pmiIntervalWeeks: 6,
  currentMileage: 1000,
  status: 'active',
});

describe('tenant isolation', () => {
  let otherTenantId;
  let defaultVehicleId;
  let otherVehicleId;

  afterAll(async () => {
    await prisma.vehicle.deleteMany({
      where: { id: { in: [defaultVehicleId, otherVehicleId].filter(Boolean) } },
    });
    if (otherTenantId) await prisma.tenant.delete({ where: { id: otherTenantId } });
    await prisma.$disconnect();
  });

  it('scopes reads and writes to the active tenant context', async () => {
    const suffix = String(Date.now()).slice(-6);
    const otherTenant = await prisma.tenant.create({
      data: {
        name: `Isolation Tenant ${suffix}`,
        slug: `isolation-${suffix}`,
        plan: 'starter',
        status: 'active',
      },
    });
    otherTenantId = otherTenant.id;

    const defaultVehicle = await runWithTenant(DEFAULT_TENANT_ID, () => prisma.vehicle.create({
      data: vehicleData(`TA${suffix.slice(-4)}`, `VIN-A-${suffix}`),
    }));
    defaultVehicleId = defaultVehicle.id;

    const otherVehicle = await runWithTenant(otherTenant.id, () => prisma.vehicle.create({
      data: vehicleData(`TB${suffix.slice(-4)}`, `VIN-B-${suffix}`),
    }));
    otherVehicleId = otherVehicle.id;

    const defaultVehicles = await runWithTenant(DEFAULT_TENANT_ID, () => prisma.vehicle.findMany({
      where: { id: { in: [defaultVehicle.id, otherVehicle.id] } },
      select: { id: true, tenantId: true },
      orderBy: { id: 'asc' },
    }));

    expect(defaultVehicles).toEqual([{ id: defaultVehicle.id, tenantId: DEFAULT_TENANT_ID }]);

    const crossTenantFetch = await runWithTenant(DEFAULT_TENANT_ID, () => prisma.vehicle.findUnique({
      where: { id: otherVehicle.id },
    }));

    expect(crossTenantFetch).toBeNull();
  });
});
