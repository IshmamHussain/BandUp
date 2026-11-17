// Authentication middleware.
// The JWT lives in an HTTP-only cookie named "token", set at login.
// HTTP-only means JavaScript in the browser cannot read it, which protects
// the session even if an XSS bug slips into the frontend.
//
// A valid signature is NOT enough on its own. On every request we also
// load the user from MySQL and check:
//   - the account still exists,
//   - the token's version ("tv") matches users.token_version, so logout,
//     demotion or `npm run admin -- revoke` kill old tokens immediately,
//   - the role comes from the database, never from the token, so a
//     demoted admin loses access on their very next request.
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { fail } from '../utils/helpers.js';
import { findAuthState } from '../models/userModel.js';

export async function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return fail(res, 'Not logged in. Please sign in to continue.', 401);
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwt.secret, { algorithms: ['HS256'] });
  } catch {
    return fail(res, 'Your session has expired. Please sign in again.', 401);
  }

  try {
    const user = await findAuthState(payload.sub);
    if (!user || !Number.isInteger(payload.tv) || payload.tv !== user.token_version) {
      res.clearCookie('token', cookieOptions());
      return fail(res, 'Your session has expired. Please sign in again.', 401);
    }
    req.user = { id: user.id, role: user.role, name: user.name };
    return next();
  } catch (err) {
    return next(err);
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return fail(res, 'Admin access required.', 403);
  }
  return next();
}

// Shared so that setting and clearing the cookie always use the same flags
// (browsers only clear a cookie when the attributes match).
export function cookieOptions() {
  return {
    httpOnly: true,                          // JS in the browser cannot read it
    secure: env.isProduction,                // HTTPS only in production
    sameSite: 'strict',                      // CSRF protection
  };
}
