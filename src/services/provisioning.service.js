const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../config/database');
const { runWithTenant } = require('../utils/tenantContext');

/**
 * Tenant provisioning — the single place a paying/approved business becomes a
 * live FLEET.HQ environment: Tenant + Company + head-office Branch + admin
 * User (temp password, forced change on first sign-in).
 *
 * Used by Platform Admin manual onboarding and by self-serve registration
 * approval; a future payment webhook (Stripe) calls this too — see
 * docs/ONBOARDING_AND_BILLING_PLAN.md §5.
 */

const TENANT_ADMIN_ROLES = ['director', 'transport_manager', 'operations_manager', 'hr_manager'];

const slugify = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 48);

// Readable temporary password: letters + digits, e.g. "Fleet-kRtMq482".
const generateTempPassword = () => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  let p = 'Fleet-';
  for (let i = 0; i < 5; i++) p += letters[crypto.randomInt(letters.length)];
  for (let i = 0; i < 3; i++) p += digits[crypto.randomInt(digits.length)];
  return p;
};

/** Global email-uniqueness check (raw query bypasses tenant scoping). */
const adminEmailInUse = async (email) => {
  const rows = await prisma.$queryRaw`SELECT 1 FROM "User" WHERE LOWER(email) = ${email.toLowerCase()} LIMIT 1`;
  return Array.isArray(rows) && rows.length > 0;
};

/**
 * Create a fully-working tenant environment. Throws on invalid input or
 * duplicate admin email. Returns { tenant, adminUser, tempPassword }.
 */
const provisionTenant = async ({
  tradingName, slug, plan = 'starter', status = 'trial',
  publicName, legalName, operatorLicence, registeredAddress, timezone, accentColour, branchName,
  adminEmail, adminFirst, adminLast, adminPhone, adminRole = 'director',
  notes,
}) => {
  const name = (tradingName || '').trim();
  const email = (adminEmail || '').trim().toLowerCase();
  if (!name) throw new Error('Business trading name is required.');
  if (!adminFirst || !adminLast) throw new Error("The primary admin's first and last name are required.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('A valid primary admin email is required.');
  if (await adminEmailInUse(email)) throw new Error('That admin email is already in use on the platform.');

  const role = TENANT_ADMIN_ROLES.includes(adminRole) ? adminRole : 'director';
  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug: slugify(slug || name) || slugify(`${name}-${Date.now()}`),
      plan: (plan || 'starter').trim(),
      status: ['active', 'trial', 'suspended'].includes(status) ? status : 'trial',
      onboardedAt: new Date(),
      primaryContactName: `${adminFirst} ${adminLast}`,
      primaryContactEmail: email,
      primaryContactPhone: adminPhone || null,
      notes: notes || null,
    },
  });

  let adminUser;
  await runWithTenant(tenant.id, async () => {
    const company = await prisma.company.create({
      data: {
        name: (publicName || name).trim(),
        legalName: legalName || null,
        operatorLicenceNumber: operatorLicence || null,
        registeredAddress: registeredAddress || null,
        timezone: timezone || 'Europe/London',
        branding: { publicName: (publicName || name).trim(), accentColor: accentColour || '#e11d2a' },
      },
    });
    const branch = await prisma.branch.create({ data: { name: (branchName || '').trim() || 'Head Office', companyId: company.id } });
    adminUser = await prisma.user.create({
      data: {
        email, passwordHash, role, roles: [role],
        firstName: adminFirst.trim(), lastName: adminLast.trim(), phone: adminPhone || null,
        isActive: true, mustChangePassword: true, companyId: company.id, branchIds: [branch.id],
      },
    });
  });

  return { tenant, adminUser, tempPassword };
};

module.exports = { provisionTenant, generateTempPassword, TENANT_ADMIN_ROLES, adminEmailInUse };
