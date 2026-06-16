const prisma = require('../config/database');
const logger = require('../utils/logger');

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const ACTION_MAP = {
  POST: 'CREATE', PUT: 'UPDATE', PATCH: 'UPDATE', DELETE: 'DELETE',
};

const auditLog = (entityType) => async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (WRITE_METHODS.has(req.method) && res.statusCode < 400 && req.user) {
      const entityId = body?.data?.id || req.params?.id || 'unknown';
      prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: `${entityType.toUpperCase()}_${ACTION_MAP[req.method]}`,
          entityType,
          entityId: String(entityId),
          newState: body?.data || null,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      }).catch((e) => logger.error('Audit log write failed:', e));
    }
    return originalJson(body);
  };

  next();
};

module.exports = auditLog;
