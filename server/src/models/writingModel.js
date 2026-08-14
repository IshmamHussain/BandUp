// SQL for the writing module.
import { pool } from '../config/db.js';

export async function listPrompts() {
  const [rows] = await pool.execute(
    'SELECT id, task_type, prompt_text, category, chart_data FROM writing_prompts ORDER BY task_type, id'
  );
  return rows.map((row) => ({
    ...row,
    chart_data: typeof row.chart_data === 'string' ? JSON.parse(row.chart_data) : row.chart_data,
  }));
}

export async function getPrompt(promptId) {
  const [rows] = await pool.execute(
    'SELECT id, task_type, prompt_text, category, chart_data FROM writing_prompts WHERE id = ?',
    [promptId]
  );
  const row = rows[0] || null;
  if (row && typeof row.chart_data === 'string') {
    row.chart_data = JSON.parse(row.chart_data);
  }
  return row;
}

export async function createSubmission(userId, { promptId, taskType, essayText, wordCount, status }) {
  const [result] = await pool.execute(
    `INSERT INTO writing_submissions (user_id, prompt_id, task_type, essay_text, word_count, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, promptId ?? null, taskType, essayText, wordCount, status]
  );
  return result.insertId;
}

export async function saveEvaluation(submissionId, bandOverall, evaluation) {
  await pool.execute(
    `UPDATE writing_submissions
     SET status = 'evaluated', band_overall = ?, evaluation_json = ?
     WHERE id = ?`,
    [bandOverall, JSON.stringify(evaluation), submissionId]
  );
}

export async function listSubmissions(userId) {
  const [rows] = await pool.execute(
    `SELECT ws.id, ws.task_type, ws.word_count, ws.status, ws.band_overall, ws.created_at,
            wp.prompt_text, wp.category
     FROM writing_submissions ws
     LEFT JOIN writing_prompts wp ON wp.id = ws.prompt_id
     WHERE ws.user_id = ?
     ORDER BY ws.created_at DESC`,
    [userId]
  );
  return rows;
}

export async function getSubmission(userId, submissionId) {
  // user_id is part of the WHERE clause so one student can never read
  // another student's essay by guessing IDs.
  const [rows] = await pool.execute(
    `SELECT ws.*, wp.prompt_text
     FROM writing_submissions ws
     LEFT JOIN writing_prompts wp ON wp.id = ws.prompt_id
     WHERE ws.id = ? AND ws.user_id = ?`,
    [submissionId, userId]
  );
  const row = rows[0];
  if (!row) return null;
  if (typeof row.evaluation_json === 'string') {
    row.evaluation_json = JSON.parse(row.evaluation_json);
  }
  return row;
}

export async function getWritingStats(userId) {
  const [rows] = await pool.execute(
    `SELECT ws.id, ws.band_overall, ws.evaluation_json, ws.created_at, ws.word_count, ws.task_type,
            wp.prompt_text, wp.category
     FROM writing_submissions ws
     LEFT JOIN writing_prompts wp ON wp.id = ws.prompt_id
     WHERE ws.user_id = ? AND ws.status = 'evaluated' AND ws.band_overall IS NOT NULL
     ORDER BY ws.created_at ASC`,
    [userId]
  );
  return rows.map((row) => ({
    ...row,
    evaluation_json: typeof row.evaluation_json === 'string' ? JSON.parse(row.evaluation_json) : row.evaluation_json,
  }));
}
