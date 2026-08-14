// All SQL that touches the users and profiles tables lives here.
// Controllers never write SQL directly - that is the M in MVC.
import { pool } from '../config/db.js';

export async function findByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, password_hash, role, is_verified FROM users WHERE email = ?',
    [email]
  );
  return rows[0] || null;
}

export async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.role, u.target_band, u.exam_date,
            p.current_band_estimate, p.study_streak, p.country, p.avatar_url
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = ?`,
    [id]
  );
  return rows[0] || null;
}

export async function createUser({ name, email, passwordHash, supabaseId }) {
  const connection = await pool.getConnection();
  try {
    // User + profile are created together, so wrap them in a transaction:
    // either both rows exist afterwards, or neither does.
    await connection.beginTransaction();
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password_hash, supabase_id) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash || null, supabaseId || null]
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

export async function updateBandEstimate(userId, band) {
  await pool.execute(
    'UPDATE profiles SET current_band_estimate = ? WHERE user_id = ?',
    [band, userId]
  );
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
