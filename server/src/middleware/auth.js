// Authentication middleware.
// The JWT lives in an HTTP-only cookie named "token", set at login.
// HTTP-only means JavaScript in the browser cannot read it, which protects
// the session even if an XSS bug slips into the frontend.
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { fail } from '../utils/helpers.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return fail(res, 'Not logged in. Please sign in to continue.', 401);
  }
  try {
    const payload = jwt.verify(token, env.jwt.secret);
    // Attach the minimum we need; controllers read req.user.id
    req.user = { id: payload.sub, role: payload.role, name: payload.name };
    return next();
  } catch {
    return fail(res, 'Your session has expired. Please sign in again.', 401);
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return fail(res, 'Admin access required.', 403);
  }
  return next();
}
