const prisma = require('../config/database');
const { ok, created, paginate } = require('../utils/responseHelper');
const { NotFoundError, ValidationError, AppError } = require('../utils/errors');
const { DEFECT_STATUS_TRANSITIONS } = require('../utils/constants');
const path = require('path');

let refCounter = 1;
const genRef = () => {
  const year = new Date().getFullYear();
  return `DEF-${year}-${String(refCounter++).padStart(4, '0')}`;
};

exports.list = async (req, res, next) => {
  try {
    const { status, severity, vehicleId, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = { in: status.split(',') };
    if (severity) where.severity = { in: severity.split(',') };
    if (vehicleId) where.vehicleId = vehicleId;

    const [defects, total] = await Promise.all([
      prisma.defectCase.findMany({
        where, skip: (page - 1) * limit, take: parseInt(limit),
        include: {
          vehicle: { select: { registration: true } },
          reportedBy: { select: { fullName: true } },
          reviewedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { reportedAt: 'desc' },
      }),
      prisma.defectCase.count({ where }),
    ]);

    const enriched = defects.map(d => ({
      ...d,
      daysOpen: Math.floor((Date.now() - new Date(d.reportedAt)) / 86400000),
    }));

    return paginate(res, enriched, total, page, limit);
  } catch (e) { next(e); }
};

exports.show = async (req, res, next) => {
  try {
    const d = await prisma.defectCase.findUnique({
      where: { id: req.params.id },
      include: {
        vehicle: true,
        reportedBy: { select: { id: true, fullName: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
        finalSignoffBy: { select: { id: true, firstName: true, lastName: true } },
        photos: true,
        walkAroundCheck: { select: { id: true, checkDate: true } },
      },
    });
    if (!d) throw new NotFoundError('Defect case');
    return ok(res, { ...d, daysOpen: Math.floor((Date.now() - new Date(d.reportedAt)) / 86400000) });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { vehicleId, defectCategory, description, severity, vehicleAllowedToContinue } = req.body;
    if (!vehicleId || !description || !severity) throw new ValidationError('vehicleId, description and severity are required');

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundError('Vehicle');

    if (severity === 'dangerous' && vehicleAllowedToContinue) {
      throw new ValidationError('A dangerous defect must result in vehicle being taken off road');
    }

    const defect = await prisma.defectCase.create({
      data: {
        referenceNumber: genRef(),
        vehicleId,
        reportedById: req.user.employeeId,
        defectCategory: defectCategory || 'General',
        description,
        severity,
        vehicleAllowedToContinue: Boolean(vehicleAllowedToContinue),
        status: 'reported',
        vorDecision: !vehicleAllowedToContinue,
      },
    });

    // Auto-create VOR if dangerous or not allowed to continue
    if (!vehicleAllowedToContinue) {
      await Promise.all([
        prisma.vehicle.update({ where: { id: vehicleId }, data: { status: 'vor' } }),
        prisma.vorRecord.create({
          data: {
            vehicleId,
            defectCaseId: defect.id,
            takenOffRoadDate: new Date(),
            reason: description,
            authorisedById: req.user.id,
          },
        }),
      ]);
    }

    return created(res, defect);
  } catch (e) { next(e); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const defect = await prisma.defectCase.findUnique({ where: { id: req.params.id } });
    if (!defect) throw new NotFoundError('Defect case');

    const { status, repairGarage, repairAction, dateRepaired } = req.body;
    const allowed = DEFECT_STATUS_TRANSITIONS[defect.status];
    if (!allowed.includes(status)) {
      throw new AppError(`Cannot transition from ${defect.status} to ${status}`, 400, 'INVALID_TRANSITION');
    }

    const updateData = { status };
    if (status === 'under_review') {
      updateData.reviewedById = req.user.id;
      updateData.reviewedAt = new Date();
    }
    if (status === 'repair_booked') {
      if (!repairGarage) throw new ValidationError('Repair garage is required');
      updateData.repairGarage = repairGarage;
      updateData.repairAction = repairAction;
    }
    if (status === 'repaired') {
      updateData.dateRepaired = dateRepaired ? new Date(dateRepaired) : new Date();
    }

    const updated = await prisma.defectCase.update({ where: { id: req.params.id }, data: updateData });
    return ok(res, updated);
  } catch (e) { next(e); }
};

exports.finalSignoff = async (req, res, next) => {
  try {
    const defect = await prisma.defectCase.findUnique({ where: { id: req.params.id } });
    if (!defect) throw new NotFoundError('Defect case');
    if (defect.status !== 'repaired') throw new AppError('Defect must be in repaired status before sign-off', 400);

    const updated = await prisma.defectCase.update({
      where: { id: req.params.id },
      data: { status: 'signed_off', finalSignoffById: req.user.id, finalSignoffAt: new Date() },
    });
    return ok(res, updated);
  } catch (e) { next(e); }
};

exports.uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) throw new ValidationError('No file uploaded');
    const relativePath = path.relative(process.cwd(), req.file.path);
    const photo = await prisma.defectPhoto.create({
      data: {
        defectCaseId: req.params.id,
        storageKey: relativePath,
        fileName: req.file.originalname,
        uploadedById: req.user.id,
      },
    });
    return created(res, photo);
  } catch (e) { next(e); }
};
