// MySQL connection pool. A pool reuses connections instead of opening a
// new one per request, which is both faster and safer under load.
// All queries in the app go through pool.execute(), which uses prepared
// statements - our primary defence against SQL injection.
import mysql from 'mysql2/promise';
import { env } from './env.js';

const poolConfig = {
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
};

// Enable SSL if explicitly configured or when connecting to a remote/cloud database (Aiven, TiDB, Clever Cloud, etc.)
if (
  env.db.ssl ||
  (process.env.DB_SSL !== 'false' && env.db.host && !env.db.host.includes('localhost') && !env.db.host.includes('127.0.0.1'))
) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

export const pool = mysql.createPool(poolConfig);

// Called once at startup so a bad DB config fails immediately.
export async function verifyDatabaseConnection() {
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
}
