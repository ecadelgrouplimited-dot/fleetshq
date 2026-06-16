const ok = (res, data, meta = null, statusCode = 200) => {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

const created = (res, data) => ok(res, data, null, 201);

const paginate = (res, data, total, page, limit) =>
  ok(res, data, { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) });

module.exports = { ok, created, paginate };
