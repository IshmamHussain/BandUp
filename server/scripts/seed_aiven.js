import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  console.log('Connecting to cloud database...');
  
  // Connect using environment variables
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'defaultdb',
    multipleStatements: true,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Running schema.sql...');
    // The local schema tries to CREATE DATABASE ielts_prep. 
    // We shouldn't do that on Aiven since we are given `defaultdb`.
    // Let's read the schema, remove the CREATE DATABASE and USE statements, and run the rest.
    let schemaSql = await fs.readFile(path.join(__dirname, '../../database/schema.sql'), 'utf-8');
    
    // Remove database creation specific to localhost
    schemaSql = schemaSql.replace(/CREATE DATABASE IF NOT EXISTS ielts_prep[\s\S]*?USE ielts_prep;/i, '');
    
    await connection.query(schemaSql);
    console.log('Schema created successfully on Aiven!');

    console.log('Running seed.sql...');
    const seedSql = await fs.readFile(path.join(__dirname, '../../database/seeds/seed.sql'), 'utf-8');
    await connection.query(seedSql);
    console.log('Seeds inserted successfully!');

    console.log('Running listening-override.sql...');
    const listeningSql = await fs.readFile(path.join(__dirname, '../../database/seeds/listening-override.sql'), 'utf-8');
    await connection.query(listeningSql);
    console.log('Listening overrides inserted successfully!');

    console.log('\n--- Aiven Database Setup Complete! ---');
  } catch (err) {
    console.error('Error seeding Aiven database:', err);
  } finally {
    await connection.end();
  }
}

run();
