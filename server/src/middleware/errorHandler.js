// Central error handling. Every error thrown in a controller or model
// ends up here via asyncHandler, so error responses stay consistent and
// internal details never leak to the client in production.
import { env } from '../config/env.js';

export function notFound(req, res) {
  res.status(404).json({ success: false, data: null, error: 'Route not found.' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const message =
    status === 500 && env.isProduction
      ? 'Something went wrong on our side. Please try again.'
      : err.message;

  if (status === 500) {
    // Full details go to the server log only.
    console.error(`[${new Date().toISOString()}]`, err);
  }

  res.status(status).json({ success: false, data: null, error: message });
}
