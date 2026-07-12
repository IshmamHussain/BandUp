import mysql from 'mysql2/promise';
import { env } from './src/config/env.js';

async function run() {
  const connection = await mysql.createConnection({
    host: env.db.host,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
  });
  const [rows] = await connection.execute("SELECT id, chart_data FROM writing_prompts WHERE task_type='task1' LIMIT 1");
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}
run();
