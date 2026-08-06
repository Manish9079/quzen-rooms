export function ok(res, data = {}, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

export function created(res, data = {}) {
  return ok(res, data, 201);
}

export function fail(res, statusCode, message, details) {
  const body = { success: false, message };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
}
