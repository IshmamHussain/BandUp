// Entry point. Starts the HTTP listener FIRST so Render's proxy sees the
// service is alive, then connects to the database.  This prevents 502
// errors on free-tier cold starts where the DB handshake is slow.
import { app } from './src/app.js';
import { env } from './src/config/env.js';
import { verifyDatabaseConnection } from './src/config/db.js';
import { runMigrations } from './src/config/migrations.js';


// Start listening immediately so the port is open for Render's health check.
app.listen(env.port, async () => {
  console.log(`IELTS Prep API running at http://localhost:${env.port} (${env.nodeEnv})`);

  try {
    await verifyDatabaseConnection();
    console.log(`Database connected: ${env.db.database}@${env.db.host}`);
    await runMigrations();
  } catch (err) {
    console.error('Could not connect to MySQL. Is the database running and .env correct?');
    console.error(err.message);
    // Don't exit — the server is up and will return 500s on API calls,
    // but at least Render won't 502 and you'll see these logs.
  }
});
