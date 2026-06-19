require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { DEFAULT_TENANT_ID } = require('../src/utils/tenantContext');

const prisma = new PrismaClient();

/**
 * Production seed — creates a SINGLE director (admin) account only.
 * Everything else (employees, vehicles, checks, etc.) is created from
 * scratch through the application UI.
 *
 * Credentials are read from the environment so the password is never
 * committed to source control:
 *   ADMIN_EMAIL     (default: director@256logisticsltd.com)
 *   ADMIN_PASSWORD  (required — no default)
 *   ADMIN_FIRST     (default: System)
 *   ADMIN_LAST      (default: Administrator)
 *   ADMIN_PHONE     (optional)
 *
 * Run:  ADMIN_PASSWORD='...' node prisma/seed.js
 * Re-running is safe (upsert) — it never wipes business data.
 */
async function main() {
  const email = (process.env.ADMIN_EMAIL || 'director@256logisticsltd.com').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const firstName = process.env.ADMIN_FIRST || 'System';
  const lastName = process.env.ADMIN_LAST || 'Administrator';
  const phone = process.env.ADMIN_PHONE || null;

  if (!password || password.length < 8) {
    console.error('✗ ADMIN_PASSWORD env var is required (min 8 chars). Aborting.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: { name: '256 Logistics', status: 'active' },
    create: {
      id: DEFAULT_TENANT_ID,
      name: '256 Logistics',
      slug: 'default',
      plan: 'starter',
      status: 'active',
    },
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: { tenantId: tenant.id, passwordHash, role: 'super_admin', roles: ['super_admin', 'director'], firstName, lastName, phone, isActive: true },
    create: { tenantId: tenant.id, email, passwordHash, role: 'super_admin', roles: ['super_admin', 'director'], firstName, lastName, phone, isActive: true },
  });

  const company = await prisma.company.upsert({
    where: { id: '00000000-0000-4000-8000-000000000101' },
    update: { tenantId: tenant.id, name: '256 Logistics', legalName: '256 Logistics Ltd', timezone: 'Europe/London' },
    create: {
      id: '00000000-0000-4000-8000-000000000101',
      tenantId: tenant.id,
      name: '256 Logistics',
      legalName: '256 Logistics Ltd',
      timezone: 'Europe/London',
    },
  });

  await prisma.branch.upsert({
    where: { id: '00000000-0000-4000-8000-000000000201' },
    update: { tenantId: tenant.id, companyId: company.id, name: 'Main Branch' },
    create: {
      id: '00000000-0000-4000-8000-000000000201',
      tenantId: tenant.id,
      companyId: company.id,
      name: 'Main Branch',
    },
  });

  const services = [
    ['Same-day Delivery', 'SAME_DAY', 'Urgent point-to-point movements.', '85.00', '1.85', 10],
    ['Next-day Delivery', 'NEXT_DAY', 'Planned next-day freight and parcels.', '45.00', '1.10', 20],
    ['Economy Freight', 'ECONOMY', 'Cost-efficient scheduled consignments.', '30.00', '0.85', 30],
    ['Pallet & Freight', 'PALLET', 'Palletised commercial loads.', '65.00', '1.35', 40],
    ['Courier Work', 'COURIER', 'Smaller urgent courier movements.', '25.00', '0.95', 50],
    ['Returns Route', 'RETURNS', 'Reverse logistics and recurring returns.', '40.00', '1.00', 60],
  ];

  for (const [name, code, description, baseRate, perMileRate, sortOrder] of services) {
    await prisma.serviceType.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code } },
      update: { name, description, baseRate, perMileRate, sortOrder, isActive: true },
      create: { tenantId: tenant.id, name, code, description, baseRate, perMileRate, sortOrder, isActive: true },
    });
  }

  console.log(`✓ Super Admin account ready: ${user.email} (id ${user.id})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
