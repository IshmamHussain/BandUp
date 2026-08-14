// Authentication controller: register, login, logout, current user.
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import * as userModel from '../models/userModel.js';
import { ok, fail, asyncHandler } from '../utils/helpers.js';
import { isNonEmptyString, isValidEmail, isValidPassword } from '../utils/validate.js';

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  : null;

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

  if (!supabase) {
    return fail(res, 'Supabase is not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY to Render environment variables.', 500);
  }

  // Register in Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email.toLowerCase(),
    password: password,
    options: {
      data: { name: name.trim() }
    }
  });

  if (authError) {
    return fail(res, `Supabase Error: ${authError.message}`, 400);
  }

  // Create in MySQL
  await userModel.createUser({
    name: name.trim(),
    email: email.toLowerCase(),
    passwordHash: null,
    supabaseId: authData.user?.id
  });

  return ok(res, { message: 'Please check your email to verify your account.' }, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!isValidEmail(email) || typeof password !== 'string') {
    return fail(res, 'Please enter your email and password.');
  }

  const user = await userModel.findByEmail(email.toLowerCase());
  const invalidMessage = 'Email or password is incorrect.';
  if (!user) return fail(res, invalidMessage, 401);

  if (!supabase) {
    return fail(res, 'Supabase is not configured.', 500);
  }

  // Authenticate with Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase(),
    password: password,
  });

  if (authError) {
    if (authError.message.includes('Email not confirmed')) {
      return fail(res, 'Please verify your email address before logging in. Check your inbox for the verification link.', 403);
    }
    return fail(res, invalidMessage, 401);
  }

  // If Supabase authentication succeeds, they are verified.
  if (!user.is_verified && user.role !== 'admin') {
    await userModel.markUserVerified(user.id);
    user.is_verified = 1;
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


