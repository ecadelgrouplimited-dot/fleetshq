const prisma = require('../config/database');
const { ok, created, paginate } = require('../utils/responseHelper');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/errors');
const { daysUntil } = require('../utils/dateHelpers');
const path = require('path');

const DOCUMENT_STATUS_REQUIRED = [
  'contract','offer_letter','job_description','passport','right_to_work',
  'proof_of_address','national_insurance',
];
const DRIVER_DOCS_REQUIRED = ['driving_licence','cpc_card','tacho_card'];

const enrichEmployee = (emp) => {
  const docs = emp.documents || [];
  const missing = [];
  const required = emp.isDriver
    ? [...DOCUMENT_STATUS_REQUIRED, ...DRIVER_DOCS_REQUIRED]
    : DOCUMENT_STATUS_REQUIRED;

  required.forEach(type => {
    if (!docs.find(d => d.documentType === type)) missing.push(type);
  });

  const expiringSoon = docs.filter(d => {
    if (!d.expiryDate) return false;
    const days = daysUntil(d.expiryDate);
    return days !== null && days <= 30 && days >= 0;
  });

  return { ...emp, documentStatus: { missing, expiringSoon: expiringSoon.map(d => d.documentType) } };
};

exports.list = async (req, res, next) => {
  try {
    const { status, department, search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.employmentStatus = status;
    if (department) where.department = { contains: department, mode: 'insensitive' };
    if (search) where.fullName = { contains: search, mode: 'insensitive' };

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where, skip: (page - 1) * limit, take: parseInt(limit),
        include: {
          documents: { select: { documentType: true, expiryDate: true } },
          drivingVehicle: { select: { id: true, registration: true } },
        },
        orderBy: { fullName: 'asc' },
      }),
      prisma.employee.count({ where }),
    ]);

    return paginate(res, employees.map(enrichEmployee), total, page, limit);
  } catch (e) { next(e); }
};

exports.show = async (req, res, next) => {
  try {
    const emp = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: {
        documents: true,
        trainingRecords: { orderBy: { trainingType: 'asc' } },
        acknowledgements: { orderBy: { signedAt: 'desc' } },
        drivingVehicle: true,
        lineManager: { select: { id: true, fullName: true, jobTitle: true } },
        sponsoredWorker: { include: { changes: { orderBy: { createdAt: 'desc' } } } },
      },
    });
    if (!emp) throw new NotFoundError('Employee');
    return ok(res, enrichEmployee(emp));
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const data = req.body;
    const existing = await prisma.employee.findFirst({ where: { email: data.email } });
    if (existing) throw new ConflictError('An employee with this email already exists');

    const emp = await prisma.employee.create({
      data: {
        fullName: data.fullName,
        dateOfBirth: new Date(data.dateOfBirth),
        homeAddress: data.homeAddress,
        phone: data.phone,
        email: data.email,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        nextOfKin: data.nextOfKin,
        jobTitle: data.jobTitle,
        department: data.department,
        startDate: new Date(data.startDate),
        employmentStatus: data.employmentStatus || 'active',
        contractedHours: parseFloat(data.contractedHours),
        salary: parseFloat(data.salary),
        workLocation: data.workLocation,
        lineManagerId: data.lineManagerId || null,
        isDriver: Boolean(data.isDriver),
        isSponsored: Boolean(data.isSponsored),
      },
    });
    return created(res, emp);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Employee');

    const data = req.body;
    const updated = await prisma.employee.update({
      where: { id: req.params.id },
      data: {
        fullName: data.fullName,
        homeAddress: data.homeAddress,
        phone: data.phone,
        email: data.email,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        nextOfKin: data.nextOfKin,
        jobTitle: data.jobTitle,
        department: data.department,
        contractedHours: data.contractedHours ? parseFloat(data.contractedHours) : undefined,
        salary: data.salary ? parseFloat(data.salary) : undefined,
        workLocation: data.workLocation,
        employmentStatus: data.employmentStatus,
        lineManagerId: data.lineManagerId || null,
        isDriver: data.isDriver !== undefined ? Boolean(data.isDriver) : undefined,
        isSponsored: data.isSponsored !== undefined ? Boolean(data.isSponsored) : undefined,
      },
    });
    return ok(res, updated);
  } catch (e) { next(e); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const emp = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!emp) throw new NotFoundError('Employee');

    const updated = await prisma.employee.update({
      where: { id: req.params.id },
      data: { employmentStatus: status },
    });
    return ok(res, updated);
  } catch (e) { next(e); }
};

// Documents
exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) throw new ValidationError('No file uploaded');
    const { documentType, expiryDate, notes } = req.body;
    if (!documentType) throw new ValidationError('Document type is required');

    const emp = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!emp) throw new NotFoundError('Employee');

    const relativePath = path.relative(process.cwd(), req.file.path);
    const doc = await prisma.employeeDocument.create({
      data: {
        employeeId: req.params.id,
        documentType,
        fileName: req.file.originalname,
        storageKey: relativePath,
        fileSizeBytes: req.file.size,
        mimeType: req.file.mimetype,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        uploadedById: req.user.id,
        notes: notes || null,
      },
    });
    return created(res, doc);
  } catch (e) { next(e); }
};

exports.listDocuments = async (req, res, next) => {
  try {
    const docs = await prisma.employeeDocument.findMany({
      where: { employeeId: req.params.id },
      include: { uploadedBy: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return ok(res, docs);
  } catch (e) { next(e); }
};
