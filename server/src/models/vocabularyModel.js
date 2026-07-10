// SQL for the vocabulary module.
import { pool } from '../config/db.js';

export async function listWords(userId, { category, bookmarkedOnly, bandLevel }) {
  let sql = `
    SELECT v.id, v.word, v.meaning, v.synonyms, v.antonyms, v.example_sentence,
           v.pronunciation, v.category, v.band_level,
           COALESCE(uv.status, 'new') AS status,
           COALESCE(uv.bookmarked, 0) AS bookmarked
    FROM vocabulary v
    LEFT JOIN user_vocabulary uv ON uv.vocab_id = v.id AND uv.user_id = ?`;
  const params = [userId];
  const where = [];

  if (category) {
    where.push('v.category = ?');
    params.push(category);
  }
  if (bandLevel) {
    where.push('v.band_level = ?');
    params.push(String(bandLevel));
  }
  if (bookmarkedOnly) {
    where.push('uv.bookmarked = 1');
  }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY RAND()';

  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function listCategories() {
  const [rows] = await pool.execute(
    'SELECT category, COUNT(*) AS word_count FROM vocabulary GROUP BY category ORDER BY category'
  );
  return rows;
}

// INSERT ... ON DUPLICATE KEY UPDATE = "upsert": creates the user's row
// for this word the first time, updates it every time after.
export async function setStatus(userId, vocabId, status) {
  await pool.execute(
    `INSERT INTO user_vocabulary (user_id, vocab_id, status)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status)`,
    [userId, vocabId, status]
  );
}

export async function toggleBookmark(userId, vocabId) {
  await pool.execute(
    `INSERT INTO user_vocabulary (user_id, vocab_id, bookmarked)
     VALUES (?, ?, 1)
     ON DUPLICATE KEY UPDATE bookmarked = 1 - bookmarked`,
    [userId, vocabId]
  );
  const [rows] = await pool.execute(
    'SELECT bookmarked FROM user_vocabulary WHERE user_id = ? AND vocab_id = ?',
    [userId, vocabId]
  );
  return Boolean(rows[0]?.bookmarked);
}

export async function wordExists(vocabId) {
  const [rows] = await pool.execute('SELECT id FROM vocabulary WHERE id = ?', [vocabId]);
  return rows.length > 0;
}
