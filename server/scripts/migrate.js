// Apply pending database migrations by hand: `npm run migrate` (from server/).
// The server also runs them at startup; this is for applying them before a
// deploy, or after fixing one that failed. Exits 1 if any migration fails.
import { pool } from '../src/config/db.js';
import { runMigrations, MIGRATION_IDS } from '../src/config/migrations.js';

try {
  const { applied, failed } = await runMigrations();
  if (applied.length === 0 && !failed) {
    console.log(`Database is up to date (${MIGRATION_IDS.length} migrations).`);
  } else if (!failed) {
    console.log(`Applied ${applied.length} migration(s).`);
  }
  process.exitCode = failed ? 1 : 0;
} catch (err) {
  console.error(`Migration run failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
