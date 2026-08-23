import { pool } from '../config/db.js';

export async function getPrompts() {
  const [rows] = await pool.query('SELECT * FROM speaking_tests ORDER BY id');
  return rows;
}

export async function createSubmission(userId, testId, audioUrl, durationSec) {
  const [result] = await pool.execute(
    'INSERT INTO speaking_submissions (user_id, test_id, audio_url, duration_sec, status) VALUES (?, ?, ?, ?, ?)',
    [userId, testId, audioUrl, durationSec, 'submitted']
  );
  return result.insertId;
}

export async function updateSubmissionEvaluation(submissionId, bandOverall, evaluationJson) {
  await pool.execute(
    'UPDATE speaking_submissions SET status = ?, band_overall = ?, evaluation_json = ? WHERE id = ?',
    ['evaluated', bandOverall, JSON.stringify(evaluationJson), submissionId]
  );
}

export async function resetSubmissionEvaluation(submissionId) {
  await pool.execute(
    'UPDATE speaking_submissions SET status = ?, band_overall = NULL, evaluation_json = NULL WHERE id = ?',
    ['submitted', submissionId]
  );
}

export async function getSubmission(submissionId, userId) {
  const [rows] = await pool.query(
    `SELECT s.*, p.title as prompt_text, p.category, p.part1_prompt, p.part2_prompt, p.part3_prompt 
     FROM speaking_submissions s 
     LEFT JOIN speaking_tests p ON s.test_id = p.id 
     WHERE s.id = ? AND s.user_id = ?`,
    [submissionId, userId]
  );
  return rows[0];
}

export async function getUserHistory(userId) {
  const [rows] = await pool.query(
    `SELECT s.id, s.band_overall, s.created_at, s.status, s.duration_sec, p.title as prompt_text 
     FROM speaking_submissions s
     LEFT JOIN speaking_tests p ON s.test_id = p.id
     WHERE s.user_id = ? ORDER BY s.created_at DESC`,
    [userId]
  );
  return rows;
}

export async function getSpeakingStats(userId) {
  const [summary] = await pool.execute(
    'SELECT COUNT(*) as total, AVG(band_overall) as avg_band, MAX(band_overall) as best_band FROM speaking_submissions WHERE user_id = ? AND status = \'evaluated\'',
    [userId]
  );

  const [history] = await pool.execute(
    'SELECT band_overall, evaluation_json, created_at FROM speaking_submissions WHERE user_id = ? AND status = \'evaluated\' ORDER BY created_at ASC',
    [userId]
  );

  // Compute average criteria from evaluation JSONs
  const criteriaKeys = ['fluency_and_coherence', 'lexical_resource', 'grammatical_range_accuracy', 'pronunciation'];
  const sums = {};
  let count = 0;
  for (const row of history) {
    try {
      const parsed = typeof row.evaluation_json === 'string' ? JSON.parse(row.evaluation_json) : row.evaluation_json;
      if (parsed && parsed.criteria) {
        count++;
        for (const key of criteriaKeys) {
          if (parsed.criteria[key]) {
            sums[key] = (sums[key] || 0) + parsed.criteria[key].band;
          }
        }
      }
    } catch { /* skip malformed */ }
  }
  const avg_criteria = count > 0
    ? Object.fromEntries(criteriaKeys.map(k => [k, Math.round(((sums[k] || 0) / count) * 10) / 10]))
    : null;

  return {
    total_tests: Number(summary[0]?.total || 0),
    avg_band: summary[0]?.avg_band ? Number(summary[0].avg_band) : null,
    best_band: summary[0]?.best_band ? Number(summary[0].best_band) : null,
    history: history.map(h => ({ band_overall: h.band_overall, created_at: h.created_at })),
    avg_criteria,
  };
}

export async function deleteSubmission(submissionId, userId) {
  await pool.execute('DELETE FROM speaking_submissions WHERE id = ? AND user_id = ?', [submissionId, userId]);
}

