const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const { getTenantId } = require('../utils/tenantContext');

const tenantScopedModels = new Set([
  'User',
  'Employee',
  'SponsoredWorker',
  'SponsoredWorkerChange',
  'EmployeeDocument',
  'TrainingRecord',
  'PolicyAcknowledgement',
  'ToolboxTalk',
  'ToolboxTalkAssignment',
  'Vehicle',
  'VehicleDocument',
  'WalkAroundCheck',
  'WalkAroundCheckItem',
  'DefectCase',
  'DefectPhoto',
  'VorRecord',
  'AuditLog',
  'Alert',
  'ComplianceScore',
  'Company',
  'Branch',
  'PublicLead',
  'ServiceType',
  'SystemConfig',
  'Customer',
  'Shipment',
  'Parcel',
  'TrackingEvent',
  'Job',
  'ProofOfDelivery',
  'Invoice',
  'FuelLog',
  'AdBlueLog',
  'Trailer',
  'LeaveRequest',
  'EmployeeShift',
  'Course',
  'CourseEnrolment',
  'Expense',
]);

const readOperations = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
]);

const writeFilterOperations = new Set([
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'upsert',
]);

const addTenantWhere = (args, tenantId) => ({
  ...args,
  where: { ...(args?.where || {}), tenantId },
});

const addNestedTenantWrites = (value, tenantId) => {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => addNestedTenantWrites(item, tenantId));

  const scoped = { ...value };
  for (const [key, nestedValue] of Object.entries(scoped)) {
    if (key === 'create') scoped[key] = addTenantData(nestedValue, tenantId);
    else if (key === 'createMany' && nestedValue?.data) {
      scoped[key] = { ...nestedValue, data: addTenantData(nestedValue.data, tenantId) };
    } else if (nestedValue && typeof nestedValue === 'object') {
      scoped[key] = addNestedTenantWrites(nestedValue, tenantId);
    }
  }
  return scoped;
};

const addTenantData = (data, tenantId) => {
  if (!data) return data;
  if (Array.isArray(data)) return data.map((item) => addTenantData(item, tenantId));
  if (typeof data !== 'object') return data;

  const scoped = { ...data, tenantId };
  for (const [key, value] of Object.entries(scoped)) {
    if (value && typeof value === 'object' && (value.create || value.createMany)) {
      scoped[key] = addNestedTenantWrites(value, tenantId);
    }
  }
  return scoped;
};

const isTenantScopedModel = (model) => (
  tenantScopedModels.has(model)
  || tenantScopedModels.has(`${model?.charAt(0).toUpperCase()}${model?.slice(1)}`)
);

const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? [{ emit: 'event', level: 'query' }, { emit: 'event', level: 'error' }]
    : [{ emit: 'event', level: 'error' }],
});

if (process.env.NODE_ENV === 'development') {
  basePrisma.$on('query', (e) => {
    if (e.duration > 100) logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
  });
}

basePrisma.$on('error', (e) => logger.error('Prisma error:', e));

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const tenantId = getTenantId();
        if (!tenantId || !isTenantScopedModel(model)) return query(args);

        if (readOperations.has(operation) || writeFilterOperations.has(operation)) {
          args = addTenantWhere(args, tenantId);
        }

        if (operation === 'create') {
          args = { ...args, data: addTenantData(args.data, tenantId) };
        }

        if (operation === 'createMany') {
          args = { ...args, data: addTenantData(args.data, tenantId) };
        }

        if (operation === 'upsert') {
          args = {
            ...args,
            create: addTenantData(args.create, tenantId),
          };
        }

        return query(args);
      },
    },
  },
});

module.exports = prisma;
