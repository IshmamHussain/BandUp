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

    // 2. Delete duplicate reading tests (keep only Reading Test 1 and 2 if they are unique, or delete those with title > 2)
    console.log('Cleaning up duplicate reading tests...');
    const [readingResult] = await connection.execute(
      `DELETE FROM reading_tests WHERE title LIKE 'Reading Test %' AND id NOT IN (
         SELECT MIN(id) FROM (SELECT * FROM reading_tests) as rt WHERE title LIKE 'Reading Test %' GROUP BY title
       )`
    );
    console.log(`Deleted ${readingResult.affectedRows} duplicate reading tests.`);

    // 3. Delete duplicate listening tests
    console.log('Cleaning up duplicate listening tests...');
    const [listeningResult] = await connection.execute(
      `DELETE FROM listening_tests WHERE title LIKE 'Listening Test %' AND id NOT IN (
         SELECT MIN(id) FROM (SELECT * FROM listening_tests) as lt WHERE title LIKE 'Listening Test %' GROUP BY title
       )`
    );
    console.log(`Deleted ${listeningResult.affectedRows} duplicate listening tests.`);

    console.log('Cleanup complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error cleaning mock data:', err);
    process.exit(1);
  }
}

cleanMockData();
