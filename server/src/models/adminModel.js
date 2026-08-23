// Admin CRUD model — all SQL for managing IELTS modules.
// Every query uses prepared statements; no string interpolation of user input.
import { pool } from '../config/db.js';

// ── Dashboard stats ──────────────────────────────────────────────────
export async function getStats() {
  const [[row]] = await pool.execute(
    `SELECT
       (SELECT COUNT(*) FROM reading_passages) AS passages,
       (SELECT COUNT(*) FROM listening_tests)  AS tests,
       (SELECT COUNT(*) FROM vocabulary)       AS words,
       (SELECT COUNT(*) FROM writing_prompts)  AS prompts,
       (SELECT COUNT(*) FROM users WHERE role = 'student') AS users`
  );
  return row;
}

// ── Reading passages ─────────────────────────────────────────────────
export async function listPassages() {
  const [rows] = await pool.execute(
    `SELECT rp.*,
            COUNT(q.id) AS question_count
     FROM reading_passages rp
     LEFT JOIN questions q ON q.passage_id = rp.id
     GROUP BY rp.id ORDER BY rp.id DESC`
  );
  return rows;
}

export async function getPassage(id) {
  const [rows] = await pool.execute('SELECT * FROM reading_passages WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function createPassage({ title, body, passageType, difficulty, timeLimit }) {
  // Auto-create a reading_test wrapper so the passage appears on the student side.
  // The student reading module queries reading_tests, not reading_passages directly.
  const [testResult] = await pool.execute(
    'INSERT INTO reading_tests (title, difficulty, time_limit) VALUES (?, ?, ?)',
    [title, difficulty || 'medium', timeLimit || 20]
  );
  const testId = testResult.insertId;

  const [result] = await pool.execute(
    'INSERT INTO reading_passages (test_id, title, body, passage_type, difficulty, time_limit) VALUES (?, ?, ?, ?, ?, ?)',
    [testId, title, body, passageType || 'academic', difficulty || 'medium', timeLimit || 20]
  );
  return result.insertId;
}

export async function updatePassage(id, { title, body, passageType, difficulty, timeLimit }) {
  // Keep the parent reading_test in sync
  const [rows] = await pool.execute('SELECT test_id FROM reading_passages WHERE id = ?', [id]);
  if (rows[0]?.test_id) {
    await pool.execute(
      'UPDATE reading_tests SET title = ?, difficulty = ?, time_limit = ? WHERE id = ?',
      [title, difficulty, timeLimit, rows[0].test_id]
    );
  }
  await pool.execute(
    'UPDATE reading_passages SET title = ?, body = ?, passage_type = ?, difficulty = ?, time_limit = ? WHERE id = ?',
    [title, body, passageType, difficulty, timeLimit, id]
  );
}

export async function deletePassage(id) {
  // Delete the parent reading_test (cascades to the passage via FK)
  const [rows] = await pool.execute('SELECT test_id FROM reading_passages WHERE id = ?', [id]);
  if (rows[0]?.test_id) {
    await pool.execute('DELETE FROM reading_tests WHERE id = ?', [rows[0].test_id]);
  }
  // If no test_id, delete the orphan passage directly
  await pool.execute('DELETE FROM reading_passages WHERE id = ?', [id]);
}

// ── Questions (shared by Reading + Listening) ────────────────────────
export async function listQuestions(filter) {
  let sql, params;
  if (filter.passageId) {
    sql = 'SELECT * FROM questions WHERE passage_id = ? ORDER BY position';
    params = [filter.passageId];
  } else if (filter.listeningTestId) {
    sql = 'SELECT * FROM questions WHERE listening_test_id = ? ORDER BY position';
    params = [filter.listeningTestId];
  } else {
    return [];
  }
  const [rows] = await pool.execute(sql, params);
  return rows.map(q => ({
    ...q,
    options_json: typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json,
  }));
}

export async function createQuestion({ passageId, listeningTestId, module, questionType, questionText, optionsJson, correctAnswer, explanation, position }) {
  const [result] = await pool.execute(
    `INSERT INTO questions (passage_id, listening_test_id, module, question_type, question_text, options_json, correct_answer, explanation, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [passageId || null, listeningTestId || null, module, questionType, questionText,
     optionsJson ? JSON.stringify(optionsJson) : null, correctAnswer, explanation || null, position || 1]
  );
  return result.insertId;
}

export async function updateQuestion(id, { questionType, questionText, optionsJson, correctAnswer, explanation, position }) {
  await pool.execute(
    `UPDATE questions SET question_type = ?, question_text = ?, options_json = ?, correct_answer = ?, explanation = ?, position = ? WHERE id = ?`,
    [questionType, questionText, optionsJson ? JSON.stringify(optionsJson) : null, correctAnswer, explanation || null, position, id]
  );
}

export async function deleteQuestion(id) {
  await pool.execute('DELETE FROM questions WHERE id = ?', [id]);
}

export async function bulkCreateQuestions(passageId, questions) {
  if (!questions || questions.length === 0) return [];
  const values = questions.map((q) => [
    passageId, null, 'reading',
    q.question_type || 'mcq',
    q.question_text,
    q.options_json ? JSON.stringify(q.options_json) : null,
    q.correct_answer,
    q.explanation || null,
    q.position || 1,
  ]);
  const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
  const flat = values.flat();
  const [result] = await pool.query(
    `INSERT INTO questions (passage_id, listening_test_id, module, question_type, question_text, options_json, correct_answer, explanation, position)
     VALUES ${placeholders}`,
    flat
  );
  // Return the IDs of the inserted rows
  const ids = [];
  for (let i = 0; i < questions.length; i++) {
    ids.push(result.insertId + i);
  }
  return ids;
}

// ── Listening tests ──────────────────────────────────────────────────
export async function listTests() {
  const [rows] = await pool.execute(
    `SELECT lt.*,
            COUNT(q.id) AS question_count
     FROM listening_tests lt
     LEFT JOIN questions q ON q.listening_test_id = lt.id
     GROUP BY lt.id ORDER BY lt.id DESC`
  );
  return rows;
}

export async function getTest(id) {
  const [rows] = await pool.execute('SELECT * FROM listening_tests WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function createTest({ title, audioUrl, transcript, difficulty, timeLimit }) {
  const [result] = await pool.execute(
    'INSERT INTO listening_tests (title, audio_url, transcript, difficulty, time_limit) VALUES (?, ?, ?, ?, ?)',
    [title, audioUrl, transcript || '', difficulty || 'medium', timeLimit || 30]
  );
  return result.insertId;
}

export async function updateTest(id, { title, audioUrl, transcript, difficulty, timeLimit }) {
  await pool.execute(
    'UPDATE listening_tests SET title = ?, audio_url = ?, transcript = ?, difficulty = ?, time_limit = ? WHERE id = ?',
    [title, audioUrl, transcript, difficulty, timeLimit, id]
  );
}

export async function deleteTest(id) {
  await pool.execute('DELETE FROM listening_tests WHERE id = ?', [id]);
}

// ── Vocabulary ───────────────────────────────────────────────────────
export async function listVocabulary() {
  const [rows] = await pool.execute(
    'SELECT * FROM vocabulary ORDER BY id DESC'
  );
  return rows;
}

export async function getWord(id) {
  const [rows] = await pool.execute('SELECT * FROM vocabulary WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function createWord({ word, meaning, synonyms, antonyms, exampleSentence, pronunciation, category, bandLevel }) {
  const [result] = await pool.execute(
    `INSERT INTO vocabulary (word, meaning, synonyms, antonyms, example_sentence, pronunciation, category, band_level)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [word, meaning, synonyms || null, antonyms || null, exampleSentence || null,
     pronunciation || null, category || 'general', bandLevel || '7']
  );
  return result.insertId;
}

export async function updateWord(id, { word, meaning, synonyms, antonyms, exampleSentence, pronunciation, category, bandLevel }) {
  await pool.execute(
    `UPDATE vocabulary SET word = ?, meaning = ?, synonyms = ?, antonyms = ?, example_sentence = ?,
     pronunciation = ?, category = ?, band_level = ? WHERE id = ?`,
    [word, meaning, synonyms || null, antonyms || null, exampleSentence || null,
     pronunciation || null, category, bandLevel, id]
  );
}

export async function deleteWord(id) {
  await pool.execute('DELETE FROM vocabulary WHERE id = ?', [id]);
}

// ── Writing prompts ──────────────────────────────────────────────────
export async function listPrompts() {
  const [rows] = await pool.execute(
    `SELECT wp.*, COUNT(ws.id) AS submission_count
     FROM writing_prompts wp
     LEFT JOIN writing_submissions ws ON ws.prompt_id = wp.id
     GROUP BY wp.id ORDER BY wp.id DESC`
  );
  return rows;
}

export async function getPrompt(id) {
  const [rows] = await pool.execute('SELECT * FROM writing_prompts WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function createPrompt({ taskType, promptText, category, chartData }) {
  const [result] = await pool.execute(
    'INSERT INTO writing_prompts (task_type, prompt_text, category, chart_data) VALUES (?, ?, ?, ?)',
    [taskType, promptText, category || null, chartData ? JSON.stringify(chartData) : null]
  );
  return result.insertId;
}

export async function updatePrompt(id, { taskType, promptText, category, chartData }) {
  await pool.execute(
    'UPDATE writing_prompts SET task_type = ?, prompt_text = ?, category = ?, chart_data = ? WHERE id = ?',
    [taskType, promptText, category || null, chartData ? JSON.stringify(chartData) : null, id]
  );
}

export async function deletePrompt(id) {
  await pool.execute('DELETE FROM writing_prompts WHERE id = ?', [id]);
}

// ── Speaking prompts ─────────────────────────────────────────────────
export async function listSpeakingPrompts() {
  const [rows] = await pool.execute(
    `SELECT sp.*, COUNT(ss.id) AS submission_count
     FROM speaking_prompts sp
     LEFT JOIN speaking_submissions ss ON ss.prompt_id = sp.id
     GROUP BY sp.id ORDER BY sp.id DESC`
  );
  return rows;
}

export async function getSpeakingPrompt(id) {
  const [rows] = await pool.execute('SELECT * FROM speaking_prompts WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function createSpeakingPrompt({ part, promptText, category }) {
  const [result] = await pool.execute(
    'INSERT INTO speaking_prompts (part, prompt_text, category) VALUES (?, ?, ?)',
    [part, promptText, category || null]
  );
  return result.insertId;
}

export async function updateSpeakingPrompt(id, { part, promptText, category }) {
  await pool.execute(
    'UPDATE speaking_prompts SET part = ?, prompt_text = ?, category = ? WHERE id = ?',
    [part, promptText, category || null, id]
  );
}

export async function deleteSpeakingPrompt(id) {
  await pool.execute('DELETE FROM speaking_prompts WHERE id = ?', [id]);
}

// ── Students ─────────────────────────────────────────────────────────
export async function listStudents() {
  const [rows] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.target_band, u.created_at,
            p.country, p.study_streak, p.current_band_estimate
     FROM users u
     LEFT JOIN profiles p ON u.id = p.user_id
     WHERE u.role = 'student'
     ORDER BY u.created_at DESC`
  );
  return rows;
}

export async function updateStudent(id, { name, targetBand }) {
  await pool.execute(
    "UPDATE users SET name = ?, target_band = ? WHERE id = ? AND role = 'student'",
    [name, targetBand || null, id]
  );
}

export async function deleteStudent(id) {
  // Only delete students to avoid accidentally deleting admins
  await pool.execute("DELETE FROM users WHERE id = ? AND role = 'student'", [id]);
}
