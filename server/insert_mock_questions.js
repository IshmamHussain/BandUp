import { pool } from './src/config/db.js';

async function seed() {
  const listeningTestId = 1;

  // Clear existing questions for this test
  await pool.execute('DELETE FROM questions WHERE listening_test_id = ?', [listeningTestId]);

  const questions = [
    // Part 1
    { text: 'Contact number:', type: 'fill_blank', options: null, answer: '0171' },
    { text: 'Send written quote by:', type: 'fill_blank', options: null, answer: 'email' },
    { text: 'Price for renting: $ ________ daily', type: 'fill_blank', options: null, answer: '60' },
    { text: 'Special requirements for the room: an extra ________', type: 'fill_blank', options: null, answer: 'bed' },
    { text: 'Most important facility:', type: 'fill_blank', options: null, answer: 'kitchen' },
    { text: 'Extra equipment: they should have a ________', type: 'fill_blank', options: null, answer: 'heater' },
    { text: 'As well as a ________', type: 'fill_blank', options: null, answer: 'microwave' },
    { text: 'Pick them up from the ________', type: 'fill_blank', options: null, answer: 'airport' },
    { text: 'The caravan driver’s age:', type: 'fill_blank', options: null, answer: '25' },
    { text: 'Country where licence will be registered:', type: 'fill_blank', options: null, answer: 'Australia' },
    
    // Part 2
    { text: 'Chocolate beans are ________ and then bags are shipped.', type: 'fill_blank', options: null, answer: 'dried' },
    { text: 'Bags are then ________ and weighed by machines.', type: 'fill_blank', options: null, answer: 'cleaned' },
    { text: 'Next chocolate beans are ________ in a hopper.', type: 'fill_blank', options: null, answer: 'mixed' },
    { text: 'Boiled chocolate beans are ________ and cracked.', type: 'fill_blank', options: null, answer: 'cooled' },
    { text: 'Roasted beans needs to be ________', type: 'fill_blank', options: null, answer: 'sorted' },
    { text: 'Roasted beans are ________ in the pocket.', type: 'fill_blank', options: null, answer: 'packed' },
    
    { text: 'First Crack', type: 'matching', options: JSON.stringify(['A: intense', 'B: mild', 'C: chocolaty', 'D: smoky']), answer: 'B: mild' },
    { text: 'Green Beans', type: 'matching', options: JSON.stringify(['A: intense', 'B: mild', 'C: chocolaty', 'D: smoky']), answer: 'C: chocolaty' },
    { text: 'French Roast', type: 'matching', options: JSON.stringify(['A: intense', 'B: mild', 'C: chocolaty', 'D: smoky']), answer: 'A: intense' },
    { text: 'Espresso Smoky', type: 'matching', options: JSON.stringify(['A: intense', 'B: mild', 'C: chocolaty', 'D: smoky']), answer: 'D: smoky' },
    
    // Part 3
    { text: 'What is the thing that makes the Moa similar to dinosaur?', type: 'mcq', options: JSON.stringify(['Both are of interest to the public.', 'Both are extinct at similar time.', 'Both left lots of fossil remains']), answer: 'Both left lots of fossil remains' },
    { text: 'What is the difference between Moa and other birds?', type: 'mcq', options: JSON.stringify(['no wing bones', 'a long tail', 'a smaller head']), answer: 'no wing bones' },
    { text: 'What’s the special feature of their chicks?', type: 'mcq', options: JSON.stringify(['They never return to the nests.', 'Most of them die within two months after birth.', 'They can find food by themselves.']), answer: 'They can find food by themselves.' },
    { text: 'What is the tutor’s opinion on male hatching the eggs?', type: 'mcq', options: JSON.stringify(['He doubts whether it is true or possible.', 'He thinks it may be true.', 'He can say with certainty that it is true.']), answer: 'He thinks it may be true.' },
    { text: 'What is the male student’s response after hearing some people see a Moa recently', type: 'mcq', options: JSON.stringify(['He is surprised.', 'He is worried.', 'He is amused.']), answer: 'He is amused.' },
    { text: 'Why did the Moa become extinct?', type: 'mcq', options: JSON.stringify(['climate change', 'human interference', 'competitions with other animals']), answer: 'human interference' },
    
    { text: 'the North Island Giant Moa', type: 'matching', options: JSON.stringify(['the much taller female', 'less fossils left', 'the biggest eggs', 'feeding at night', 'better vocal sound', 'poor eyesight']), answer: 'the much taller female' },
    { text: 'the Crested Moa', type: 'matching', options: JSON.stringify(['the much taller female', 'less fossils left', 'the biggest eggs', 'feeding at night', 'better vocal sound', 'poor eyesight']), answer: 'better vocal sound' },
    { text: 'the Stout-legged Moa', type: 'matching', options: JSON.stringify(['the much taller female', 'less fossils left', 'the biggest eggs', 'feeding at night', 'better vocal sound', 'poor eyesight']), answer: 'feeding at night' },
    { text: 'the Eastern Moa', type: 'matching', options: JSON.stringify(['the much taller female', 'less fossils left', 'the biggest eggs', 'feeding at night', 'better vocal sound', 'poor eyesight']), answer: 'poor eyesight' },
    
    // Part 4
    { text: 'The ________', type: 'fill_blank', options: null, answer: 'moon' },
    { text: 'Natural events, such as winds and rains, rivers flooding, plants flowering, and the ________ behaviour.', type: 'fill_blank', options: null, answer: 'birds' },
    { text: 'Precise measurements became important for organising activities for: ________', type: 'fill_blank', options: null, answer: 'farming' },
    { text: 'Precise measurements became important for organising activities for: ________ (2)', type: 'fill_blank', options: null, answer: 'religion' },
    { text: 'The oldest time keepers were discovered in Mesopotamia and ________.', type: 'fill_blank', options: null, answer: 'North Africa' },
    
    { text: 'The sundial: In different parts of the year, the time for day ________', type: 'fill_blank', options: null, answer: 'varied' },
    { text: 'The clepsydra: The changing pressure and ________ were what the flow of water still relied on.', type: 'fill_blank', options: null, answer: 'temperature' },
    { text: 'The ________', type: 'fill_blank', options: null, answer: 'sandglass' },
    { text: 'The time duration was ________', type: 'fill_blank', options: null, answer: 'limited' },
    { text: 'Fire candle clock: The burning ________ or the rate of burning, was subject to the candles wax.', type: 'fill_blank', options: null, answer: 'speed' }
  ];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    await pool.execute(
      'INSERT INTO questions (listening_test_id, module, question_type, question_text, options_json, correct_answer, explanation, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [listeningTestId, 'listening', q.type, q.text, q.options, q.answer, 'Extracted from mock test.', i + 1]
    );
  }

  // Also update the YouTube URL to a generic known-good IELTS listening test link, e.g., Cambridge 14 Test 1
  // We'll use a reliable YouTube ID: xQJ80N6vWzE (Cambridge IELTS 14 Test 1) or similarly popular one.
  await pool.execute("UPDATE listening_tests SET audio_url = 'https://www.youtube.com/embed/5F6mZ6h1N44', title = 'Official IELTS Listening Mock Test', transcript = 'Transcript available after test.' WHERE id = 1");

  console.log('Seed done!');
  process.exit(0);
}

seed().catch(console.error);
