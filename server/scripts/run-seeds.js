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
    console.log('Dropping all tables safely...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    const [tables] = await connection.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = '${env.db.database}'`);
    for (const row of tables) {
      const tName = row.table_name || row.TABLE_NAME;
      await connection.query(`DROP TABLE IF EXISTS \`${env.db.database}\`.\`${tName}\``);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    await connection.query(`USE \`${env.db.database}\`;`);

    console.log('Running schema.sql...');
    let schemaSql = await fs.readFile(path.join(__dirname, '../../database/schema.sql'), 'utf-8');
    schemaSql = schemaSql.replace(/CREATE DATABASE IF NOT EXISTS ielts_prep;/gi, '').replace(/USE ielts_prep;/gi, '');
    await connection.query(schemaSql);

    console.log('Running schema_speaking.sql...');
    let schemaSpeakingSql = await fs.readFile(path.join(__dirname, '../../database/schema_speaking.sql'), 'utf-8');
    schemaSpeakingSql = schemaSpeakingSql.replace(/USE ielts_prep;/gi, '');
    await connection.query(schemaSpeakingSql);

    console.log('Running seed.sql...');
    let seedSql = await fs.readFile(path.join(__dirname, '../../database/seeds/seed.sql'), 'utf-8');
    seedSql = seedSql.replace(/USE ielts_prep;/gi, '');
    await connection.query(seedSql);

    console.log('Running listening-override.sql...');
    let listeningSql = await fs.readFile(path.join(__dirname, '../../database/seeds/listening-override.sql'), 'utf-8');
    listeningSql = listeningSql.replace(/USE ielts_prep;/gi, '');
    await connection.query(listeningSql);

    console.log('Running listening-cambridge.sql...');
    let cambridgeSql = await fs.readFile(path.join(__dirname, '../../database/seeds/listening-cambridge.sql'), 'utf-8');
    cambridgeSql = cambridgeSql.replace(/USE ielts_prep;/gi, '');
    await connection.query(cambridgeSql);

    console.log('Running fix_orphan_passages.sql...');
    let fixOrphanSql = await fs.readFile(path.join(__dirname, '../../database/fix_orphan_passages.sql'), 'utf-8');
    
    // We need to split the statements because DELIMITER is a client-only command, 
    // it won't work directly via mysql2 query if it contains DELIMITER $$
    // Actually, since we're using mysql2 multipleStatements: true, we can just execute the CREATE PROCEDURE 
    // without DELIMITER. Let's just run it cleanly.
    
    // It's safer to just run mysql CLI for this file, or execute it without DELIMITER:
    // Let's modify fixOrphanSql to remove DELIMITER and $$
    fixOrphanSql = fixOrphanSql.replace(/DELIMITER \$\$/g, '')
                               .replace(/DELIMITER ;/g, '')
                               .replace(/\$\$/g, ';');
    
    await connection.query(fixOrphanSql);

    console.log('Database successfully reset and seeded!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await connection.end();
  }
}

run();
