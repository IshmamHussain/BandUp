import { pool } from '../src/config/db.js';

async function cleanMockData() {
  console.log('Connecting to database for cleanup...');
  const connection = pool;

  try {
    // 1. Delete writing prompts with category 'Test i'
    console.log('Cleaning up writing prompts with "Test %" category...');
    const [writingResult] = await connection.execute(
      `DELETE FROM writing_prompts WHERE category LIKE 'Test %'`
    );
    console.log(`Deleted ${writingResult.affectedRows} writing prompts.`);

    // 2. Delete the low-quality 2-question reading tests
    console.log('Cleaning up 2-question reading tests...');
    const [readingResult] = await connection.execute(
      `DELETE FROM reading_tests WHERE title LIKE 'Reading Test %'`
    );
    console.log(`Deleted ${readingResult.affectedRows} reading tests.`);

    // 3. Delete the low-quality 2-question listening tests
    console.log('Cleaning up 2-question listening tests...');
    const [listeningResult] = await connection.execute(
      `DELETE FROM listening_tests WHERE title LIKE 'Listening Test %'`
    );
    console.log(`Deleted ${listeningResult.affectedRows} listening tests.`);

    console.log('Cleanup complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error cleaning mock data:', err);
    process.exit(1);
  }
}

cleanMockData();
