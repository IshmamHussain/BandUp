import { pool } from './src/config/db.js';

async function clearUsers() {
  try {
    // Delete all users except the admin
    const [result] = await pool.execute("DELETE FROM users WHERE role = 'student'");
    console.log(`Successfully deleted ${result.affectedRows} student users.`);
  } catch (error) {
    console.error('Error clearing users:', error);
  } finally {
    process.exit(0);
  }
}

clearUsers();
