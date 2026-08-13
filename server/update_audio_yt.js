import { pool } from './src/config/db.js';
async function update() {
  await pool.execute("UPDATE listening_tests SET audio_url = 'https://www.youtube.com/embed/a73YJ1fVbS4' WHERE id = 1");
  console.log('Updated to YouTube URL');
  process.exit(0);
}
update().catch(console.error);
