const importSvc = require('../services/import.service');
const { ok } = require('../utils/responseHelper');
const { ValidationError } = require('../utils/errors');

const ENTITIES = ['vehicles', 'employees'];
const assertEntity = (e) => { if (!ENTITIES.includes(e)) throw new ValidationError('Import type must be vehicles or employees'); };

// Suggest a header→field mapping + field metadata for the mapping step
exports.analyze = async (req, res, next) => {
  try {
    const { entity, headers } = req.body;
    assertEntity(entity);
    if (!Array.isArray(headers)) throw new ValidationError('headers must be an array');
    return ok(res, { mapping: importSvc.suggestMapping(entity, headers), fields: importSvc.fieldList(entity) });
  } catch (e) { next(e); }
};

// Validate + clean + classify (new/update/duplicate/error) without writing
exports.preview = async (req, res, next) => {
  try {
    const { entity, mapping, rows } = req.body;
    assertEntity(entity);
    if (!mapping || typeof mapping !== 'object') throw new ValidationError('mapping is required');
    if (!Array.isArray(rows) || rows.length === 0) throw new ValidationError('No rows to import');
    if (rows.length > 5000) throw new ValidationError('Import is limited to 5000 rows at a time');
    return ok(res, await importSvc.preview(entity, mapping, rows));
  } catch (e) { next(e); }
};

// Write the rows; dedup = 'skip' | 'update'
exports.commit = async (req, res, next) => {
  try {
    const { entity, mapping, rows, dedup } = req.body;
    assertEntity(entity);
    if (!mapping || typeof mapping !== 'object') throw new ValidationError('mapping is required');
    if (!Array.isArray(rows) || rows.length === 0) throw new ValidationError('No rows to import');
    if (rows.length > 5000) throw new ValidationError('Import is limited to 5000 rows at a time');
    const strategy = dedup === 'update' ? 'update' : 'skip';
    return ok(res, await importSvc.commit(entity, mapping, rows, strategy));
  } catch (e) { next(e); }
};
