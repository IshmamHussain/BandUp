// Database migrations: explicit, ordered, run-once schema and data changes.
//
// - Each migration has a unique id and is recorded in the _migrations table
//   after it succeeds, so it never runs twice.
// - They run in array order, on one dedicated connection, under a MySQL
//   named lock so two processes (e.g. a deploy and `npm run migrate`) can't
//   apply the same migration at once.
// - The first failure stops the run: later migrations may depend on it.
// - Write every migration so it is safe to re-run if it fails half-way
//   (IF NOT EXISTS, "insert only if missing", guarded ALTERs). MySQL commits
//   DDL implicitly, so a transaction cannot roll a migration back.
//
// They run automatically at server startup and can be run by hand with
// `npm run migrate` (exits non-zero on failure).
import fs from 'node:fs';
import { pool } from './db.js';
import { normalizeQuestion } from '../utils/questions.js';
import { calculateIeltsBand } from '../utils/helpers.js';
import { recalculateBandEstimate } from '../models/userModel.js';

const CORE_CONTENT = JSON.parse(
  fs.readFileSync(new URL('../content/core-content.json', import.meta.url), 'utf8')
);

const MIGRATIONS = [
  {
    id: 'fix_labels_2024_08',
    description: 'Remove Cambridge branding from listening/writing labels, fix Cookery Classes audio',
    async run(connection) {
      // Fix Cookery Classes: wrong audio URL (coffee.mp3 → cooking.mp3) + label
      await connection.execute(
        `UPDATE listening_tests SET title = 'Cookery Classes', audio_url = 'https://listenaminute.com/c/cooking.mp3' WHERE title LIKE '%Cookery Classes%'`
      );
      // Fix Crime Report Form label
      await connection.execute(
        `UPDATE listening_tests SET title = 'Crime Report Form' WHERE title LIKE '%Crime Report Form%' AND title != 'Crime Report Form'`
      );
      // Fix any other Cambridge IELTS prefixed listening tests
      await connection.execute(
        `UPDATE listening_tests SET title = REPLACE(REPLACE(REPLACE(title, 'Cambridge IELTS 14 - ', ''), 'Cambridge IELTS 13 - ', ''), 'Cambridge IELTS 9 - ', '') WHERE title LIKE 'Cambridge IELTS%'`
      );
      // Remove "Cambridge " prefix from writing categories
      await connection.execute(
        `UPDATE writing_prompts SET category = REPLACE(category, 'Cambridge Academic', 'Academic') WHERE category LIKE 'Cambridge Academic%'`
      );
    }
  },
  {
    id: 'fix_labels_v2_2024_08',
    description: 'Rename Advertising title, fix Cookery Classes audio to food.mp3',
    async run(connection) {
      // Rename "Actual Spoken English: Advertising" → "Advertising"
      await connection.execute(
        `UPDATE listening_tests SET title = 'Advertising' WHERE title LIKE '%Advertising%'`
      );
      // cooking.mp3 doesn't exist on ListenAMinute — use food.mp3 instead
      await connection.execute(
        `UPDATE listening_tests SET audio_url = 'https://listenaminute.com/f/food.mp3' WHERE title LIKE '%Cookery%'`
      );
    }
  },
  {
    id: 'replace_cookery_with_food_2024_08',
    description: 'Replace Cookery Classes test with Food test (matching audio + questions)',
    async run(connection) {
      const transcript = "Isn't food one of life's greatest pleasures? Do you know anyone who doesn't like food? I don't. There is so much delicious food in the world. You could spend a whole lifetime eating a different dish every day. What's the tastiest food in the world? This is a very difficult question to answer. My taste in food keeps changing. Sometimes my favourite is a dessert, but then I change my mind and go for a spicy curry. It's great that countries have so many different dishes. Do you think your national dish is best? Nowadays we have to be careful about what we eat. Fast food is not good for us. We need to focus more on healthy food. Maybe we have to be more careful in the future. Make sure the food you eat is good for you.";

      // Find the Cookery Classes test ID
      const [rows] = await connection.execute(
        `SELECT id FROM listening_tests WHERE title LIKE '%Cookery%' OR title LIKE '%Food%' LIMIT 1`
      );
      if (rows.length === 0) return;
      const testId = rows[0].id;

      // Update the test itself
      await connection.execute(
        `UPDATE listening_tests SET title = 'Food', transcript = ?, audio_url = 'https://listenaminute.com/f/food.mp3' WHERE id = ?`,
        [transcript, testId]
      );

      // Delete old questions
      await connection.execute(
        `DELETE FROM questions WHERE listening_test_id = ?`,
        [testId]
      );

      // Insert new questions matching the food.mp3 audio
      const questions = [
        ['fill_blank', "Food is described as one of life's greatest ________.", null, 'pleasures', "The speaker says: \"Isn't food one of life's greatest pleasures?\""],
        ['mcq', 'How much delicious food does the speaker say exists?', '["Not much", "So much", "Just enough"]', 'So much', 'The speaker says: "There is so much delicious food in the world."'],
        ['fill_blank', 'You could spend a whole ________ eating a different dish every day.', null, 'lifetime', 'The speaker says: "You could spend a whole lifetime eating a different dish every day."'],
        ['mcq', 'What does the speaker sometimes go for after changing their mind from dessert?', '["A salad", "A spicy curry", "A pizza"]', 'A spicy curry', 'The speaker says: "...then I change my mind and go for a spicy curry."'],
        ['fill_blank', 'The speaker says their taste in food keeps ________.', null, 'changing', 'The speaker says: "My taste in food keeps changing."'],
        ['mcq', 'According to the speaker, what is NOT good for us?', '["Healthy food", "Fast food", "Home cooking"]', 'Fast food', 'The speaker says: "Fast food is not good for us."'],
        ['fill_blank', 'We need to focus more on ________ food.', null, 'healthy', 'The speaker says: "We need to focus more on healthy food."'],
        ['mcq', "What does the speaker say is a very difficult question?", '["What is the healthiest food?", "What is the tastiest food in the world?", "What is the cheapest food?"]', 'What is the tastiest food in the world?', "The speaker says: \"What's the tastiest food in the world? This is a very difficult question to answer.\""],
        ['fill_blank', "It's great that countries have so many different ________.", null, 'dishes', "The speaker says: \"It's great that countries have so many different dishes.\""],
        ['fill_blank', 'Make sure the food you eat is good for ________.', null, 'you', 'The speaker says: "Make sure the food you eat is good for you."']
      ];

      for (let i = 0; i < questions.length; i++) {
        const [qType, qText, opts, answer, explanation] = questions[i];
        await connection.execute(
          'INSERT INTO questions (listening_test_id, module, question_type, question_text, options_json, correct_answer, explanation, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [testId, 'listening', qType, qText, opts, answer, explanation, i + 1]
        );
      }
    }
  },
  {
    id: 'supabase_auth_integration',
    description: 'Add supabase_id to users, make password_hash nullable, drop email_verification_tokens',
    async run(connection) {
      // Add supabase_id column if it doesn't exist
      try {
        await connection.execute(`ALTER TABLE users ADD COLUMN supabase_id VARCHAR(36) UNIQUE DEFAULT NULL`);
      } catch (err) {
        // Ignore if column already exists (Error 1060: Duplicate column name)
        if (err.errno !== 1060) throw err;
      }

      // Make password_hash nullable since Supabase stores the real password
      await connection.execute(`ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL`);

      // Drop the old email verification tokens table
      await connection.execute(`DROP TABLE IF EXISTS email_verification_tokens`);
    }
  },
  {
    id: 'cleanup_legacy_students',
    description: 'Delete student accounts that pre-date Supabase Auth so they can re-register',
    async run(connection) {
      await connection.execute(`DELETE FROM users WHERE role = 'student' AND supabase_id IS NULL`);
    }
  },
  {
    id: 'harden_admin_auth_2026_11',
    description: 'Remove seeded/legacy admin, purge local password hashes, add token_version for session revocation',
    async run(connection) {
      // token_version: every JWT carries it; bumping it revokes sessions.
      try {
        await connection.execute(`ALTER TABLE users ADD COLUMN token_version INT UNSIGNED NOT NULL DEFAULT 0`);
      } catch (err) {
        if (err.errno !== 1060) throw err; // column already exists
      }

      // The seeded admin (admin@bandup.com) and any other admin that was
      // never linked to Supabase could only log in through the removed
      // bcrypt bypass. Its password and hash are public in Git history, so
      // delete it outright. Real admins are re-created via Supabase and
      // promoted with `npm run admin -- promote <email>`.
      await connection.execute(`DELETE FROM users WHERE role = 'admin' AND supabase_id IS NULL`);

      // Supabase stores every password now; no local hash should remain.
      await connection.execute(`UPDATE users SET password_hash = NULL WHERE password_hash IS NOT NULL`);

      // Revoke every session issued before this fix (they also lack the
      // "tv" claim, so requireAuth would reject them anyway).
      await connection.execute(`UPDATE users SET token_version = token_version + 1`);
    }
  },
  {
    id: 'add_speaking_to_daily_progress',
    description: 'Add speaking module to daily_progress enum',
    async run(connection) {
      await connection.execute(`ALTER TABLE daily_progress MODIFY COLUMN module ENUM('reading','listening','writing','vocabulary','grammar','speaking') NOT NULL`);
    }
  },
  {
    id: 'core_content_once_2026_11',
    description: 'Replace run-prod-fixes.js: remove mock leftovers once and add any missing core writing/speaking content (never deletes real content)',
    async run(connection) {
      // One-time version of scripts/clean-mock-data.js (low-quality generated tests).
      await connection.execute(`DELETE FROM writing_prompts WHERE category LIKE 'Test %'`);
      await connection.execute(`DELETE FROM reading_tests WHERE title LIKE 'Reading Test %'`);
      await connection.execute(`DELETE FROM listening_tests WHERE title LIKE 'Listening Test %'`);

      // Previously seed_writing_tests.js deleted ALL prompts and re-inserted
      // them on every start, unlinking every essay from its prompt. Now each
      // prompt is inserted only if it is missing, so existing ids stay put.
      for (const p of CORE_CONTENT.writingPrompts) {
        await connection.execute(
          `INSERT INTO writing_prompts (category, task_type, prompt_text, chart_data)
           SELECT ?, ?, ?, ? FROM DUAL
           WHERE NOT EXISTS (SELECT 1 FROM writing_prompts WHERE category = ? AND task_type = ?)`,
          [p.category, p.taskType, p.promptText, p.chartData ? JSON.stringify(p.chartData) : null, p.category, p.taskType]
        );
      }

      // Previously seed_speaking.js truncated speaking_tests with foreign-key
      // checks off. Now: insert a test only if its title is missing.
      for (const t of CORE_CONTENT.speakingTests) {
        await connection.execute(
          `INSERT INTO speaking_tests (title, category, part1_prompt, part2_prompt, part3_prompt)
           SELECT ?, ?, ?, ?, ? FROM DUAL
           WHERE NOT EXISTS (SELECT 1 FROM speaking_tests WHERE title = ?)`,
          [t.title, t.category, t.part1, t.part2, t.part3, t.title]
        );
      }
      // Listening test 3 ("Crime") already ships correctly in
      // database/seeds/listening-cambridge.sql, so its per-start
      // delete-and-reinsert (which wiped students' attempts) is simply gone.
    }
  },
  {
    id: 'failed_evaluation_status_2026_11',
    description: "Add 'failed' submission status (B6/B7) and mark past failed evaluations",
    async run(connection) {
      await connection.execute(
        `ALTER TABLE writing_submissions MODIFY COLUMN status ENUM('draft','submitted','evaluated','failed') NOT NULL DEFAULT 'draft'`
      );
      await connection.execute(
        `ALTER TABLE speaking_submissions MODIFY COLUMN status ENUM('draft','submitted','evaluated','failed') NOT NULL DEFAULT 'draft'`
      );
      // Speaking failures used to be stored as 'evaluated' with no band.
      await connection.execute(
        `UPDATE speaking_submissions SET status = 'failed' WHERE status = 'evaluated' AND band_overall IS NULL`
      );
      // Writing failures were left 'submitted' forever (the request is
      // synchronous, so anything older than a few minutes has failed).
      await connection.execute(
        `UPDATE writing_submissions SET status = 'failed'
         WHERE status = 'submitted' AND band_overall IS NULL AND created_at < NOW() - INTERVAL 10 MINUTE`
      );
      await connection.execute(
        `UPDATE speaking_submissions SET status = 'failed'
         WHERE status = 'submitted' AND band_overall IS NULL AND created_at < NOW() - INTERVAL 30 MINUTE`
      );
    }
  },
  {
    id: 'normalize_mcq_answers_2026_11',
    description: 'B4: strip "A)" labels from MCQ options and turn letter answers into the option text',
    async run(connection) {
      const [rows] = await connection.query(
        "SELECT id, question_type, options_json, correct_answer FROM questions WHERE question_type = 'mcq'"
      );
      for (const q of rows) {
        const { optionsJson, correctAnswer } = normalizeQuestion({
          questionType: q.question_type, optionsJson: q.options_json, correctAnswer: q.correct_answer,
        });
        const before = JSON.stringify([q.options_json == null ? null : (typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json), q.correct_answer]);
        const after = JSON.stringify([optionsJson, correctAnswer]);
        if (before !== after) {
          await connection.execute(
            'UPDATE questions SET options_json = ?, correct_answer = ? WHERE id = ?',
            [optionsJson ? JSON.stringify(optionsJson) : null, correctAnswer, q.id]
          );
        }
      }
    }
  },
  {
    id: 'band_estimate_aggregation_2026_11',
    description: 'B3: per-test results table, backfilled from attempts; recompute every estimate as an aggregate',
    async run(connection) {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS test_results (
          id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id    INT UNSIGNED NOT NULL,
          module     ENUM('reading','listening') NOT NULL,
          test_id    INT UNSIGNED NOT NULL,
          correct    SMALLINT UNSIGNED NOT NULL,
          total      SMALLINT UNSIGNED NOT NULL,
          band       DECIMAL(2,1) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_tr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_tr_user_module (user_id, module, created_at)
        ) ENGINE=InnoDB
      `);

      // A submission writes all its attempts in one INSERT, so they share a
      // created_at: grouping by (user, test, created_at) recovers each test.
      const [past] = await connection.query(`
        SELECT a.user_id, 'reading' AS module, rp.test_id, a.created_at,
               COUNT(*) AS total, SUM(a.is_correct) AS correct
        FROM attempts a
        JOIN questions q ON q.id = a.question_id
        JOIN reading_passages rp ON rp.id = q.passage_id
        WHERE rp.test_id IS NOT NULL
        GROUP BY a.user_id, rp.test_id, a.created_at
        UNION ALL
        SELECT a.user_id, 'listening' AS module, q.listening_test_id, a.created_at,
               COUNT(*) AS total, SUM(a.is_correct) AS correct
        FROM attempts a
        JOIN questions q ON q.id = a.question_id
        WHERE q.listening_test_id IS NOT NULL
        GROUP BY a.user_id, q.listening_test_id, a.created_at
      `);
      for (const r of past) {
        const total = Number(r.total);
        const correct = Number(r.correct);
        await connection.execute(
          `INSERT INTO test_results (user_id, module, test_id, correct, total, band, created_at)
           SELECT ?, ?, ?, ?, ?, ?, ? FROM DUAL
           WHERE NOT EXISTS (SELECT 1 FROM test_results
                             WHERE user_id = ? AND module = ? AND test_id = ? AND created_at = ?)`,
          [r.user_id, r.module, r.test_id, correct, total, calculateIeltsBand(correct, total), r.created_at,
           r.user_id, r.module, r.test_id, r.created_at]
        );
      }

      // Replace every "latest single result" estimate with the aggregate.
      const [users] = await connection.query('SELECT user_id FROM profiles');
      for (const { user_id: userId } of users) {
        await recalculateBandEstimate(userId, connection);
      }
    }
  }
];

export const MIGRATION_IDS = MIGRATIONS.map((m) => m.id);

/**
 * Apply every pending migration in order.
 * @returns {Promise<{ applied: string[], failed: string | null, error?: Error }>}
 */
export async function runMigrations({ log = console } = {}) {
  const connection = await pool.getConnection();
  const applied = [];
  try {
    const [[{ locked }]] = await connection.query("SELECT GET_LOCK('bandup_migrations', 60) AS locked");
    if (locked !== 1) throw new Error('Timed out waiting for the migration lock.');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id VARCHAR(100) PRIMARY KEY,
        description VARCHAR(255),
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const [rows] = await connection.execute('SELECT id FROM _migrations');
    const done = new Set(rows.map((r) => r.id));

    for (const migration of MIGRATIONS) {
      if (done.has(migration.id)) continue;
      log.log(`Running migration: ${migration.id} — ${migration.description}`);
      try {
        await migration.run(connection);
        await connection.execute(
          'INSERT INTO _migrations (id, description) VALUES (?, ?)',
          [migration.id, migration.description.slice(0, 255)]
        );
        applied.push(migration.id);
        log.log(`  ✓ ${migration.id} applied.`);
      } catch (err) {
        log.error(`  ✗ Migration ${migration.id} failed: ${err.message}`);
        log.error('  Stopping: later migrations may depend on this one. Fix it and run `npm run migrate`.');
        return { applied, failed: migration.id, error: err };
      }
    }
    return { applied, failed: null };
  } finally {
    await connection.query("SELECT RELEASE_LOCK('bandup_migrations')").catch(() => {});
    connection.release();
  }
}
