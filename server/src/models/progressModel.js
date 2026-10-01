// SQL for progress tracking and the dashboard/analytics queries.
import { pool } from '../config/db.js';

// Called after any study activity. Upserts today's row for that module.
export async function recordActivity(userId, module, { minutes = 0, attempted = 0, correct = 0 }) {
  await pool.execute(
    `INSERT INTO daily_progress (user_id, module, progress_date, minutes_studied, questions_attempted, questions_correct)
     VALUES (?, ?, CURDATE(), ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       minutes_studied = minutes_studied + VALUES(minutes_studied),
       questions_attempted = questions_attempted + VALUES(questions_attempted),
       questions_correct = questions_correct + VALUES(questions_correct)`,
    [userId, module, minutes, attempted, correct]
  );
}

// Last 7 days of study minutes, one row per day (gaps filled in JS).
export async function weeklyStudyMinutes(userId) {
  const [rows] = await pool.execute(
    `SELECT progress_date, SUM(minutes_studied) AS minutes
     FROM daily_progress
     WHERE user_id = ? AND progress_date >= CURDATE() - INTERVAL 6 DAY
     GROUP BY progress_date
     ORDER BY progress_date`,
    [userId]
  );
  return rows;
}

export async function moduleAccuracy(userId) {
  const [reading] = await pool.execute(
    `SELECT COUNT(*) AS attempted, SUM(is_correct) AS correct
     FROM attempts a
     JOIN questions q ON q.id = a.question_id
     WHERE a.user_id = ? AND q.passage_id IS NOT NULL`, [userId]
  );
  
  const [listening] = await pool.execute(
    `SELECT COUNT(*) AS attempted, SUM(is_correct) AS correct
     FROM attempts a
     JOIN questions q ON q.id = a.question_id
     WHERE a.user_id = ? AND q.listening_test_id IS NOT NULL`, [userId]
  );

  const [writing] = await pool.execute(
    `SELECT COUNT(*) AS attempted, AVG(band_overall) AS avg_band
     FROM writing_submissions
     WHERE user_id = ? AND status = 'evaluated'`, [userId]
  );

  const [speaking] = await pool.execute(
    `SELECT COUNT(*) AS attempted, AVG(band_overall) AS avg_band
     FROM speaking_submissions
     WHERE user_id = ?`, [userId]
  );

  const results = [];
  
  if (reading[0].attempted > 0) {
    results.push({ module: 'reading', attempted: reading[0].attempted, accuracy: Math.round((reading[0].correct / reading[0].attempted) * 100) });
  } else {
    results.push({ module: 'reading', attempted: 0, accuracy: 0 });
  }

  if (listening[0].attempted > 0) {
    results.push({ module: 'listening', attempted: listening[0].attempted, accuracy: Math.round((listening[0].correct / listening[0].attempted) * 100) });
  } else {
    results.push({ module: 'listening', attempted: 0, accuracy: 0 });
  }

  if (writing[0].attempted > 0) {
    results.push({ module: 'writing', attempted: writing[0].attempted, accuracy: Math.round((writing[0].avg_band / 9) * 100) });
  } else {
    results.push({ module: 'writing', attempted: 0, accuracy: 0 });
  }

  if (speaking[0].attempted > 0) {
    results.push({ module: 'speaking', attempted: speaking[0].attempted, accuracy: Math.round((speaking[0].avg_band / 9) * 100) });
  } else {
    results.push({ module: 'speaking', attempted: 0, accuracy: 0 });
  }

  return results;
}

export async function recentActivity(userId, limit = 8) {
  // Recent reading attempts, writing, and speaking submissions merged into one feed.
  const [rows] = await pool.execute(
    `(SELECT 'reading' AS type, rp.title AS label, a.created_at
      FROM attempts a
      JOIN questions q ON q.id = a.question_id
      JOIN reading_passages rp ON rp.id = q.passage_id
      WHERE a.user_id = ?
      GROUP BY rp.id, DATE(a.created_at), a.created_at)
     UNION ALL
     (SELECT 'listening' AS type, lt.title AS label, a.created_at
      FROM attempts a
      JOIN questions q ON q.id = a.question_id
      JOIN listening_tests lt ON lt.id = q.listening_test_id
      WHERE a.user_id = ?
      GROUP BY lt.id, DATE(a.created_at), a.created_at)
     UNION ALL
     (SELECT 'writing' AS type,
             CONCAT('Essay - ', ws.task_type) AS label, ws.created_at
      FROM writing_submissions ws
      WHERE ws.user_id = ?)
     UNION ALL
     (SELECT 'speaking' AS type,
             COALESCE(st.title, 'Speaking Test') AS label, ss.created_at
      FROM speaking_submissions ss
      LEFT JOIN speaking_tests st ON ss.test_id = st.id
      WHERE ss.user_id = ?)
     ORDER BY created_at DESC
     LIMIT ${Number(limit)}`,
    [userId, userId, userId, userId]
  );
  return rows;
}
