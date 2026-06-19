const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../config/database');
const { ok, created } = require('../utils/responseHelper');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/errors');
const { checkPassword } = require('../utils/passwordPolicy');
const { ROLE_LABELS, getUserRoles } = require('../utils/rbac');

const VALID_ROLES = Object.keys(ROLE_LABELS);
const normalizeRoles = (roles, fallbackRole) => {
  const list = Array.isArray(roles) ? roles : roles ? [roles] : [];
  if (fallbackRole) list.unshift(fallbackRole);
  const normalized = [...new Set(list.filter(Boolean))];
  if (normalized.length === 0) throw new ValidationError('At least one valid role is required');
  const invalid = normalized.find((role) => !VALID_ROLES.includes(role));
  if (invalid) throw new ValidationError(`Invalid role: ${invalid}`);
  return normalized;
};
const normalizeBranchIds = (branchIds) => (
  Array.isArray(branchIds) ? [...new Set(branchIds.filter(Boolean).map(String))] : []
);
const genTempPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(10);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('') + '#7';
};
const splitName = (full) => {
  const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
  return { firstName: parts.shift() || 'Staff', lastName: parts.join(' ') || '-' };
};

exports.list = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, roles: true, branchIds: true, firstName: true, lastName: true,
        phone: true, isActive: true, lastLoginAt: true, employeeId: true },
      orderBy: [{ role: 'asc' }, { lastName: 'asc' }],
    });
    return ok(res, users);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { email, password, role, roles, branchIds, firstName, lastName, phone } = req.body;
    if (!email || !password || !role) throw new ValidationError('email, password and role are required');
    const pwError = checkPassword(password);
    if (pwError) throw new ValidationError(pwError);
    const roleList = normalizeRoles(roles, role);
    const normalizedBranchIds = normalizeBranchIds(branchIds);

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) throw new ConflictError('A user with this email already exists');

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash: await bcrypt.hash(password, 10),
        role: roleList[0], roles: roleList, branchIds: normalizedBranchIds, branchId: normalizedBranchIds[0] || null,
        firstName, lastName, phone: phone || null, isActive: true,
      },
    });
    return created(res, { id: user.id, email: user.email, role: user.role, roles: getUserRoles(user) });
  } catch (e) { next(e); }
};

// Create login accounts from existing employee records (bulk), linked via employeeId.
exports.createFromEmployees = async (req, res, next) => {
  try {
    const { employeeIds, role } = req.body;
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) throw new ValidationError('Select at least one employee');
    if (!VALID_ROLES.includes(role)) throw new ValidationError('A valid role is required');
    if (employeeIds.length > 500) throw new ValidationError('Limit 500 at a time');

    const results = [];
    for (const employeeId of employeeIds) {
      try {
        const emp = await prisma.employee.findUnique({ where: { id: employeeId }, include: { userAccount: { select: { id: true } } } });
        if (!emp) { results.push({ status: 'failed', name: '', email: '', message: 'employee not found' }); continue; }
        const email = (emp.email || '').toLowerCase().trim();
        if (!email) { results.push({ status: 'failed', name: emp.fullName, email: '', message: 'no email on record' }); continue; }
        if (emp.userAccount) { results.push({ status: 'skipped', name: emp.fullName, email, message: 'already has an account' }); continue; }
        if (await prisma.user.findUnique({ where: { email } })) { results.push({ status: 'skipped', name: emp.fullName, email, message: 'email already in use' }); continue; }

        const tempPassword = genTempPassword();
        const { firstName, lastName } = splitName(emp.fullName);
        await prisma.user.create({
          data: { email, passwordHash: await bcrypt.hash(tempPassword, 10), role, roles: [role], firstName, lastName, phone: emp.phone || null, isActive: true, employeeId: emp.id },
        });
        results.push({ status: 'created', name: emp.fullName, email, tempPassword });
      } catch (e) {
        results.push({ status: 'failed', name: '', email: '', message: e.message });
      }
    }
    const summary = ['created', 'skipped', 'failed'].reduce((a, s) => { a[s] = results.filter(r => r.status === s).length; return a; }, { total: results.length });
    return created(res, { summary, results });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const { isActive, phone, firstName, lastName, role, roles, branchIds } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new NotFoundError('User');

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...((role || roles) && (() => {
          const roleList = normalizeRoles(roles, role || user.role);
          return { role: roleList[0], roles: roleList };
        })()),
        ...(branchIds !== undefined && (() => {
          const normalizedBranchIds = normalizeBranchIds(branchIds);
          return { branchIds: normalizedBranchIds, branchId: normalizedBranchIds[0] || null };
        })()),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(phone && { phone }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
      },
    });
    return ok(res, { id: updated.id, isActive: updated.isActive, role: updated.role, roles: getUserRoles(updated), branchIds: updated.branchIds });
  } catch (e) { next(e); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const pwError = checkPassword(newPassword);
    if (pwError) throw new ValidationError(pwError);

    await prisma.user.update({
      where: { id: req.params.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    });
    return ok(res, { message: 'Password reset successfully' });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            auditLogs: true,
            uploadedEmpDocs: true,
            uploadedVehDocs: true,
            defectReviews: true,
            defectSignoffs: true,
            vorAuthorisations: true,
            vorSignoffs: true,
            toolboxIssued: true,
            toolboxSignoffs: true,
            sponsoredChanges: true,
          },
        },
      },
    });
    if (!target) throw new NotFoundError('User');
    if (target.id === req.user.id) throw new ValidationError('You cannot delete your own account');

    if (target.role === 'director') {
      const directorCount = await prisma.user.count({ where: { role: 'director', isActive: true } });
      if (directorCount <= 1) throw new ValidationError('You cannot delete the last active director');
    }

    const blockingRelations = [
      ['audit logs', target._count.auditLogs],
      ['uploaded employee documents', target._count.uploadedEmpDocs],
      ['uploaded vehicle documents', target._count.uploadedVehDocs],
      ['defect reviews', target._count.defectReviews],
      ['defect sign-offs', target._count.defectSignoffs],
      ['VOR authorisations', target._count.vorAuthorisations],
      ['VOR sign-offs', target._count.vorSignoffs],
      ['toolbox talks issued', target._count.toolboxIssued],
      ['toolbox sign-offs', target._count.toolboxSignoffs],
      ['sponsored worker changes', target._count.sponsoredChanges],
    ].filter(([, count]) => count > 0);

    if (blockingRelations.length > 0) {
      throw new ValidationError(`This user cannot be deleted because they still own ${blockingRelations.map(([label]) => label).join(', ')}. Deactivate the account instead.`);
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    return ok(res, { message: 'User deleted successfully' });
  } catch (e) { next(e); }
};
