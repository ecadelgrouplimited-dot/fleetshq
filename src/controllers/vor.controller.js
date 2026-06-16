const prisma = require('../config/database');
const { ok, created } = require('../utils/responseHelper');
const { NotFoundError, ValidationError } = require('../utils/errors');

exports.list = async (req, res, next) => {
  try {
    const where = req.query.active === 'true' ? { actualReturnDate: null } : {};
    const records = await prisma.vorRecord.findMany({
      where,
      include: {
        vehicle: { select: { registration: true, make: true, model: true } },
        authorisedBy: { select: { firstName: true, lastName: true } },
        defectCase: { select: { referenceNumber: true, severity: true } },
      },
      orderBy: { takenOffRoadDate: 'desc' },
    });
    return ok(res, records.map(r => ({
      ...r,
      daysOffRoad: Math.floor((Date.now() - new Date(r.takenOffRoadDate)) / 86400000),
    })));
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { vehicleId, defectCaseId, reason, repairGarage, estimatedReturnDate } = req.body;
    if (!vehicleId || !reason) throw new ValidationError('vehicleId and reason are required');

    const [vehicle] = await Promise.all([
      prisma.vehicle.findUnique({ where: { id: vehicleId } }),
    ]);
    if (!vehicle) throw new NotFoundError('Vehicle');

    const [vor] = await Promise.all([
      prisma.vorRecord.create({
        data: {
          vehicleId, defectCaseId: defectCaseId || null,
          takenOffRoadDate: new Date(), reason,
          authorisedById: req.user.id,
          repairGarage: repairGarage || null,
          estimatedReturnDate: estimatedReturnDate ? new Date(estimatedReturnDate) : null,
        },
      }),
      prisma.vehicle.update({ where: { id: vehicleId }, data: { status: 'vor' } }),
    ]);
    return created(res, vor);
  } catch (e) { next(e); }
};

exports.returnToService = async (req, res, next) => {
  try {
    const vor = await prisma.vorRecord.findUnique({ where: { id: req.params.id } });
    if (!vor) throw new NotFoundError('VOR record');

    const { signoffNotes } = req.body;
    const [updatedVor] = await Promise.all([
      prisma.vorRecord.update({
        where: { id: req.params.id },
        data: {
          actualReturnDate: new Date(),
          managerSignoffById: req.user.id,
          managerSignoffAt: new Date(),
          evidenceStorageKey: signoffNotes || null,
        },
      }),
      prisma.vehicle.update({ where: { id: vor.vehicleId }, data: { status: 'active' } }),
    ]);
    return ok(res, updatedVor);
  } catch (e) { next(e); }
};
