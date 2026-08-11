import { pool } from './src/config/db.js';

async function run() {
  try {
    await pool.execute('ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE;');
    console.log('Added is_verified to users');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('is_verified already exists');
    } else {
      console.error(e);
    }
  }

  try {
    await pool.execute(`CREATE TABLE email_verification_tokens (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id    INT UNSIGNED NOT NULL,
      token      VARCHAR(255) NOT NULL UNIQUE,
      expires_at TIMESTAMP    NOT NULL,
      created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`);
    console.log('Created email_verification_tokens table');
  } catch (e) {
    if (e.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('email_verification_tokens already exists');
    } else {
      console.error(e);
    }
  }

  process.exit(0);
}

run();
