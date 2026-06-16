const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { ok, created } = require('../utils/responseHelper');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/errors');

exports.list = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, firstName: true, lastName: true,
        phone: true, isActive: true, lastLoginAt: true, employeeId: true },
      orderBy: [{ role: 'asc' }, { lastName: 'asc' }],
    });
    return ok(res, users);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { email, password, role, firstName, lastName, phone } = req.body;
    if (!email || !password || !role) throw new ValidationError('email, password and role are required');
    if (password.length < 8) throw new ValidationError('Password must be at least 8 characters');

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) throw new ConflictError('A user with this email already exists');

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash: await bcrypt.hash(password, 10),
        role, firstName, lastName, phone: phone || null, isActive: true,
      },
    });
    return created(res, { id: user.id, email: user.email, role: user.role });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const { isActive, phone, firstName, lastName } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new NotFoundError('User');

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(phone && { phone }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
      },
    });
    return ok(res, { id: updated.id, isActive: updated.isActive });
  } catch (e) { next(e); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) throw new ValidationError('Password must be at least 8 characters');

    await prisma.user.update({
      where: { id: req.params.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    });
    return ok(res, { message: 'Password reset successfully' });
  } catch (e) { next(e); }
};
