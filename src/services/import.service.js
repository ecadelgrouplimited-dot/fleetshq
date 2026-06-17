const prisma = require('../config/database');
const { calcNextPmi } = require('../utils/dateHelpers');

/**
 * Bulk import engine for the Import Wizard.
 *
 * Files are parsed to rows client-side (SheetJS / native JSON), so this module
 * only receives arrays of plain objects. It is responsible for the trustworthy
 * work: fuzzy column matching, value cleaning/normalisation, validation,
 * duplicate detection (in-file + against the DB), and committing.
 */

// ── Field schemas ──────────────────────────────────────────────────────
// type: string | upper | date | int | decimal | bool | enum
// key:  true marks the natural dedup key (registration / email)
const SCHEMAS = {
  vehicles: {
    label: 'Vehicles',
    keyField: 'registration',
    fields: [
      { key: 'registration', label: 'Registration', required: true, type: 'upper', synonyms: ['registration', 'reg', 'regno', 'registrationnumber', 'regnumber', 'plate', 'numberplate', 'vrm', 'vrn', 'licenceplate', 'licenseplate'] },
      { key: 'vinNumber', label: 'VIN / Chassis', required: true, type: 'string', synonyms: ['vin', 'vinnumber', 'chassis', 'chassisnumber', 'vinchassis', 'chassisno'] },
      { key: 'make', label: 'Make', type: 'string', default: 'Unknown', synonyms: ['make', 'manufacturer', 'brand'] },
      { key: 'model', label: 'Model', type: 'string', default: 'Unknown', synonyms: ['model'] },
      { key: 'year', label: 'Year', type: 'int', default: () => new Date().getFullYear(), synonyms: ['year', 'modelyear', 'yearofmanufacture', 'yom', 'regyear'] },
      { key: 'operatorLicenceDisc', label: 'Operator Licence Disc', type: 'string', default: null, synonyms: ['operatorlicencedisc', 'operatorlicence', 'operatorlicense', 'oldisc', 'licencedisc', 'odisc', 'operatorlicensedisc'] },
      { key: 'motExpiryDate', label: 'MOT Expiry', type: 'date', default: () => new Date(), synonyms: ['motexpirydate', 'mot', 'motexpiry', 'motdue', 'motduedate', 'motexpiration'] },
      { key: 'roadTaxExpiryDate', label: 'Road Tax Expiry', type: 'date', default: null, synonyms: ['roadtaxexpirydate', 'roadtax', 'tax', 'taxexpiry', 'vedexpiry', 'roadtaxexpiry', 'taxdue'] },
      { key: 'insuranceExpiryDate', label: 'Insurance Expiry', type: 'date', default: () => new Date(), synonyms: ['insuranceexpirydate', 'insurance', 'insuranceexpiry', 'insurancedue'] },
      { key: 'tachoCalibrExpiry', label: 'Tacho Calibration Expiry', type: 'date', default: null, synonyms: ['tachocalibrexpiry', 'tacho', 'tachograph', 'tachocalibration', 'tachographcalibration', 'tachographcalibrationexpiry', 'tachocalibrationexpiry'] },
      { key: 'pmiIntervalWeeks', label: 'PMI Interval (weeks)', type: 'int', default: 6, synonyms: ['pmiintervalweeks', 'pmiinterval', 'pmiweeks', 'inspectioninterval', 'pmi'] },
      { key: 'lastPmiDate', label: 'Last PMI Date', type: 'date', default: null, synonyms: ['lastpmidate', 'lastpmi', 'lastinspection', 'lastinspectiondate', 'pmidate'] },
      { key: 'currentMileage', label: 'Current Mileage', type: 'int', default: 0, synonyms: ['currentmileage', 'mileage', 'odometer', 'miles', 'km', 'odo'] },
      { key: 'status', label: 'Status', type: 'enum', default: 'active', enumValues: ['active', 'vor', 'awaiting_repair', 'hired', 'sold'], synonyms: ['status', 'vehiclestatus'] },
    ],
  },
  employees: {
    label: 'Employees',
    keyField: 'email',
    fields: [
      { key: 'fullName', label: 'Full Name', required: true, type: 'string', synonyms: ['fullname', 'name', 'employeename', 'fullnames', 'staffname'] },
      { key: 'email', label: 'Email', required: true, type: 'lower', synonyms: ['email', 'emailaddress', 'mail', 'workemail', 'e-mail'] },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', default: () => new Date('1990-01-01'), synonyms: ['dateofbirth', 'dob', 'birthdate', 'birthday'] },
      { key: 'homeAddress', label: 'Home Address', type: 'string', default: 'To be confirmed', synonyms: ['homeaddress', 'address', 'residentialaddress', 'addr'] },
      { key: 'phone', label: 'Phone', type: 'string', default: '', synonyms: ['phone', 'phonenumber', 'mobile', 'contactnumber', 'tel', 'telephone', 'mobilenumber'] },
      { key: 'emergencyContactName', label: 'Emergency Contact Name', type: 'string', default: null, synonyms: ['emergencycontactname', 'emergencycontact', 'emergencyname'] },
      { key: 'emergencyContactPhone', label: 'Emergency Contact Phone', type: 'string', default: null, synonyms: ['emergencycontactphone', 'emergencyphone', 'emergencycontactnumber'] },
      { key: 'nextOfKin', label: 'Next of Kin', type: 'string', default: null, synonyms: ['nextofkin', 'nok', 'kin'] },
      { key: 'jobTitle', label: 'Job Title', type: 'string', default: 'Employee', synonyms: ['jobtitle', 'title', 'role', 'position', 'jobrole'] },
      { key: 'department', label: 'Department', type: 'string', default: 'Operations', synonyms: ['department', 'dept', 'team'] },
      { key: 'startDate', label: 'Start Date', type: 'date', default: () => new Date(), synonyms: ['startdate', 'start', 'hiredate', 'joindate', 'employmentstartdate', 'datestarted'] },
      { key: 'employmentStatus', label: 'Employment Status', type: 'enum', default: 'active', enumValues: ['active', 'on_leave', 'suspended', 'terminated'], synonyms: ['employmentstatus', 'status'] },
      { key: 'contractedHours', label: 'Contracted Hours', type: 'decimal', default: 40, synonyms: ['contractedhours', 'hours', 'weeklyhours', 'contracthours'] },
      { key: 'salary', label: 'Salary', type: 'decimal', default: 0, synonyms: ['salary', 'annualsalary', 'pay', 'wage', 'grosssalary'] },
      { key: 'workLocation', label: 'Work Location', type: 'string', default: 'Main Depot', synonyms: ['worklocation', 'location', 'site', 'depot', 'base'] },
      { key: 'isDriver', label: 'Is Driver', type: 'bool', default: false, synonyms: ['isdriver', 'driver', 'isadriver'] },
      { key: 'isSponsored', label: 'Is Sponsored', type: 'bool', default: false, synonyms: ['issponsored', 'sponsored', 'sponsoredworker'] },
    ],
  },
};

const norm = (s) => String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]/g, '');
const defaultOf = (f) => (typeof f.default === 'function' ? f.default() : f.default);

function getSchema(entity) {
  const s = SCHEMAS[entity];
  if (!s) throw new Error('Unknown import type');
  return s;
}

// Public: field metadata for the mapping UI
function fieldList(entity) {
  return getSchema(entity).fields.map((f) => ({
    key: f.key, label: f.label, required: !!f.required, isKey: !!f.key && f.key === getSchema(entity).keyField,
    enumValues: f.enumValues || null,
  }));
}

// Public: suggest header→field mapping
function suggestMapping(entity, headers) {
  const { fields } = getSchema(entity);
  const normHeaders = headers.map((h) => ({ raw: h, n: norm(h) }));
  const mapping = {};
  const used = new Set();
  for (const f of fields) {
    const wanted = new Set([norm(f.key), norm(f.label), ...(f.synonyms || []).map(norm)]);
    let match = normHeaders.find((h) => !used.has(h.raw) && wanted.has(h.n));
    if (!match) match = normHeaders.find((h) => !used.has(h.raw) && h.n && [...wanted].some((w) => w && (h.n.includes(w) || w.includes(h.n))));
    if (match) { mapping[f.key] = match.raw; used.add(match.raw); }
    else mapping[f.key] = null;
  }
  return mapping;
}

// ── value cleaning ─────────────────────────────────────────────────────
function parseDate(v) {
  if (v == null || v === '') return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? undefined : v;
  if (typeof v === 'number') {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000)); // Excel serial
    return isNaN(d.getTime()) ? undefined : d;
  }
  const s = String(v).trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) { const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); return isNaN(d.getTime()) ? undefined : d; }
  m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (m) {
    let dd = +m[1], mm = +m[2]; let yy = +m[3];
    if (yy < 100) yy += 2000;
    if (mm > 12 && dd <= 12) { const t = dd; dd = mm; mm = t; } // looked like mm/dd
    const d = new Date(Date.UTC(yy, mm - 1, dd));
    return isNaN(d.getTime()) || mm > 12 || dd > 31 ? undefined : d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

function cleanField(f, raw) {
  const empty = raw == null || String(raw).trim() === '';
  if (empty) {
    if (f.required) return { error: `${f.label} is required` };
    return { value: defaultOf(f) };
  }
  // For optional fields, an unparseable value falls back to the default with a
  // warning (keeps the row importable). Required fields hard-error.
  const bad = (msg) => (f.required ? { error: msg } : { value: defaultOf(f), warning: `${msg} — used default` });
  switch (f.type) {
    case 'string': return { value: String(raw).trim() };
    case 'upper': return { value: String(raw).trim().toUpperCase() };
    case 'lower': return { value: String(raw).trim().toLowerCase() };
    case 'int': {
      const n = parseInt(String(raw).replace(/[^0-9-]/g, ''), 10);
      return Number.isNaN(n) ? bad(`${f.label}: "${raw}" is not a number`) : { value: n };
    }
    case 'decimal': {
      const n = parseFloat(String(raw).replace(/[^0-9.-]/g, ''));
      return Number.isNaN(n) ? bad(`${f.label}: "${raw}" is not a number`) : { value: n };
    }
    case 'bool': return { value: ['true', 'yes', '1', 'y', 't'].includes(String(raw).trim().toLowerCase()) };
    case 'date': {
      const d = parseDate(raw);
      return d === undefined ? bad(`${f.label}: unrecognised date "${raw}"`) : { value: d };
    }
    case 'enum': {
      const v = String(raw).trim().toLowerCase().replace(/[\s-]+/g, '_');
      return f.enumValues.includes(v) ? { value: v } : bad(`${f.label}: "${raw}" not one of ${f.enumValues.join(', ')}`);
    }
    default: return { value: String(raw).trim() };
  }
}

// Build a cleaned record for one raw row given the mapping
function buildRecord(entity, mapping, rawRow) {
  const { fields } = getSchema(entity);
  const data = {};
  const errors = [];
  const warnings = [];
  for (const f of fields) {
    const header = mapping[f.key];
    const raw = header ? rawRow[header] : undefined;
    const res = cleanField(f, raw);
    if (res.error) errors.push(res.error);
    else { data[f.key] = res.value; if (res.warning) warnings.push(res.warning); }
  }
  return { data, errors, warnings };
}

// ── preview ────────────────────────────────────────────────────────────
async function preview(entity, mapping, rows) {
  const schema = getSchema(entity);
  const keyField = schema.keyField;

  const built = rows.map((raw, i) => {
    const { data, errors, warnings } = buildRecord(entity, mapping, raw);
    return { index: i, line: i + 2, data, errors, warnings, key: data[keyField] || null };
  });

  // existing keys in DB
  const keys = [...new Set(built.filter((b) => !b.errors.length && b.key).map((b) => b.key))];
  let existing = new Set();
  if (keys.length) {
    const where = { [keyField]: { in: keys } };
    const found = entity === 'vehicles'
      ? await prisma.vehicle.findMany({ where, select: { registration: true } })
      : await prisma.employee.findMany({ where, select: { email: true } });
    existing = new Set(found.map((r) => r[keyField]));
  }

  const seen = new Set();
  const result = built.map((b) => {
    let status;
    if (b.errors.length) status = 'error';
    else if (seen.has(b.key)) status = 'dupe_file';
    else if (existing.has(b.key)) status = 'update';
    else status = 'new';
    if (b.key && !b.errors.length) seen.add(b.key);
    return { index: b.index, line: b.line, key: b.key, status, errors: b.errors, warnings: b.warnings, data: b.data };
  });

  const summary = ['new', 'update', 'dupe_file', 'error'].reduce((a, s) => { a[s] = result.filter((r) => r.status === s).length; return a; }, { total: result.length });
  return { summary, rows: result, fields: fieldList(entity) };
}

// ── commit ─────────────────────────────────────────────────────────────
async function commit(entity, mapping, rows, dedup /* 'skip' | 'update' */) {
  const pre = await preview(entity, mapping, rows);
  const keyField = getSchema(entity).keyField;
  const results = [];

  for (const r of pre.rows) {
    try {
      if (r.status === 'error') { results.push({ line: r.line, key: r.key, status: 'failed', message: r.errors.join('; ') }); continue; }
      if (r.status === 'dupe_file') { results.push({ line: r.line, key: r.key, status: 'skipped', message: 'duplicate within file' }); continue; }
      if (r.status === 'update' && dedup === 'skip') { results.push({ line: r.line, key: r.key, status: 'skipped', message: 'existing record kept' }); continue; }

      const data = { ...r.data };
      if (entity === 'vehicles') {
        data.nextPmiDate = data.lastPmiDate ? calcNextPmi(data.lastPmiDate, data.pmiIntervalWeeks) : null;
        if (r.status === 'update') await prisma.vehicle.update({ where: { registration: r.key }, data });
        else await prisma.vehicle.create({ data });
      } else {
        if (r.status === 'update') {
          const ex = await prisma.employee.findFirst({ where: { email: r.key }, select: { id: true } });
          await prisma.employee.update({ where: { id: ex.id }, data });
        } else await prisma.employee.create({ data });
      }
      results.push({ line: r.line, key: r.key, status: r.status === 'update' ? 'updated' : 'created' });
    } catch (e) {
      results.push({ line: r.line, key: r.key, status: 'failed', message: e.message });
    }
  }

  const summary = ['created', 'updated', 'skipped', 'failed'].reduce((a, s) => { a[s] = results.filter((r) => r.status === s).length; return a; }, { total: results.length });
  return { summary, results };
}

module.exports = { fieldList, suggestMapping, preview, commit, SCHEMAS };
