// Authentication controller: register, login, logout, current user.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';
import * as userModel from '../models/userModel.js';
import * as emailService from '../services/emailService.js';
import { ok, fail, asyncHandler } from '../utils/helpers.js';
import { isNonEmptyString, isValidEmail, isValidPassword } from '../utils/validate.js';

function setTokenCookie(res, user) {
  const token = jwt.sign(
    { sub: user.id, role: user.role, name: user.name },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
  res.cookie('token', token, {
    httpOnly: true,                          // JS in the browser cannot read it
    secure: env.isProduction,                // HTTPS only in production
    sameSite: 'strict',                      // CSRF protection
  });
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!isNonEmptyString(name, 100)) {
    return fail(res, 'Please enter your name (up to 100 characters).');
  }
  if (!isValidEmail(email)) {
    return fail(res, 'Please enter a valid email address.');
  }
  if (!isValidPassword(password)) {
    return fail(res, 'Password must be at least 8 characters and include a letter and a number.');
  }

  const existing = await userModel.findByEmail(email.toLowerCase());
  if (existing) {
    if (existing.is_verified) {
      return fail(res, 'An account with this email already exists. Try logging in.', 409);
    } else {
      await userModel.deleteUnverifiedUser(email.toLowerCase());
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = await userModel.createUser({
    name: name.trim(),
    email: email.toLowerCase(),
    passwordHash,
  });

  const token = crypto.randomBytes(32).toString('hex');
  await userModel.createVerificationToken(userId, token);
  
  // Send email asynchronously without blocking the response
  emailService.sendVerificationEmail(email.toLowerCase(), name.trim(), token).catch(console.error);

  return ok(res, { message: 'Please check your email to verify your account.' }, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!isValidEmail(email) || typeof password !== 'string') {
    return fail(res, 'Please enter your email and password.');
  }

  const user = await userModel.findByEmail(email.toLowerCase());
  // Same error message whether the email or the password is wrong,
  // so attackers cannot discover which emails are registered.
  const invalidMessage = 'Email or password is incorrect.';
  if (!user) return fail(res, invalidMessage, 401);

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) return fail(res, invalidMessage, 401);

  if (!user.is_verified && user.role !== 'admin') {
    return fail(res, 'Please verify your email address before logging in. Check your inbox for the verification link.', 403);
  }

  setTokenCookie(res, user);
  return ok(res, { id: user.id, name: user.name, email: user.email, role: user.role });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  return ok(res, { message: 'Logged out.' });
});

export const me = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user.id);
  if (!user) return fail(res, 'Account not found.', 404);
  return ok(res, user);
});

export const updateGoals = asyncHandler(async (req, res) => {
  const { targetBand, examDate } = req.body || {};

  if (targetBand !== undefined && targetBand !== null) {
    const band = Number(targetBand);
    if (Number.isNaN(band) || band < 4 || band > 9 || (band * 2) % 1 !== 0) {
      return fail(res, 'Target band must be between 4.0 and 9.0 in 0.5 steps.');
    }
  }
  if (examDate !== undefined && examDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(examDate)) {
    return fail(res, 'Exam date must be in YYYY-MM-DD format.');
  }

  await userModel.updateGoals(req.user.id, { targetBand, examDate });
  return ok(res, { message: 'Goals updated.' });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.redirect('/pages/login.html?error=missing_token');
  }

  const success = await userModel.verifyUserEmail(token);
  
  if (success) {
    res.redirect('/pages/login.html?verified=true');
  } else {
    res.redirect('/pages/login.html?error=invalid_token');
  }
});
