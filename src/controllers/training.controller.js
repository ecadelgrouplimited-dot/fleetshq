const prisma = require('../config/database');
const { ok, created } = require('../utils/responseHelper');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { TRAINING_TYPES, TRAINING_LABELS } = require('../utils/constants');

exports.getMatrix = async (req, res, next) => {
  try {
    const emp = await prisma.employee.findUnique({
      where: { id: req.params.employeeId },
      include: { trainingRecords: true },
    });
    if (!emp) throw new NotFoundError('Employee');

    // Build full matrix (all types, even missing ones)
    const existing = Object.fromEntries(emp.trainingRecords.map(r => [r.trainingType, r]));
    const matrix = TRAINING_TYPES.map(type => ({
      trainingType: type,
      label: TRAINING_LABELS[type],
      ...(existing[type] || { status: 'not_started', completedDate: null, expiryDate: null }),
    }));

    const completedCount = matrix.filter(m => m.status === 'completed').length;
    return ok(res, {
      employeeId: emp.id,
      employeeName: emp.fullName,
      matrix,
      completionPercent: Math.round((completedCount / TRAINING_TYPES.length) * 100),
    });
  } catch (e) { next(e); }
};

exports.updateRecord = async (req, res, next) => {
  try {
    const { trainingType } = req.params;
    const { employeeId } = req.params;
    if (!TRAINING_TYPES.includes(trainingType)) throw new ValidationError('Invalid training type');

    const { status, completedDate, expiryDate, trainerName, certificateNumber, notes } = req.body;

    const record = await prisma.trainingRecord.upsert({
      where: { employeeId_trainingType: { employeeId, trainingType } },
      update: { status, completedDate: completedDate ? new Date(completedDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null, trainerName, certificateNumber, notes },
      create: { employeeId, trainingType, status: status || 'not_started',
        completedDate: completedDate ? new Date(completedDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null, trainerName, certificateNumber, notes },
    });
    return ok(res, record);
  } catch (e) { next(e); }
};

exports.getAcknowledgements = async (req, res, next) => {
  try {
    const records = await prisma.policyAcknowledgement.findMany({
      where: { employeeId: req.params.employeeId },
      orderBy: { signedAt: 'desc' },
    });
    return ok(res, records);
  } catch (e) { next(e); }
};

exports.signPolicy = async (req, res, next) => {
  try {
    const { policyType, policyVersion, signatureData } = req.body;
    if (!policyType || !signatureData) throw new ValidationError('policyType and signatureData are required');

    const record = await prisma.policyAcknowledgement.create({
      data: {
        employeeId: req.params.employeeId,
        policyType,
        policyVersion: policyVersion || 'v1.0',
        signedAt: new Date(),
        ipAddress: req.ip || '0.0.0.0',
        signatureData,
        deviceInfo: req.get('User-Agent'),
      },
    });
    return created(res, record);
  } catch (e) { next(e); }
};

// Toolbox Talks
exports.listToolbox = async (req, res, next) => {
  try {
    const talks = await prisma.toolboxTalk.findMany({
      include: {
        issuedBy: { select: { firstName: true, lastName: true } },
        assignments: { include: { employee: { select: { fullName: true } } } },
      },
      orderBy: { dateIssued: 'desc' },
      take: 30,
    });
    return ok(res, talks.map(t => ({
      ...t,
      totalAssigned: t.assignments.length,
      totalSigned: t.assignments.filter(a => a.signedAt).length,
    })));
  } catch (e) { next(e); }
};

exports.createToolbox = async (req, res, next) => {
  try {
    const { topic, description, dateIssued, assignedEmployeeIds } = req.body;
    if (!topic || !dateIssued) throw new ValidationError('Topic and date are required');

    const talk = await prisma.toolboxTalk.create({
      data: {
        topic, description: description || '',
        dateIssued: new Date(dateIssued),
        issuedById: req.user.id,
        assignments: {
          create: (assignedEmployeeIds || []).map(empId => ({ employeeId: empId })),
        },
      },
      include: { assignments: true },
    });
    return created(res, talk);
  } catch (e) { next(e); }
};

exports.signToolbox = async (req, res, next) => {
  try {
    const { signatureData } = req.body;
    const empId = req.user.employeeId;
    if (!empId) throw new ValidationError('User is not linked to an employee record');

    const assignment = await prisma.toolboxTalkAssignment.findFirst({
      where: { toolboxTalkId: req.params.id, employeeId: empId },
    });
    if (!assignment) throw new NotFoundError('Toolbox talk assignment');

    const updated = await prisma.toolboxTalkAssignment.update({
      where: { id: assignment.id },
      data: { signedAt: new Date(), signatureData: signatureData || 'signed' },
    });
    return ok(res, updated);
  } catch (e) { next(e); }
};

exports.managerSignoff = async (req, res, next) => {
  try {
    const talk = await prisma.toolboxTalk.findUnique({ where: { id: req.params.id } });
    if (!talk) throw new NotFoundError('Toolbox talk');

    const updated = await prisma.toolboxTalk.update({
      where: { id: req.params.id },
      data: { managerSignedOff: true, managerSignoffAt: new Date(), managerSignoffById: req.user.id },
    });
    return ok(res, updated);
  } catch (e) { next(e); }
};
