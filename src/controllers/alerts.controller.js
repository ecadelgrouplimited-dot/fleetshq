const prisma = require('../config/database');
const { ok } = require('../utils/responseHelper');

exports.list = async (req, res, next) => {
  try {
    const { severity, resolved = 'false', type, limit = 50 } = req.query;
    const where = {};
    if (severity) where.severity = { in: severity.split(',') };
    if (resolved !== 'all') where.isResolved = resolved === 'true';
    if (type) where.alertType = { in: type.split(',') };

    const alerts = await prisma.alert.findMany({
      where, orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }], take: parseInt(limit),
    });
    return ok(res, alerts);
  } catch (e) { next(e); }
};

exports.resolve = async (req, res, next) => {
  try {
    const updated = await prisma.alert.update({
      where: { id: req.params.id },
      data: { isResolved: true, resolvedAt: new Date(), resolvedById: req.user.id },
    });
    return ok(res, updated);
  } catch (e) { next(e); }
};
