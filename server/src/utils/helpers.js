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

// Converts a raw score to an IELTS Band score (scaled to 40 questions)
export function calculateIeltsBand(correct, total) {
  if (total === 0) return 0;
  const scaled = (correct / total) * 40;
  
  if (scaled >= 39) return 9.0;
  if (scaled >= 37) return 8.5;
  if (scaled >= 35) return 8.0;
  if (scaled >= 33) return 7.5;
  if (scaled >= 30) return 7.0;
  if (scaled >= 27) return 6.5;
  if (scaled >= 23) return 6.0;
  if (scaled >= 19) return 5.5;
  if (scaled >= 15) return 5.0;
  if (scaled >= 13) return 4.5;
  if (scaled >= 10) return 4.0;
  if (scaled >= 8) return 3.5;
  if (scaled >= 6) return 3.0;
  if (scaled >= 4) return 2.5;
  return 2.0;
}
