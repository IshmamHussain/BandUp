import { pool } from './src/config/db.js';

async function seed() {
  // 1. Delete the nonsense Cambridge 9 test and its questions
  await pool.execute('DELETE FROM listening_tests WHERE id = 3 OR title = "Cambridge IELTS 9 - Listening Test 1"');

  // 2. Insert Test 2
  const [res2] = await pool.execute(
    'INSERT INTO listening_tests (title, audio_url, transcript, difficulty, time_limit) VALUES (?, ?, ?, ?, ?)',
    ['Cambridge IELTS 14 - Listening Test 2', 'https://ielts-up.com/listening/14.2.mp3', 'Transcript for Test 2...', 'medium', 30]
  );
  const test2Id = res2.insertId;

  // Insert 40 generic questions for Test 2 so it is playable
  for (let i = 1; i <= 40; i++) {
    await pool.execute(
      'INSERT INTO questions (listening_test_id, module, question_type, question_text, options_json, correct_answer, explanation, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [test2Id, 'listening', 'fill_blank', `Test 2 - Question ${i}`, null, 'answer', 'Explanation', i]
    );
  }

  // 3. Insert Test 3
  const [res3] = await pool.execute(
    'INSERT INTO listening_tests (title, audio_url, transcript, difficulty, time_limit) VALUES (?, ?, ?, ?, ?)',
    ['Cambridge IELTS 14 - Listening Test 3', 'https://ielts-up.com/listening/14.3.mp3', 'Transcript for Test 3...', 'medium', 30]
  );
  const test3Id = res3.insertId;

  // Insert 40 generic questions for Test 3 so it is playable
  for (let i = 1; i <= 40; i++) {
    await pool.execute(
      'INSERT INTO questions (listening_test_id, module, question_type, question_text, options_json, correct_answer, explanation, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [test3Id, 'listening', 'fill_blank', `Test 3 - Question ${i}`, null, 'answer', 'Explanation', i]
    );
  }

  console.log('Deleted old test and inserted 2 new listening tests with actual audio.');
  process.exit(0);
}

seed().catch(console.error);
