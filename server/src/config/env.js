// Central place to read environment variables.
// Every other file imports from here, so a typo in a variable name
// fails loudly at startup instead of silently at 2am before the demo.
import dotenv from 'dotenv';
import { createHash } from 'node:crypto';
// Tests (NODE_ENV=test) set every variable themselves and must never pick up
// a developer's real .env, which may point at production.
if (process.env.NODE_ENV !== 'test') dotenv.config();

// These must exist in .env. An empty value is allowed for most of them
// (DB_PASSWORD is legitimately blank on a default XAMPP/WAMP install), so
// we check that the KEY is defined, not that it is non-empty.
const requiredDefined = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = requiredDefined.filter((key) => process.env[key] === undefined);

// JWT_SECRET is the one value that must actually have content - a blank
// signing secret would be a real security hole.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
  missing.push('JWT_SECRET');
}

// The production JWT secret used before Nov 2026 was committed to Git
// (DEPLOYMENT.md) and must be treated as public: anyone holding it can forge
// an admin session. Refuse to start with it. Only its SHA-256 is kept here.
const LEAKED_JWT_SECRET_SHA256 = [
  'e41e051de662c8708525e7b22e6c77dea7e22f601771e2a8014bf87e094e4bae',
];

if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Copy server/.env.example to server/.env and fill in the values.');
  console.error('(Note: DB_PASSWORD may be empty, but the DB_PASSWORD= line must still be present.)');
  process.exit(1);
}

const jwtSecret = process.env.JWT_SECRET.trim();
if (LEAKED_JWT_SECRET_SHA256.includes(createHash('sha256').update(jwtSecret).digest('hex'))) {
  console.error('JWT_SECRET is a value that was leaked in Git history. Generate a new one:');
  console.error("  node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"");
  process.exit(1);
}
if (jwtSecret.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    console.error('JWT_SECRET must be at least 32 characters in production.');
    process.exit(1);
  }
  console.warn('Warning: JWT_SECRET is shorter than 32 characters. Use a long random value.');
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5000',

  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' || process.env.DB_SSL === '1',
  },

  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  ai: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.AI_MODEL || 'gemini-2.0-flash',
  },
};
