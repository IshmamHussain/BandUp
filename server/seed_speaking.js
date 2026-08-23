import mysql from 'mysql2/promise';
import { env } from './src/config/env.js';

async function seed() {
  try {
    console.log("Connecting to database...");
    const conn = await mysql.createConnection({
      host: env.db.host,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
      port: env.db.port
    });

    console.log("Cleaning up old tests and setting up new schema...");
    await conn.query('SET FOREIGN_KEY_CHECKS = 0;');
    await conn.query('DROP TABLE IF EXISTS speaking_prompts;'); // Drop the old table just in case
    
    await conn.query(`
      CREATE TABLE IF NOT EXISTS speaking_tests (
        id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        title        VARCHAR(200) NOT NULL,
        category     VARCHAR(80) NULL,
        part1_prompt TEXT NOT NULL,
        part2_prompt TEXT NOT NULL,
        part3_prompt TEXT NOT NULL,
        created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
    await conn.query('TRUNCATE TABLE speaking_tests;');
    
    // Attempt to alter speaking_submissions if it still has prompt_id
    try {
        await conn.query('ALTER TABLE speaking_submissions DROP FOREIGN KEY fk_ss_prompt');
        await conn.query('ALTER TABLE speaking_submissions CHANGE prompt_id test_id INT UNSIGNED NULL');
        await conn.query('ALTER TABLE speaking_submissions ADD CONSTRAINT fk_ss_test FOREIGN KEY (test_id) REFERENCES speaking_tests(id) ON DELETE SET NULL');
    } catch (e) {
        // Ignore if column is already renamed
    }
    
    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log("Inserting speaking tests...");
    await conn.query(`
      INSERT INTO speaking_tests (title, category, part1_prompt, part2_prompt, part3_prompt) VALUES 
      (
        'Hometown & People', 
        'Hometown',
        'Let''s talk about your hometown. Where is your hometown?\\nWhat do you like most about your hometown?\\nIs your hometown a good place for young people to live?',
        'Describe a person who has had a significant influence on your life.\\n\\nYou should say:\\n- Who this person is\\n- How you met them\\n- What they have done for you\\n\\nAnd explain why they have had such a strong influence on you.',
        'How do you think relationships between family members have changed in recent years?\\nIn what ways do role models influence younger generations?'
      ),
      (
        'Studies, Work & History', 
        'Work/Study',
        'Let''s talk about your studies or work. Do you work or are you a student?\\nWhat do you study (or what is your job), and why did you choose that?\\nIs it a popular subject or job in your country?',
        'Describe an important historical event in your country.\\n\\nYou should say:\\n- What the event was\\n- When it happened\\n- Who was involved\\n\\nAnd explain why this event is important to your country''s history.',
        'Do you think it is important for children to learn history in school? Why or why not?\\nHow has technology changed the way we preserve historical artifacts?'
      ),
      (
        'Hobbies & Achievement', 
        'Hobbies',
        'Let''s talk about hobbies. What do you usually do in your free time?\\nDid you have the same hobbies when you were a child?\\nDo you prefer spending your free time alone or with others?',
        'Describe a challenging goal you achieved.\\n\\nYou should say:\\n- What the goal was\\n- Why it was challenging\\n- What you did to achieve it\\n\\nAnd explain how you felt after you achieved it.',
        'What are the main qualities a person needs to achieve success in their career?\\nDo you think society puts too much pressure on young people to succeed?'
      ),
      (
        'Weather & Technology', 
        'Technology',
        'Let''s talk about weather. What kind of weather do you like most?\\nHow does the weather affect your mood?\\nDoes your country experience extreme weather conditions?',
        'Describe a piece of technology (not a computer or phone) that you find very useful.\\n\\nYou should say:\\n- What it is\\n- What you use it for\\n- How often you use it\\n\\nAnd explain why you find it so useful.',
        'In what ways is artificial intelligence likely to change the workplace in the future?\\nAre people becoming too dependent on technology in their daily lives?'
      ),
      (
        'Travel & Culture', 
        'Travel',
        'Let''s talk about travel. Do you like travelling?\\nWhich country would you like to visit in the future?\\nWhat is the longest journey you have ever been on?',
        'Describe an interesting place in your country that not many tourists visit.\\n\\nYou should say:\\n- Where it is\\n- Why it is interesting\\n- How you know about it\\n\\nAnd explain why you think more people should visit it.',
        'How has the tourism industry changed your country over the last decade?\\nWhat are the environmental impacts of global tourism?'
      )
    `);
    
    console.log("Done");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seed();
