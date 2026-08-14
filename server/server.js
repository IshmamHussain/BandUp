// Entry point. Verifies the database is reachable, then starts listening.
import { app } from './src/app.js';
import { env } from './src/config/env.js';
import { verifyDatabaseConnection } from './src/config/db.js';
import { runMigrations } from './src/config/migrations.js';

try {
  await verifyDatabaseConnection();
  console.log(`Database connected: ${env.db.database}@${env.db.host}`);
  await runMigrations();
} catch (err) {
  console.error('Could not connect to MySQL. Is the database running and .env correct?');
  console.error(err.message);
  process.exit(1);
}

app.listen(env.port, () => {
  console.log(`IELTS Prep API running at http://localhost:${env.port} (${env.nodeEnv})`);
});
