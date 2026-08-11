import { pool } from './src/config/db.js';
async function update() {
  await pool.execute("UPDATE listening_tests SET audio_url = '/media/audio/listening_sample_1.mp3', title = 'Official IELTS Listening Sample', time_limit = 30 WHERE id = 1");
  console.log('Updated DB');
  process.exit(0);
}
update().catch(console.error);
