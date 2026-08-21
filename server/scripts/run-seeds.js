import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  console.log('Connecting to database...');
  const connectionConfig = {
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
    charset: 'utf8mb4',
  };

  if (env.db.ssl || (process.env.DB_SSL !== 'false' && env.db.host && !env.db.host.includes('localhost') && !env.db.host.includes('127.0.0.1'))) {
    connectionConfig.ssl = { rejectUnauthorized: false };
  }

  const connection = await mysql.createConnection(connectionConfig);

  try {
    console.log('Dropping and recreating database...');
    await connection.query(`DROP DATABASE IF EXISTS \`${env.db.database}\`;`);
    await connection.query(`CREATE DATABASE \`${env.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${env.db.database}\`;`);

    console.log('Running schema.sql...');
    const schemaSql = await fs.readFile(path.join(__dirname, '../../database/schema.sql'), 'utf-8');
    await connection.query(schemaSql);

    console.log('Running seed.sql...');
    const seedSql = await fs.readFile(path.join(__dirname, '../../database/seeds/seed.sql'), 'utf-8');
    await connection.query(seedSql);

    console.log('Running listening-override.sql...');
    const listeningSql = await fs.readFile(path.join(__dirname, '../../database/seeds/listening-override.sql'), 'utf-8');
    await connection.query(listeningSql);

    console.log('Running listening-cambridge.sql...');
    const cambridgeSql = await fs.readFile(path.join(__dirname, '../../database/seeds/listening-cambridge.sql'), 'utf-8');
    await connection.query(cambridgeSql);

    console.log('Database successfully reset and seeded!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await connection.end();
  }
}

run();
