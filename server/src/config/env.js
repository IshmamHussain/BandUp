// Central place to read environment variables.
// Every other file imports from here, so a typo in a variable name
// fails loudly at startup instead of silently at 2am before the demo.
import dotenv from 'dotenv';
dotenv.config();

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

if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error('Copy server/.env.example to server/.env and fill in the values.');
  console.error('(Note: DB_PASSWORD may be empty, but the DB_PASSWORD= line must still be present.)');
  process.exit(1);
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
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  ai: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.AI_MODEL || 'gemini-2.0-flash',
  },
};
