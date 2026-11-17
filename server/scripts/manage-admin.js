// Admin account management - the only supported way to create an admin.
//
// Admins are ordinary Supabase Auth accounts with role = 'admin' in MySQL.
// There is no seeded admin and no local password: register in the app,
// verify the email, then promote the account from a trusted machine.
//
// Usage (from server/):
//   npm run admin -- list
//   npm run admin -- promote <email>      make a verified Supabase user an admin
//   npm run admin -- demote  <email>      back to student (sessions revoked)
//   npm run admin -- revoke  <email>      sign this user out everywhere
//   npm run admin -- revoke-all           sign EVERY user out everywhere
//
// Needs DB_* plus SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env
// (the service-role key lets us confirm the Supabase identity is real and
// verified before granting admin).
import { createClient } from '@supabase/supabase-js';
import { pool } from '../src/config/db.js';
import { isValidEmail } from '../src/utils/validate.js';

const [command, rawEmail] = process.argv.slice(2);
const email = rawEmail?.trim().toLowerCase();

function usage(msg) {
  if (msg) console.error(`Error: ${msg}\n`);
  console.error('Usage: npm run admin -- <list | promote <email> | demote <email> | revoke <email> | revoke-all>');
  process.exit(1);
}

async function findUser(emailAddr) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, role, supabase_id FROM users WHERE email = ?',
    [emailAddr]
  );
  if (!rows[0]) throw new Error(`No account with email ${emailAddr}. Register it in the app first.`);
  return rows[0];
}

async function bumpTokenVersion(userId) {
  await pool.execute('UPDATE users SET token_version = token_version + 1 WHERE id = ?', [userId]);
}

async function promote(emailAddr) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to promote an admin.');
  }
  const user = await findUser(emailAddr);
  if (!user.supabase_id) {
    throw new Error('This account is not linked to Supabase Auth. Delete it and register again through the app.');
  }

  const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(user.supabase_id);
  if (error || !data?.user) {
    throw new Error(`Supabase user ${user.supabase_id} not found: ${error?.message || 'unknown error'}`);
  }
  if ((data.user.email || '').toLowerCase() !== emailAddr) {
    throw new Error('Supabase email does not match the MySQL account. Refusing to promote.');
  }
  if (!data.user.email_confirmed_at) {
    throw new Error('Email is not verified in Supabase yet. Verify it first, then promote.');
  }

  await pool.execute("UPDATE users SET role = 'admin', is_verified = TRUE WHERE id = ?", [user.id]);
  await bumpTokenVersion(user.id); // old student-role cookie must not linger
  console.log(`Promoted ${emailAddr} to admin. They must log in again.`);
}

async function demote(emailAddr) {
  const user = await findUser(emailAddr);
  if (user.role !== 'admin') {
    console.log(`${emailAddr} is not an admin; nothing to do.`);
    return;
  }
  const [[{ admins }]] = await pool.execute("SELECT COUNT(*) AS admins FROM users WHERE role = 'admin'");
  if (admins <= 1) console.warn('Warning: this was the last admin account.');
  await pool.execute("UPDATE users SET role = 'student' WHERE id = ?", [user.id]);
  await bumpTokenVersion(user.id);
  console.log(`Demoted ${emailAddr} to student and revoked their sessions.`);
}

async function main() {
  switch (command) {
    case 'list': {
      const [rows] = await pool.execute(
        "SELECT id, name, email, supabase_id IS NOT NULL AS supabase_linked FROM users WHERE role = 'admin' ORDER BY id"
      );
      if (rows.length === 0) console.log('No admin accounts.');
      else console.table(rows);
      break;
    }
    case 'promote':
    case 'demote':
    case 'revoke': {
      if (!isValidEmail(email)) usage('a valid email is required.');
      if (command === 'promote') await promote(email);
      else if (command === 'demote') await demote(email);
      else {
        const user = await findUser(email);
        await bumpTokenVersion(user.id);
        console.log(`Revoked all sessions for ${email}.`);
      }
      break;
    }
    case 'revoke-all': {
      const [result] = await pool.execute('UPDATE users SET token_version = token_version + 1');
      console.log(`Revoked all sessions for ${result.affectedRows} users.`);
      break;
    }
    default:
      usage(command ? `unknown command "${command}".` : undefined);
  }
}

main()
  .catch((err) => {
    console.error(`Error: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
