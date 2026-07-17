const crypto = require('crypto');
const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Self-serve registration: request lifecycle + email verification codes.
 * RegistrationRequest/VerificationCode are platform-level models (not
 * tenant-scoped), so no tenant context is needed here.
 */

const CODE_TTL_MS = 15 * 60 * 1000;   // codes valid 15 minutes
const MAX_ATTEMPTS = 5;               // guesses per code
const RESEND_WINDOW_MS = 60 * 60 * 1000;
const MAX_CODES_PER_WINDOW = 4;       // initial + 3 resends per hour
const RESEND_COOLDOWN_MS = 60 * 1000; // min gap between sends

// Common disposable-email domains — enough to deter drive-by abuse.
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
  'temp-mail.org', 'yopmail.com', 'sharklasers.com', 'trashmail.com',
  'getnada.com', 'dispostable.com', 'maildrop.cc', 'fakeinbox.com',
]);

const hashCode = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');

const isValidEmail = (email) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

const isDisposableEmail = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  return !!domain && DISPOSABLE_DOMAINS.has(domain);
};

/** Issue a fresh 6-digit code for a request. Returns { code } or { error }. */
const issueCode = async (requestId) => {
  const since = new Date(Date.now() - RESEND_WINDOW_MS);
  const recent = await prisma.verificationCode.findMany({
    where: { requestId, createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
  });
  if (recent.length >= MAX_CODES_PER_WINDOW) {
    return { error: 'Too many codes requested. Please try again in an hour.' };
  }
  if (recent[0] && Date.now() - recent[0].createdAt.getTime() < RESEND_COOLDOWN_MS) {
    return { error: 'A code was just sent — please wait a minute before requesting another.' };
  }

  const code = String(crypto.randomInt(100000, 1000000)); // 6 digits, no leading zero ambiguity
  await prisma.verificationCode.create({
    data: { requestId, codeHash: hashCode(code), expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });
  return { code };
};

/** Check a submitted code. Returns { ok } or { error }. Marks the request verified. */
const verifyCode = async (requestId, submitted) => {
  const code = await prisma.verificationCode.findFirst({
    where: { requestId, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!code) return { error: 'This code has expired. Please request a new one.' };
  if (code.attempts >= MAX_ATTEMPTS) return { error: 'Too many incorrect attempts. Please request a new code.' };

  if (hashCode(String(submitted).trim()) !== code.codeHash) {
    await prisma.verificationCode.update({ where: { id: code.id }, data: { attempts: { increment: 1 } } });
    const left = MAX_ATTEMPTS - code.attempts - 1;
    return { error: left > 0 ? `That code isn't right — ${left} attempt${left === 1 ? '' : 's'} remaining.` : 'Too many incorrect attempts. Please request a new code.' };
  }

  await prisma.$transaction([
    prisma.verificationCode.update({ where: { id: code.id }, data: { usedAt: new Date() } }),
    prisma.registrationRequest.update({ where: { id: requestId }, data: { status: 'verified', verifiedAt: new Date() } }),
  ]);
  return { ok: true };
};

/**
 * Companies House lookup (optional — set the key in /platform/settings or the
 * CH_API_KEY env). Never blocks registration: failures return a snapshot
 * marked accordingly and the request goes to manual review in Platform Admin.
 */
const companiesHouseLookup = async (companyRegNo, companyName) => {
  const { chApiKey } = await require('./platformConfig.service').getPlatformConfig();
  if (!chApiKey) return { checked: false, reason: 'no_api_key' };
  if (!companyRegNo) return { checked: false, reason: 'no_number_given' };
  try {
    const number = String(companyRegNo).replace(/\s+/g, '').toUpperCase();
    const res = await fetch(`https://api.company-information.service.gov.uk/company/${encodeURIComponent(number)}`, {
      headers: { Authorization: `Basic ${Buffer.from(chApiKey + ':').toString('base64')}` },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 404) return { checked: true, found: false };
    if (!res.ok) return { checked: false, reason: `http_${res.status}` };
    const data = await res.json();
    const officialName = (data.company_name || '').toLowerCase();
    const givenName = (companyName || '').toLowerCase();
    return {
      checked: true,
      found: true,
      companyName: data.company_name,
      companyStatus: data.company_status,
      companyType: data.type,
      incorporatedOn: data.date_of_creation,
      active: data.company_status === 'active',
      nameMatches: officialName.includes(givenName) || givenName.includes(officialName),
    };
  } catch (e) {
    logger.warn(`[registration] Companies House lookup failed for ${companyRegNo}: ${e.message}`);
    return { checked: false, reason: 'lookup_failed' };
  }
};

module.exports = {
  issueCode, verifyCode, companiesHouseLookup,
  isValidEmail, isDisposableEmail,
};
