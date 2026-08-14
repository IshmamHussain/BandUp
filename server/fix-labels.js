// Run this to fix labels in the live database
// Usage: node server/fix-labels.js
import { pool } from './src/config/db.js';

async function fixLabels() {
  console.log('Fixing labels in database...\n');

  // ============ LISTENING TESTS ============

  // Fix Cookery Classes: wrong audio + Cambridge label
  const [r1] = await pool.execute(
    `UPDATE listening_tests SET title = 'Cookery Classes', audio_url = 'https://listenaminute.com/c/cooking.mp3' WHERE title LIKE '%Cookery Classes%'`
  );
  console.log(`Cookery Classes: ${r1.affectedRows} row(s) updated`);

  // Fix Crime Report Form
  const [r2] = await pool.execute(
    `UPDATE listening_tests SET title = 'Crime Report Form' WHERE title LIKE '%Crime Report Form%' AND title != 'Crime Report Form'`
  );
  console.log(`Crime Report Form: ${r2.affectedRows} row(s) updated`);

  // Fix any Cambridge IELTS prefixed listening tests
  const [r3] = await pool.execute(
    `UPDATE listening_tests SET title = REPLACE(REPLACE(REPLACE(title, 'Cambridge IELTS 14 - ', ''), 'Cambridge IELTS 13 - ', ''), 'Cambridge IELTS 9 - ', '') WHERE title LIKE 'Cambridge IELTS%'`
  );
  console.log(`Other Cambridge listening: ${r3.affectedRows} row(s) updated`);

  // ============ WRITING PROMPTS ============

  const [r4] = await pool.execute(
    `UPDATE writing_prompts SET category = REPLACE(category, 'Cambridge Academic', 'Academic') WHERE category LIKE 'Cambridge Academic%'`
  );
  console.log(`Writing prompts: ${r4.affectedRows} row(s) updated`);

  // ============ VERIFY ============
  console.log('\n--- Verification ---');
  
  const [listening] = await pool.execute('SELECT id, title FROM listening_tests');
  console.log('\nListening tests:');
  listening.forEach(t => console.log(`  [${t.id}] ${t.title}`));

  const [writing] = await pool.execute('SELECT DISTINCT category FROM writing_prompts ORDER BY category');
  console.log('\nWriting categories:');
  writing.forEach(w => console.log(`  ${w.category}`));

  process.exit(0);
}

fixLabels().catch(err => { console.error(err); process.exit(1); });
