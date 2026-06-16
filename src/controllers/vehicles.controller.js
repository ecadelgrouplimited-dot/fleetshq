const prisma = require('../config/database');
const { ok, created, paginate } = require('../utils/responseHelper');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { daysUntil, calcNextPmi } = require('../utils/dateHelpers');
const path = require('path');

const enrichVehicle = (v) => ({
  ...v,
  motDaysRemaining: daysUntil(v.motExpiryDate),
  insuranceDaysRemaining: daysUntil(v.insuranceExpiryDate),
  pmiDaysRemaining: daysUntil(v.nextPmiDate),
  tachoDaysRemaining: daysUntil(v.tachoCalibrExpiry),
});

exports.list = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const where = {};
    if (status) where.status = status;
    else where.status = { not: 'sold' };

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where, skip: (page - 1) * limit, take: parseInt(limit),
        include: {
          assignedDriver: { select: { id: true, fullName: true } },
          defects: { where: { status: { not: 'signed_off' } }, select: { id: true, severity: true } },
        },
        orderBy: { registration: 'asc' },
      }),
      prisma.vehicle.count({ where }),
    ]);

    return paginate(res, vehicles.map(enrichVehicle), total, page, limit);
  } catch (e) { next(e); }
};

exports.show = async (req, res, next) => {
  try {
    const v = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: {
        assignedDriver: true,
        documents: { orderBy: { createdAt: 'desc' } },
        defects: { where: { status: { not: 'signed_off' } }, orderBy: { reportedAt: 'desc' }, take: 10 },
        checks: { orderBy: { checkDate: 'desc' }, take: 7 },
        vorRecords: { orderBy: { takenOffRoadDate: 'desc' }, take: 5 },
      },
    });
    if (!v) throw new NotFoundError('Vehicle');
    return ok(res, enrichVehicle(v));
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const d = req.body;
    const nextPmi = d.lastPmiDate && d.pmiIntervalWeeks
      ? calcNextPmi(d.lastPmiDate, parseInt(d.pmiIntervalWeeks))
      : null;

    const v = await prisma.vehicle.create({
      data: {
        registration: d.registration?.toUpperCase(),
        vinNumber: d.vinNumber,
        make: d.make, model: d.model, year: parseInt(d.year),
        operatorLicenceDisc: d.operatorLicenceDisc,
        motExpiryDate: new Date(d.motExpiryDate),
        roadTaxExpiryDate: d.roadTaxExpiryDate ? new Date(d.roadTaxExpiryDate) : null,
        insuranceExpiryDate: new Date(d.insuranceExpiryDate),
        tachoCalibrExpiry: d.tachoCalibrExpiry ? new Date(d.tachoCalibrExpiry) : null,
        pmiIntervalWeeks: parseInt(d.pmiIntervalWeeks) || 6,
        lastPmiDate: d.lastPmiDate ? new Date(d.lastPmiDate) : null,
        nextPmiDate: nextPmi,
        currentMileage: parseInt(d.currentMileage) || 0,
        assignedDriverId: d.assignedDriverId || null,
        status: d.status || 'active',
      },
    });
    return created(res, v);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Vehicle');

    const d = req.body;
    const lastPmi = d.lastPmiDate ? new Date(d.lastPmiDate) : existing.lastPmiDate;
    const interval = d.pmiIntervalWeeks ? parseInt(d.pmiIntervalWeeks) : existing.pmiIntervalWeeks;
    const nextPmi = calcNextPmi(lastPmi, interval);

    const updated = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: {
        ...(d.registration && { registration: d.registration.toUpperCase() }),
        ...(d.vinNumber && { vinNumber: d.vinNumber }),
        ...(d.make && { make: d.make }),
        ...(d.model && { model: d.model }),
        ...(d.year && { year: parseInt(d.year) }),
        ...(d.status && { status: d.status }),
        ...(d.motExpiryDate && { motExpiryDate: new Date(d.motExpiryDate) }),
        ...(d.roadTaxExpiryDate && { roadTaxExpiryDate: new Date(d.roadTaxExpiryDate) }),
        ...(d.insuranceExpiryDate && { insuranceExpiryDate: new Date(d.insuranceExpiryDate) }),
        ...(d.tachoCalibrExpiry && { tachoCalibrExpiry: new Date(d.tachoCalibrExpiry) }),
        ...(d.lastPmiDate && { lastPmiDate: new Date(d.lastPmiDate) }),
        ...((d.lastPmiDate || d.pmiIntervalWeeks) && { nextPmiDate: nextPmi }),
        ...(d.pmiIntervalWeeks && { pmiIntervalWeeks: interval, nextPmiDate: nextPmi }),
        ...(d.currentMileage && { currentMileage: parseInt(d.currentMileage) }),
        ...(d.assignedDriverId !== undefined && { assignedDriverId: d.assignedDriverId || null }),
        ...(d.operatorLicenceDisc && { operatorLicenceDisc: d.operatorLicenceDisc }),
      },
    });
    return ok(res, enrichVehicle(updated));
  } catch (e) { next(e); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const v = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!v) throw new NotFoundError('Vehicle');

    const updated = await prisma.vehicle.update({ where: { id: req.params.id }, data: { status } });
    return ok(res, updated);
  } catch (e) { next(e); }
};

exports.pmiPlanner = async (req, res, next) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { status: { not: 'sold' } },
      include: { assignedDriver: { select: { fullName: true } } },
      orderBy: { nextPmiDate: 'asc' },
    });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const enriched = vehicles.map(v => ({ ...v, pmiDaysRemaining: daysUntil(v.nextPmiDate) }));

    return ok(res, {
      overdue: enriched.filter(v => v.pmiDaysRemaining !== null && v.pmiDaysRemaining < 0),
      dueSoon: enriched.filter(v => v.pmiDaysRemaining !== null && v.pmiDaysRemaining >= 0 && v.pmiDaysRemaining <= 14),
      upcoming: enriched.filter(v => v.pmiDaysRemaining !== null && v.pmiDaysRemaining > 14),
      missingPmiDate: enriched.filter(v => !v.nextPmiDate),
    });
  } catch (e) { next(e); }
};

exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) throw new ValidationError('No file uploaded');
    const { documentType, documentDate, expiryDate, notes } = req.body;
    const relativePath = path.relative(process.cwd(), req.file.path);
    const doc = await prisma.vehicleDocument.create({
      data: {
        vehicleId: req.params.id,
        documentType: documentType || 'other',
        fileName: req.file.originalname,
        storageKey: relativePath,
        fileSizeBytes: req.file.size,
        mimeType: req.file.mimetype,
        documentDate: documentDate ? new Date(documentDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        uploadedById: req.user.id,
        notes: notes || null,
      },
    });
    return created(res, doc);
  } catch (e) { next(e); }
};
