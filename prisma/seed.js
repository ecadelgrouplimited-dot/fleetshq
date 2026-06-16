require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

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

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'director', firstName, lastName, phone, isActive: true },
    create: { email, passwordHash, role: 'director', firstName, lastName, phone, isActive: true },
  });

  console.log(`✓ Director account ready: ${user.email} (id ${user.id})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
