const prisma = require('../config/database');
const { ok, created } = require('../utils/responseHelper');
const { NotFoundError, ValidationError, AppError } = require('../utils/errors');

exports.submit = async (req, res, next) => {
  try {
    const { vehicleId, checkDate, checkTime, location, mileage, nilDefect, items, signatureData } = req.body;
    if (!vehicleId || !signatureData) throw new ValidationError('vehicleId and signatureData are required');

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundError('Vehicle');

    const driverId = req.user.employeeId;
    if (!driverId) throw new AppError('User is not linked to an employee record', 400);

    const checkDateObj = checkDate ? new Date(checkDate) : new Date();

    // Build check time properly
    const [hours, minutes] = (checkTime || '00:00').split(':').map(Number);
    const checkTimeObj = new Date();
    checkTimeObj.setHours(hours, minutes, 0, 0);

    const check = await prisma.walkAroundCheck.create({
      data: {
        vehicleId,
        driverId,
        checkDate: checkDateObj,
        checkTime: checkTimeObj,
        location: location || '',
        mileage: parseInt(mileage) || 0,
        nilDefect: Boolean(nilDefect),
        signatureData,
        items: {
          create: (items || []).map(item => ({
            item: item.item,
            status: item.status,
            notes: item.notes || null,
          })),
        },
      },
      include: { items: true },
    });

    // Auto-create defect cases for any defect_found items
    const defectItems = (items || []).filter(i => i.status === 'defect_found');
    if (defectItems.length > 0) {
      let refCounter = await prisma.defectCase.count() + 1;
      const year = new Date().getFullYear();
      for (const item of defectItems) {
        await prisma.defectCase.create({
          data: {
            referenceNumber: `DEF-${year}-${String(refCounter++).padStart(4, '0')}`,
            vehicleId,
            reportedById: driverId,
            walkAroundCheckId: check.id,
            defectCategory: item.item.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            description: item.notes || `Defect found during walk-around check: ${item.item}`,
            severity: 'minor',
            vehicleAllowedToContinue: true,
            status: 'reported',
            vorDecision: false,
          },
        });
      }
    }

    return created(res, check);
  } catch (e) { next(e); }
};

exports.list = async (req, res, next) => {
  try {
    const { vehicleId, driverId, dateFrom, dateTo } = req.query;
    const where = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (driverId) where.driverId = driverId;
    if (req.user.role === 'driver') where.driverId = req.user.employeeId;
    if (dateFrom || dateTo) {
      where.checkDate = {};
      if (dateFrom) where.checkDate.gte = new Date(dateFrom);
      if (dateTo) where.checkDate.lte = new Date(dateTo);
    }

    const checks = await prisma.walkAroundCheck.findMany({
      where,
      include: {
        vehicle: { select: { registration: true, make: true, model: true } },
        driver: { select: { fullName: true } },
        items: true,
        defects: { where: { status: { not: 'signed_off' } }, select: { id: true, severity: true, status: true } },
      },
      orderBy: [{ checkDate: 'desc' }, { submittedAt: 'desc' }],
      take: 50,
    });
    return ok(res, checks);
  } catch (e) { next(e); }
};

exports.show = async (req, res, next) => {
  try {
    const check = await prisma.walkAroundCheck.findUnique({
      where: { id: req.params.id },
      include: {
        vehicle: true,
        driver: { select: { id: true, fullName: true } },
        items: true,
        defects: true,
      },
    });
    if (!check) throw new NotFoundError('Check record');
    return ok(res, check);
  } catch (e) { next(e); }
};

exports.missed = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const activeVehicles = await prisma.vehicle.findMany({
      where: { status: 'active', assignedDriverId: { not: null } },
      include: {
        assignedDriver: { select: { id: true, fullName: true } },
        checks: { where: { checkDate: { gte: today } }, select: { id: true } },
      },
    });
    const missed = activeVehicles.filter(v => v.checks.length === 0);
    return ok(res, missed);
  } catch (e) { next(e); }
};
