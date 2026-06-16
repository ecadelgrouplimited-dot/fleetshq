const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { sign } = require('../config/jwt');
const { ok } = require('../utils/responseHelper');
const { AuthError, ValidationError } = require('../utils/errors');
const { lockMinutesRemaining, registerFailure, registerSuccess } = require('../utils/loginGuard');

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
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = sign({
      id: user.id,
      role: user.role,
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
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
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

exports.me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, role: true, firstName: true, lastName: true, phone: true, lastLoginAt: true },
    });
    return ok(res, user);
  } catch (e) { next(e); }
};
