// All SQL that touches the users and profiles tables lives here.
// Controllers never write SQL directly - that is the M in MVC.
import { pool } from '../config/db.js';
import { estimateBand, RECENT_RESULTS_PER_MODULE } from '../services/bandEstimate.js';

export async function findByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, role, is_verified, supabase_id, token_version FROM users WHERE email = ?',
    [email]
  );
  return rows[0] || null;
}

export async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.role, u.target_band, u.exam_date, u.supabase_id,
            p.current_band_estimate, 
            CASE 
              WHEN p.last_active_date >= CURDATE() - INTERVAL 1 DAY THEN p.study_streak
              ELSE 0
            END AS study_streak, 
            p.country, p.avatar_url
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = ?`,
    [id]
  );
  return rows[0] || null;
}

export async function createUser({ name, email, supabaseId }) {
  const connection = await pool.getConnection();
  try {
    // User + profile are created together, so wrap them in a transaction:
    // either both rows exist afterwards, or neither does.
    await connection.beginTransaction();
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, supabase_id) VALUES (?, ?, ?)',
      [name, email, supabaseId || null]
    );
    await connection.execute('INSERT INTO profiles (user_id) VALUES (?)', [result.insertId]);
    await connection.commit();
    return result.insertId;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function updateGoals(userId, { targetBand, examDate }) {
  await pool.execute(
    'UPDATE users SET target_band = ?, exam_date = ? WHERE id = ?',
    [targetBand ?? null, examDate ?? null, userId]
  );
}

// Keeps the study streak honest: +1 if the user was last active yesterday,
// reset to 1 if they skipped a day, unchanged if already active today.
export async function touchStreak(userId) {
  await pool.execute(
    `UPDATE profiles
     SET study_streak = CASE
           WHEN last_active_date = CURDATE() THEN study_streak
           WHEN last_active_date = CURDATE() - INTERVAL 1 DAY THEN study_streak + 1
           ELSE 1
         END,
         last_active_date = CURDATE()
     WHERE user_id = ?`,
    [userId]
  );
}

// --- Band estimate (B3) -----------------------------------------------
// The estimate aggregates each module's recent results (see
// services/bandEstimate.js) instead of copying the latest single score.
// `db` lets migrations run this on their own connection.

const RECENT = Number(RECENT_RESULTS_PER_MODULE); // inlined: mysql2 can't bind LIMIT in execute()

export async function getBandEstimate(userId, db = pool) {
  const [reading] = await db.execute(
    `SELECT band, total FROM test_results WHERE user_id = ? AND module = 'reading'
     ORDER BY created_at DESC, id DESC LIMIT ${RECENT}`, [userId]
  );
  const [listening] = await db.execute(
    `SELECT band, total FROM test_results WHERE user_id = ? AND module = 'listening'
     ORDER BY created_at DESC, id DESC LIMIT ${RECENT}`, [userId]
  );
  const [writing] = await db.execute(
    `SELECT band_overall AS band, task_type AS taskType FROM writing_submissions
     WHERE user_id = ? AND status = 'evaluated' AND band_overall IS NOT NULL
     ORDER BY created_at DESC, id DESC LIMIT ${RECENT}`, [userId]
  );
  const [speaking] = await db.execute(
    `SELECT band_overall AS band FROM speaking_submissions
     WHERE user_id = ? AND status = 'evaluated' AND band_overall IS NOT NULL
     ORDER BY created_at DESC, id DESC LIMIT ${RECENT}`, [userId]
  );
  return estimateBand({ reading, listening, writing, speaking });
}

/** Recompute and store the user's estimate. Call after any result is added or deleted. */
export async function recalculateBandEstimate(userId, db = pool) {
  const estimate = await getBandEstimate(userId, db);
  await db.execute(
    'UPDATE profiles SET current_band_estimate = ? WHERE user_id = ?',
    [estimate.overall, userId]
  );
  return estimate;
}

export async function markUserVerified(userId) {
  await pool.execute('UPDATE users SET is_verified = TRUE WHERE id = ?', [userId]);
}

export async function deleteUnverifiedUser(email) {
  await pool.execute(
    'DELETE FROM users WHERE email = ? AND is_verified = FALSE',
    [email]
  );
}

// --- Session revocation -------------------------------------------------
// Every JWT carries the user's token_version (claim "tv"). requireAuth
// compares it with the database on each request, so bumping the number
// instantly invalidates every token issued before - logout, demotion,
// or an incident response all use this.

export async function findAuthState(id) {
  const [rows] = await pool.execute(
    'SELECT id, name, role, token_version FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

export async function revokeSessions(userId) {
  await pool.execute(
    'UPDATE users SET token_version = token_version + 1 WHERE id = ?',
    [userId]
  );
}
