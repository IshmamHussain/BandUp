// SQL for the reading module: passages, their questions, and scoring.
import { pool } from '../config/db.js';

export async function listTests(userId) {
  const [rows] = await pool.execute(
    `SELECT rt.id, rt.title, rt.difficulty, rt.time_limit,
            COUNT(DISTINCT q.id) AS question_count,
            MAX(b.id IS NOT NULL) AS bookmarked,
            (SELECT ROUND(100 * SUM(a.is_correct) / COUNT(*))
             FROM attempts a
             JOIN questions q2 ON q2.id = a.question_id
             JOIN reading_passages rp2 ON rp2.id = q2.passage_id
             WHERE rp2.test_id = rt.id AND a.user_id = ?) AS best_accuracy
     FROM reading_tests rt
     LEFT JOIN reading_passages rp ON rp.test_id = rt.id
     LEFT JOIN questions q ON q.passage_id = rp.id
     LEFT JOIN bookmarks b ON b.item_type = 'reading_test' AND b.item_id = rt.id AND b.user_id = ?
     GROUP BY rt.id
     ORDER BY rt.id`,
    [userId, userId]
  );
  return rows;
}

export async function getTestWithPassages(testId) {
  const [tests] = await pool.execute(
    'SELECT id, title, difficulty, time_limit FROM reading_tests WHERE id = ?',
    [testId]
  );
  if (!tests[0]) return null;

  const [passages] = await pool.execute(
    'SELECT id, title, body, passage_type, position, difficulty FROM reading_passages WHERE test_id = ? ORDER BY position',
    [testId]
  );

  const test = tests[0];
  test.passages = passages;

  for (const passage of test.passages) {
    const [questions] = await pool.execute(
      `SELECT id, question_type, question_text, options_json, position
       FROM questions WHERE passage_id = ? ORDER BY position`,
      [passage.id]
    );
    passage.questions = questions.map((q) => ({
      ...q,
      options_json: typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json,
    }));
  }

  return test;
}

export async function getAnswerKey(testId) {
  const [rows] = await pool.execute(
    `SELECT q.id, q.correct_answer, q.explanation, q.passage_id 
     FROM questions q 
     JOIN reading_passages rp ON q.passage_id = rp.id 
     WHERE rp.test_id = ?`,
    [testId]
  );
  return rows;
}

export async function toggleBookmark(userId, testId) {
  const [existing] = await pool.execute(
    `SELECT id FROM bookmarks WHERE user_id = ? AND item_type = 'reading_test' AND item_id = ?`,
    [userId, testId]
  );
  if (existing.length > 0) {
    await pool.execute('DELETE FROM bookmarks WHERE id = ?', [existing[0].id]);
    return false;
  }
  await pool.execute(
    `INSERT INTO bookmarks (user_id, item_type, item_id) VALUES (?, 'reading_test', ?)`,
    [userId, testId]
  );
  return true;
}

export async function testExists(testId) {
  const [rows] = await pool.execute('SELECT id FROM reading_tests WHERE id = ?', [testId]);
  return rows.length > 0;
}

export async function saveAttempts(userId, attempts) {
  if (attempts.length === 0) return;
  const values = attempts.map((a) => [userId, a.questionId, a.givenAnswer, a.isCorrect ? 1 : 0, a.timeTaken ?? null]);
  await pool.query(
    'INSERT INTO attempts (user_id, question_id, given_answer, is_correct, time_taken) VALUES ?',
    [values]
  );
}

export async function deleteAttempts(userId, testId) {
  await pool.execute(
    `DELETE a FROM attempts a
     JOIN questions q ON q.id = a.question_id
     JOIN reading_passages rp ON rp.id = q.passage_id
     WHERE rp.test_id = ? AND a.user_id = ?`,
    [testId, userId]
  );
}
