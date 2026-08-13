import { pool } from './src/config/db.js';

async function resetAutoIncrement() {
  try {
    await pool.execute('ALTER TABLE users AUTO_INCREMENT = 1');
    console.log('Successfully reset AUTO_INCREMENT for users table.');
  } catch (error) {
    console.error('Error resetting AUTO_INCREMENT:', error);
  } finally {
    process.exit(0);
  }
}

resetAutoIncrement();
