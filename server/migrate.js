import { pool } from './src/config/db.js';
async function migrate() {
  await pool.execute(`CREATE TABLE IF NOT EXISTS reading_tests (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    difficulty ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
    time_limit SMALLINT UNSIGNED NOT NULL DEFAULT 60,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;`);
  
  try {
    await pool.execute('ALTER TABLE reading_passages ADD COLUMN test_id INT UNSIGNED NULL');
    await pool.execute('ALTER TABLE reading_passages ADD COLUMN position SMALLINT UNSIGNED NOT NULL DEFAULT 1');
    await pool.execute('ALTER TABLE reading_passages ADD CONSTRAINT fk_passages_test FOREIGN KEY (test_id) REFERENCES reading_tests(id) ON DELETE CASCADE');
  } catch(e) { console.log(e.message); }
  
  console.log('Migration done');
  process.exit(0);
}
migrate().catch(console.error);
