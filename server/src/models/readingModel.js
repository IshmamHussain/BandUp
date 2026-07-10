// SQL for the reading module: passages, their questions, and scoring.
import { pool } from '../config/db.js';

export async function listPassages(userId) {
  // LEFT JOINs bring in each user's best score and bookmark state so the
  // passage list can show progress without extra API round trips.
  const [rows] = await pool.execute(
    `SELECT rp.id, rp.title, rp.passage_type, rp.difficulty, rp.time_limit,
            COUNT(DISTINCT q.id) AS question_count,
            MAX(b.id IS NOT NULL) AS bookmarked,
            (SELECT ROUND(100 * SUM(a.is_correct) / COUNT(*))
             FROM attempts a
             JOIN questions q2 ON q2.id = a.question_id
             WHERE q2.passage_id = rp.id AND a.user_id = ?) AS best_accuracy
     FROM reading_passages rp
     LEFT JOIN questions q ON q.passage_id = rp.id
     LEFT JOIN bookmarks b ON b.item_type = 'passage' AND b.item_id = rp.id AND b.user_id = ?
     GROUP BY rp.id
     ORDER BY rp.id`,
    [userId, userId]
  );
  return rows;
}

export async function getPassageWithQuestions(passageId) {
  const [passages] = await pool.execute(
    'SELECT id, title, body, passage_type, difficulty, time_limit FROM reading_passages WHERE id = ?',
    [passageId]
  );
  if (!passages[0]) return null;

  // Note: correct_answer and explanation are NOT selected here.
  // They must never reach the browser before the student submits,
  // otherwise answers are visible in DevTools.
  const [questions] = await pool.execute(
    `SELECT id, question_type, question_text, options_json, position
     FROM questions WHERE passage_id = ? ORDER BY position`,
    [passageId]
  );

  return {
    ...passages[0],
    questions: questions.map((q) => ({
      ...q,
      options_json: typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json,
    })),
  };
}

export async function getAnswerKey(passageId) {
  const [rows] = await pool.execute(
    'SELECT id, correct_answer, explanation FROM questions WHERE passage_id = ?',
    [passageId]
  );
  return rows;
}

export async function toggleBookmark(userId, passageId) {
  const [existing] = await pool.execute(
    `SELECT id FROM bookmarks WHERE user_id = ? AND item_type = 'passage' AND item_id = ?`,
    [userId, passageId]
  );
  if (existing.length > 0) {
    await pool.execute('DELETE FROM bookmarks WHERE id = ?', [existing[0].id]);
    return false;
  }
  await pool.execute(
    `INSERT INTO bookmarks (user_id, item_type, item_id) VALUES (?, 'passage', ?)`,
    [userId, passageId]
  );
  return true;
}

export async function passageExists(passageId) {
  const [rows] = await pool.execute('SELECT id FROM reading_passages WHERE id = ?', [passageId]);
  return rows.length > 0;
}

export async function saveAttempts(userId, attempts) {
  if (attempts.length === 0) return;
  // Bulk insert: one query for the whole submission.
  const values = attempts.map((a) => [userId, a.questionId, a.givenAnswer, a.isCorrect ? 1 : 0, a.timeTaken ?? null]);
  await pool.query(
    'INSERT INTO attempts (user_id, question_id, given_answer, is_correct, time_taken) VALUES ?',
    [values]
  );
}
