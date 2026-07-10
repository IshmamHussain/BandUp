// MySQL connection pool. A pool reuses connections instead of opening a
// new one per request, which is both faster and safer under load.
// All queries in the app go through pool.execute(), which uses prepared
// statements - our primary defence against SQL injection.
import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
});

// Called once at startup so a bad DB config fails immediately.
export async function verifyDatabaseConnection() {
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
}
