import { execSync } from 'child_process';
import { pool } from '../src/config/db.js';

async function runFixes() {
  console.log('Running automated production DB fixes...');

  try {
    // Run the JS scripts using execSync
    console.log('Running clean-mock-data.js...');
    execSync('node scripts/clean-mock-data.js', { stdio: 'inherit' });

    console.log('Running seed_writing_tests.js...');
    execSync('node seed_writing_tests.js', { stdio: 'inherit' });

    console.log('Running seed_speaking.js...');
    execSync('node seed_speaking.js', { stdio: 'inherit' });

    console.log('Updating Listening Test 3 to correct Crime audio/transcript...');
    const connection = pool;
    
    // We only update Test 3 and its questions. Test 2 remains intact so users don't lose attempts.
    await connection.execute(`
      UPDATE listening_tests 
      SET title = 'Crime', 
          transcript = 'Why do we have crime? When will it all stop? It\\'s sad that there is so much crime in our society. It hurts so many people. Most people in the world just want to live happily and be good neighbours. Why do some people turn to crime? Money is a big reason. Many criminals pickpocket, steal, kidnap, or even kill people to get money. There are many terrible crimes in the world. Perhaps the worst is ethnic cleansing. This is a crime against humanity. Many people are killed because of their colour or religion. People who commit this crime rarely go to prison. Have you ever been a victim of crime?' 
      WHERE id = 3
    `);

    // Delete old questions for test 3 to avoid duplicates and re-insert the correct ones
    await connection.execute('DELETE FROM questions WHERE listening_test_id = 3');
    
    await connection.query(`
      INSERT INTO questions (listening_test_id, module, question_type, question_text, options_json, correct_answer, explanation, position) VALUES
      (3, 'listening', 'fill_blank', 'It\\'s sad that there is so much crime in our ________.', NULL, 'society', 'The speaker says: "It\\'s sad that there is so much crime in our society."', 1),
      (3, 'listening', 'mcq', 'What do most people in the world want to be?', '["Rich", "Good neighbours", "Famous"]', 'Good neighbours', 'The speaker says: "Most people in the world just want to live happily and be good neighbours."', 2),
      (3, 'listening', 'fill_blank', 'Money is a big ________ why people turn to crime.', NULL, 'reason', 'The speaker states: "Why do some people turn to crime? Money is a big reason."', 3),
      (3, 'listening', 'mcq', 'What do criminals NOT do to get money, according to the transcript?', '["Pickpocket", "Kidnap", "Work hard"]', 'Work hard', 'The speaker lists: "pickpocket, steal, kidnap, or even kill people to get money."', 4),
      (3, 'listening', 'mcq', 'What does the speaker consider perhaps the worst crime?', '["Kidnapping", "Stealing", "Ethnic cleansing"]', 'Ethnic cleansing', 'The speaker says: "Perhaps the worst is ethnic cleansing."', 5)
    `);

    console.log('Production fixes applied successfully.');
  } catch (err) {
    console.error('Error running production fixes:', err.message);
  }
}

runFixes().then(() => process.exit(0)).catch(() => process.exit(1));
