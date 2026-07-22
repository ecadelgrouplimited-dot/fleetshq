const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { sign } = require('../config/jwt');
const { ok } = require('../utils/responseHelper');
const { AuthError, ValidationError } = require('../utils/errors');
const { lockMinutesRemaining, registerFailure, registerSuccess } = require('../utils/loginGuard');
const { checkPassword } = require('../utils/passwordPolicy');
const { getUserRoles } = require('../utils/rbac');
const { sendMail } = require('../services/mail.service');
const emailTemplates = require('../services/emailTemplates');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new ValidationError('Email and password are required');

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { employee: { select: { id: true, fullName: true } } },
    });

    if (!user || !user.isActive) throw new AuthError('Invalid email or password');

    const lockedFor = lockMinutesRemaining(user);
    if (lockedFor > 0) throw new AuthError(`Account temporarily locked. Try again in ${lockedFor} minute${lockedFor !== 1 ? 's' : ''}.`);

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      await registerFailure(user);
      throw new AuthError('Invalid email or password');
    }

    await registerSuccess(user);

    // Suspension gate at sign-in.
    const { isTenantSuspended } = require('../utils/tenantStatus');
    if (await isTenantSuspended(user.tenantId)) {
      throw new AuthError("This organisation's FLEETS.HQ subscription is paused. Contact your administrator.");
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = sign({
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      roles: getUserRoles(user),
      branchIds: user.branchIds || [],
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      employeeId: user.employee?.id || null,
    });

    // Set cookie for web sessions
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
    });

    return ok(res, {
      token,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        roles: getUserRoles(user),
        branchIds: user.branchIds || [],
        email: user.email,
        employeeId: user.employee?.id || null,
      },
    });
  } catch (e) { next(e); }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  return ok(res, { message: 'Logged out successfully' });
};

// Self-service change password (requires the current password).
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) throw new ValidationError('Current and new password are required');
    const pwError = checkPassword(newPassword);
    if (pwError) throw new ValidationError(pwError);

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) throw new AuthError();
    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) throw new AuthError('Your current password is incorrect');
    if (await bcrypt.compare(newPassword, user.passwordHash)) throw new ValidationError('New password must be different from the current one');

    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(newPassword, 10), passwordChangedAt: new Date() } });
    const when = new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/London' });
    sendMail({ to: user.email, ...emailTemplates.passwordChanged({ name: user.firstName, when, context: 'account settings' }) }).catch(() => {});
    return ok(res, { message: 'Password changed successfully' });
  } catch (e) { next(e); }
};

exports.me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, tenantId: true, email: true, role: true, roles: true, branchIds: true, firstName: true, lastName: true, phone: true, lastLoginAt: true },
    });
    return ok(res, user);
  } catch (e) { next(e); }
};
