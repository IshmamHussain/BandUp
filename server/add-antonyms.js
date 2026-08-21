import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { env } from './src/config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const replacements = {
  'demographic': 'individual',
  'algorithm': 'manual process',
  'bandwidth': 'limitation, constraint',
  'curriculum': 'extracurricular',
  'pedagogy': 'self-teaching',
  'epidemic': 'containment',
  'immunisation': 'infection, exposure',
  'fiscal': 'non-financial',
  'entrepreneurship': 'employment, conformity',
  'jurisdiction': 'exemption',
  'phenomenon': 'normality',
  'specimen': 'whole, entirety'
};

async function run() {
  const connection = await mysql.createConnection({
    host: env.db.host,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    charset: 'utf8mb4'
  });

  console.log('Updating live database...');
  for (const [word, antonym] of Object.entries(replacements)) {
    await connection.query('UPDATE vocabulary SET antonyms = ? WHERE word = ?', [antonym, word]);
  }
  await connection.end();
  console.log('Live database updated.');

  console.log('Updating seed.sql...');
  const seedPath = path.join(__dirname, '../database/seeds/seed.sql');
  const seed = await fs.readFile(seedPath, 'utf8');
  const lines = seed.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    for (const [word, antonym] of Object.entries(replacements)) {
      if (lines[i].includes(`('${word}',`)) {
        // Replace the '—' with the actual antonym
        // Be careful not to replace other em-dashes
        lines[i] = lines[i].replace(/','—','/, `','${antonym}','`);
        lines[i] = lines[i].replace(/','ÔÇö','/, `','${antonym}','`);
      }
    }
  }
  
  await fs.writeFile(seedPath, lines.join('\n'), 'utf8');
  console.log('seed.sql updated.');
}
run();
