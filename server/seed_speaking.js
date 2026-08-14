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
      ('part2', 'Describe an interesting technological device you use. You should say: what it is, how you use it, how often you use it, and explain why it is important to you.', 'Technology'), 
      ('part2', 'Describe a sports event you watched or participated in. You should say: what the event was, when and where it took place, who you watched or played with, and explain how you felt about it.', 'Sports'), 
      ('part2', 'Describe an important skill you learned recently. You should say: what the skill is, how you learned it, why you learned it, and explain how it has helped you.', 'Education'),
      ('part2', 'Describe a beautiful place you have visited. You should say: where it is, how you got there, what you did there, and explain why you think it is beautiful.', 'Travel'),
      ('part2', 'Describe a healthy lifestyle choice you made. You should say: what it is, when you started doing it, how it makes you feel, and explain why you decided to do it.', 'Health'),
      ('part2', 'Describe an environmental problem in your city or country. You should say: what the problem is, what causes it, how it affects people, and suggest ways to solve it.', 'Environment'),
      ('part2', 'Describe a traditional festival in your country. You should say: when it occurs, what people do during this festival, what special food is eaten, and explain why it is important.', 'Culture'),
      ('part2', 'Describe an ideal job you would like to have. You should say: what the job is, what qualifications are needed, what the responsibilities would be, and explain why you want this job.', 'Work'),
      ('part2', 'Describe a book or movie that had a strong impact on you. You should say: what it is about, when you read or saw it, who the main characters are, and explain why it affected you so much.', 'Media'),
      ('part2', 'Describe a famous person you admire. You should say: who they are, what they are famous for, what you know about their life, and explain why you admire them.', 'Society');
    `);
    
    console.log("Done");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seed();
