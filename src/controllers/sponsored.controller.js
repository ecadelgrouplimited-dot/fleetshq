const prisma = require('../config/database');
const { ok, created } = require('../utils/responseHelper');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { daysUntil } = require('../utils/dateHelpers');

exports.list = async (req, res, next) => {
  try {
    const workers = await prisma.sponsoredWorker.findMany({
      include: {
        employee: { select: { id: true, fullName: true, jobTitle: true, employmentStatus: true } },
        changes: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
      orderBy: { employee: { fullName: 'asc' } },
    });

    return ok(res, workers.map(w => ({
      ...w,
      visaDaysRemaining: daysUntil(w.visaExpiryDate),
      rtwDaysRemaining: daysUntil(w.rightToWorkFollowupDate),
      unreportedChanges: w.changes.filter(c => !c.reportedToHomeOffice).length,
    })));
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { employeeId, ...data } = req.body;
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) throw new NotFoundError('Employee');

    const worker = await prisma.sponsoredWorker.create({
      data: {
        employeeId,
        cosNumber: data.cosNumber,
        socCode: data.socCode,
        sponsoredJobTitle: data.sponsoredJobTitle,
        salaryOnCos: parseFloat(data.salaryOnCos),
        actualSalary: parseFloat(data.actualSalary),
        contractedHours: parseFloat(data.contractedHours),
        actualWorkingPattern: data.actualWorkingPattern,
        workLocation: data.workLocation,
        visaExpiryDate: new Date(data.visaExpiryDate),
        rightToWorkCheckDate: new Date(data.rightToWorkCheckDate),
        rightToWorkFollowupDate: data.rightToWorkFollowupDate ? new Date(data.rightToWorkFollowupDate) : null,
        rightToWorkDocumentType: data.rightToWorkDocumentType,
      },
    });

    await prisma.employee.update({ where: { id: employeeId }, data: { isSponsored: true } });
    return created(res, worker);
  } catch (e) { next(e); }
};

exports.logChange = async (req, res, next) => {
  try {
    const { changeType, previousValue, newValue, effectiveDate, notes } = req.body;
    if (!changeType || !previousValue || !newValue) throw new ValidationError('changeType, previousValue and newValue are required');

    const change = await prisma.sponsoredWorkerChange.create({
      data: {
        sponsoredWorkerId: req.params.id,
        changeType,
        previousValue: String(previousValue),
        newValue: String(newValue),
        effectiveDate: new Date(effectiveDate),
        authorisedById: req.user.id,
        notes: notes || null,
      },
    });
    return created(res, change);
  } catch (e) { next(e); }
};

exports.auditPackStatus = async (req, res, next) => {
  try {
    const workers = await prisma.sponsoredWorker.findMany({
      include: {
        employee: {
          include: {
            documents: { select: { documentType: true, expiryDate: true } },
          },
        },
        changes: { where: { reportedToHomeOffice: false } },
      },
    });

    const required = ['contract', 'offer_letter', 'passport', 'right_to_work', 'job_description'];
    const status = workers.map(w => {
      const docs = w.employee.documents;
      const missing = required.filter(r => !docs.find(d => d.documentType === r));
      return {
        workerId: w.id,
        employeeName: w.employee.fullName,
        cosNumber: w.cosNumber,
        visaExpiryDate: w.visaExpiryDate,
        rightToWorkCheckDate: w.rightToWorkCheckDate,
        missingDocuments: missing,
        unreportedChanges: w.changes.length,
        compliant: missing.length === 0 && w.changes.length === 0,
      };
    });

    const compliantCount = status.filter(s => s.compliant).length;
    return ok(res, {
      totalWorkers: workers.length,
      compliantWorkers: compliantCount,
      packCompleteness: workers.length > 0 ? Math.round((compliantCount / workers.length) * 100) : 100,
      workers: status,
    });
  } catch (e) { next(e); }
};
