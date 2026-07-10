// Small shared utilities used across controllers.

// Every API response uses the same JSON shape so the frontend can handle
// all responses with one pattern: { success, data, error }
export function ok(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data, error: null });
}

export function fail(res, message, statusCode = 400) {
  return res.status(statusCode).json({ success: false, data: null, error: message });
}

// Express 4 does not catch errors thrown inside async route handlers.
// Wrapping every handler in asyncHandler forwards them to errorHandler
// middleware instead of crashing the process.
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// An error with an HTTP status attached, thrown from controllers/models.
export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}
