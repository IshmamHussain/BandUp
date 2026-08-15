import { pool } from '../config/db.js';

export async function listTests(userId) {
  const [rows] = await pool.execute(
    `SELECT lt.id, lt.title, lt.difficulty, lt.time_limit,
            COUNT(DISTINCT q.id) AS question_count,
            (SELECT ROUND(100 * SUM(a.is_correct) / COUNT(*))
             FROM attempts a
             JOIN questions q2 ON q2.id = a.question_id
             WHERE q2.listening_test_id = lt.id AND a.user_id = ?) AS best_accuracy
     FROM listening_tests lt
     LEFT JOIN questions q ON q.listening_test_id = lt.id
     GROUP BY lt.id
     ORDER BY lt.id`,
    [userId]
  );
  return rows;
}

export async function getTestWithQuestions(testId) {
  const [tests] = await pool.execute(
    'SELECT id, title, audio_url, transcript, difficulty, time_limit FROM listening_tests WHERE id = ?',
    [testId]
  );
  if (!tests[0]) return null;

  const [questions] = await pool.execute(
    `SELECT id, question_type, question_text, options_json, position
     FROM questions WHERE listening_test_id = ? ORDER BY position`,
    [testId]
  );

  return {
    ...tests[0],
    questions: questions.map((q) => ({
      ...q,
      options_json: typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json,
    })),
  };
}

export async function getAnswerKey(testId) {
  const [rows] = await pool.execute(
    'SELECT id, correct_answer, explanation FROM questions WHERE listening_test_id = ?',
    [testId]
  );
  return rows;
}

export async function testExists(testId) {
  const [rows] = await pool.execute('SELECT id FROM listening_tests WHERE id = ?', [testId]);
  return rows.length > 0;
}

export async function deleteAttempts(userId, testId) {
  await pool.execute(
    `DELETE a FROM attempts a
     JOIN questions q ON q.id = a.question_id
     WHERE q.listening_test_id = ? AND a.user_id = ?`,
    [testId, userId]
  );
}
