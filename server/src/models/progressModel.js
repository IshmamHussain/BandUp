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

// Accuracy per module across all time, for the module comparison chart.
export async function moduleAccuracy(userId) {
  const [rows] = await pool.execute(
    `SELECT module,
            SUM(questions_attempted) AS attempted,
            SUM(questions_correct) AS correct,
            ROUND(100 * SUM(questions_correct) / NULLIF(SUM(questions_attempted), 0)) AS accuracy
     FROM daily_progress
     WHERE user_id = ?
     GROUP BY module`,
    [userId]
  );
  return rows;
}

export async function recentActivity(userId, limit = 8) {
  // Recent reading attempts and writing submissions merged into one feed.
  const [rows] = await pool.execute(
    `(SELECT 'reading' AS type, rp.title AS label, a.created_at
      FROM attempts a
      JOIN questions q ON q.id = a.question_id
      JOIN reading_passages rp ON rp.id = q.passage_id
      WHERE a.user_id = ?
      GROUP BY rp.id, DATE(a.created_at), a.created_at)
     UNION ALL
     (SELECT 'writing' AS type,
             CONCAT('Essay - ', ws.task_type) AS label, ws.created_at
      FROM writing_submissions ws
      WHERE ws.user_id = ?)
     ORDER BY created_at DESC
     LIMIT ${Number(limit)}`,
    [userId, userId]
  );
  return rows;
}
