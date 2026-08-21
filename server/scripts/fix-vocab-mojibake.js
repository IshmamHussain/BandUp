import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fix() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: env.db.host,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    charset: 'utf8mb4',
    multipleStatements: true,
  });

  try {
    console.log('Reading seed data...');
    const seedSql = await fs.readFile(path.join(__dirname, '../../database/seeds/seed.sql'), 'utf-8');
    
    // Extract only the vocabulary insert block
    const match = seedSql.match(/INSERT INTO vocabulary[\s\S]*?\)\s*;/);
    if (!match) {
      throw new Error('Could not find vocabulary insert block in seed.sql');
    }
    
    let vocabInsert = match[0];
    
    console.log('Creating temporary table...');
    await connection.query(`CREATE TEMPORARY TABLE temp_vocab LIKE vocabulary`);
    
    vocabInsert = vocabInsert.replace('INSERT INTO vocabulary', 'INSERT INTO temp_vocab');
    
    console.log('Loading clean data into temporary table...');
    await connection.query(vocabInsert);
    
    console.log('Repairing existing vocabulary table...');
    const [result] = await connection.query(`
      UPDATE vocabulary v
      JOIN temp_vocab t ON v.word = t.word
      SET v.pronunciation = t.pronunciation,
          v.antonyms = t.antonyms,
          v.synonyms = t.synonyms,
          v.meaning = t.meaning,
          v.example_sentence = t.example_sentence
    `);
    
    console.log('Update result:', result.info);
    if (result.affectedRows === 0) {
      console.log('WARNING: No rows were updated! This means the words in the database did not match the seed data.');
    } else {
      console.log('Success! The pronunciation and antonym mojibake has been fixed.');
    }
  } catch (err) {
    console.error('Failed to fix mojibake:', err);
  } finally {
    await connection.end();
  }
}

fix();
