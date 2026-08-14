// Lightweight auto-migrations that run on server startup.
// Each migration runs only once — tracked by a simple migrations table.
import { pool } from './db.js';

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
        ['mcq', "What does the speaker say is a very difficult question?", '["What is the healthiest food?", "What is the tastiest food in the world?", "What is the cheapest food?"]', 'What is the tastiest food in the world?', 'The speaker says: "What\\'s the tastiest food in the world? This is a very difficult question to answer."'],
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
  }
];

export async function runMigrations() {
  // Ensure migrations table exists
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id VARCHAR(100) PRIMARY KEY,
      description VARCHAR(255),
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [applied] = await pool.execute('SELECT id FROM _migrations');
  const appliedIds = new Set(applied.map(r => r.id));

  for (const migration of MIGRATIONS) {
    if (appliedIds.has(migration.id)) continue;

    console.log(`Running migration: ${migration.id} — ${migration.description}`);
    try {
      await migration.run(pool);
      await pool.execute(
        'INSERT INTO _migrations (id, description) VALUES (?, ?)',
        [migration.id, migration.description]
      );
      console.log(`  ✓ Migration ${migration.id} applied.`);
    } catch (err) {
      console.error(`  ✗ Migration ${migration.id} failed:`, err.message);
      // Don't block server startup for a label fix
    }
  }
}
