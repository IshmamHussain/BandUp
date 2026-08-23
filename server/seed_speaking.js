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

    console.log("Cleaning up old prompts...");
    await conn.query('SET FOREIGN_KEY_CHECKS = 0;');
    await conn.query('TRUNCATE TABLE speaking_prompts;');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log("Inserting speaking prompts...");
    await conn.query(`
      INSERT INTO speaking_prompts (part, prompt_text, category) VALUES 
      -- Part 1
      ('part1', 'Let''s talk about your hometown. Where is your hometown?', 'Hometown'),
      ('part1', 'What do you like most about your hometown?', 'Hometown'),
      ('part1', 'Is your hometown a good place for young people to live?', 'Hometown'),
      ('part1', 'Let''s talk about your studies or work. Do you work or are you a student?', 'Work/Study'),
      ('part1', 'What do you study, and why did you choose that subject?', 'Work/Study'),
      ('part1', 'Let''s talk about hobbies. What do you usually do in your free time?', 'Hobbies'),
      ('part1', 'Did you have the same hobbies when you were a child?', 'Hobbies'),
      ('part1', 'Let''s talk about weather. What kind of weather do you like most?', 'Weather'),
      ('part1', 'How does the weather affect your mood?', 'Weather'),
      ('part1', 'Let''s talk about travel. Do you like travelling?', 'Travel'),
      ('part1', 'Which country would you like to visit in the future?', 'Travel'),

      -- Part 2
      ('part2', 'Describe a person who has had a significant influence on your life.\\nYou should say:\\n- Who this person is\\n- How you met them\\n- What they have done for you\\nAnd explain why they have had such a strong influence on you.', 'People'),
      ('part2', 'Describe an important historical event in your country.\\nYou should say:\\n- What the event was\\n- When it happened\\n- Who was involved\\nAnd explain why this event is important to your country''s history.', 'History'),
      ('part2', 'Describe a challenging goal you achieved.\\nYou should say:\\n- What the goal was\\n- Why it was challenging\\n- What you did to achieve it\\nAnd explain how you felt after you achieved it.', 'Achievement'),
      ('part2', 'Describe a piece of technology (not a computer or phone) that you find very useful.\\nYou should say:\\n- What it is\\n- What you use it for\\n- How often you use it\\nAnd explain why you find it so useful.', 'Technology'),
      ('part2', 'Describe an interesting place in your country that not many tourists visit.\\nYou should say:\\n- Where it is\\n- Why it is interesting\\n- How you know about it\\nAnd explain why you think more people should visit it.', 'Travel'),

      -- Part 3
      ('part3', 'How do you think relationships between family members have changed in recent years?', 'People'),
      ('part3', 'In what ways do role models influence younger generations?', 'People'),
      ('part3', 'Do you think it is important for children to learn history in school? Why or why not?', 'History'),
      ('part3', 'How has technology changed the way we preserve historical artifacts?', 'History'),
      ('part3', 'What are the main qualities a person needs to achieve success in their career?', 'Achievement'),
      ('part3', 'Do you think society puts too much pressure on young people to succeed?', 'Achievement'),
      ('part3', 'In what ways is artificial intelligence likely to change the workplace in the future?', 'Technology'),
      ('part3', 'Are people becoming too dependent on technology in their daily lives?', 'Technology'),
      ('part3', 'How has the tourism industry changed your country over the last decade?', 'Travel'),
      ('part3', 'What are the environmental impacts of global tourism?', 'Travel');
    `);
    
    console.log("Done");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seed();
