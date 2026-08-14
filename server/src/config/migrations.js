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
