const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { ok } = require('../utils/responseHelper');
const { ValidationError } = require('../utils/errors');
const { calcNextPmi } = require('../utils/dateHelpers');

const splitCsvLine = (line) => {
  const values = [];
  let current = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];
    if (ch === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      values.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  values.push(current.trim());
  return values;
};

const parseCsv = (csv) => {
  const lines = String(csv || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length < 2) throw new ValidationError('Paste a CSV header row and at least one data row');

  const headers = splitCsvLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map((line, index) => {
    const values = splitCsvLine(line);
    const row = { _line: index + 2 };
    headers.forEach((header, i) => {
      row[header] = values[i] || '';
    });
    return row;
  });
};

const boolValue = (value) => ['true', 'yes', '1', 'y'].includes(String(value || '').trim().toLowerCase());
const dateValue = (value, field) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ValidationError(`Invalid date for ${field}: ${value}`);
  return date;
};
const decimalValue = (value, fallback = 0) => Number.parseFloat(value || fallback);
const intValue = (value, fallback = 0) => Number.parseInt(value || fallback, 10);

const importUsers = async (rows) => {
  const results = [];
  for (const row of rows) {
    try {
      const email = row.email?.toLowerCase().trim();
      if (!email || !row.role) throw new ValidationError('email and role are required');
      const password = row.password || 'ChangeMe2026!';
      const data = {
        email,
        role: row.role,
        firstName: row.firstName || row.first_name || 'New',
        lastName: row.lastName || row.last_name || 'User',
        phone: row.phone || null,
        isActive: row.isActive ? boolValue(row.isActive) : true,
      };
      const existing = await prisma.user.findUnique({ where: { email } });
      const user = existing
        ? await prisma.user.update({ where: { email }, data })
        : await prisma.user.create({ data: { ...data, passwordHash: await bcrypt.hash(password, 10) } });
      results.push({ line: row._line, status: existing ? 'updated' : 'created', key: user.email });
    } catch (error) {
      results.push({ line: row._line, status: 'failed', key: row.email || '', message: error.message });
    }
  }
  return results;
};

const importEmployees = async (rows) => {
  const results = [];
  for (const row of rows) {
    try {
      const email = row.email?.toLowerCase().trim();
      if (!email || !row.fullName) throw new ValidationError('fullName and email are required');
      const data = {
        fullName: row.fullName,
        dateOfBirth: dateValue(row.dateOfBirth || row.dob, 'dateOfBirth') || new Date('1990-01-01'),
        homeAddress: row.homeAddress || row.address || 'To be confirmed',
        phone: row.phone || '',
        email,
        emergencyContactName: row.emergencyContactName || null,
        emergencyContactPhone: row.emergencyContactPhone || null,
        nextOfKin: row.nextOfKin || null,
        jobTitle: row.jobTitle || 'Employee',
        department: row.department || 'Operations',
        startDate: dateValue(row.startDate, 'startDate') || new Date(),
        employmentStatus: row.employmentStatus || 'active',
        contractedHours: decimalValue(row.contractedHours, 40),
        salary: decimalValue(row.salary, 0),
        workLocation: row.workLocation || 'Main Depot',
        isDriver: boolValue(row.isDriver),
        isSponsored: boolValue(row.isSponsored),
      };
      const existing = await prisma.employee.findFirst({ where: { email } });
      const employee = existing
        ? await prisma.employee.update({ where: { id: existing.id }, data })
        : await prisma.employee.create({ data });
      results.push({ line: row._line, status: existing ? 'updated' : 'created', key: employee.email });
    } catch (error) {
      results.push({ line: row._line, status: 'failed', key: row.email || row.fullName || '', message: error.message });
    }
  }
  return results;
};

const importVehicles = async (rows) => {
  const results = [];
  for (const row of rows) {
    try {
      const registration = row.registration?.toUpperCase().trim();
      if (!registration || !row.vinNumber) throw new ValidationError('registration and vinNumber are required');
      const lastPmiDate = dateValue(row.lastPmiDate, 'lastPmiDate');
      const pmiIntervalWeeks = intValue(row.pmiIntervalWeeks, 6);
      const data = {
        registration,
        vinNumber: row.vinNumber,
        make: row.make || 'Unknown',
        model: row.model || 'Unknown',
        year: intValue(row.year, new Date().getFullYear()),
        operatorLicenceDisc: row.operatorLicenceDisc || null,
        motExpiryDate: dateValue(row.motExpiryDate, 'motExpiryDate') || new Date(),
        roadTaxExpiryDate: dateValue(row.roadTaxExpiryDate, 'roadTaxExpiryDate'),
        insuranceExpiryDate: dateValue(row.insuranceExpiryDate, 'insuranceExpiryDate') || new Date(),
        tachoCalibrExpiry: dateValue(row.tachoCalibrExpiry, 'tachoCalibrExpiry'),
        pmiIntervalWeeks,
        lastPmiDate,
        nextPmiDate: lastPmiDate ? calcNextPmi(lastPmiDate, pmiIntervalWeeks) : null,
        currentMileage: intValue(row.currentMileage, 0),
        status: row.status || 'active',
      };
      const existing = await prisma.vehicle.findUnique({ where: { registration } });
      const vehicle = existing
        ? await prisma.vehicle.update({ where: { registration }, data })
        : await prisma.vehicle.create({ data });
      results.push({ line: row._line, status: existing ? 'updated' : 'created', key: vehicle.registration });
    } catch (error) {
      results.push({ line: row._line, status: 'failed', key: row.registration || '', message: error.message });
    }
  }
  return results;
};

exports.importCsv = async (req, res, next) => {
  try {
    const { entity, csv } = req.body;
    const rows = parseCsv(csv);
    let results;
    if (entity === 'users') results = await importUsers(rows);
    else if (entity === 'employees') results = await importEmployees(rows);
    else if (entity === 'vehicles') results = await importVehicles(rows);
    else throw new ValidationError('entity must be users, employees, or vehicles');

    const summary = {
      total: results.length,
      created: results.filter(r => r.status === 'created').length,
      updated: results.filter(r => r.status === 'updated').length,
      failed: results.filter(r => r.status === 'failed').length,
    };
    return ok(res, { summary, results });
  } catch (e) { next(e); }
};
