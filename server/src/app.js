// Express application setup: middleware chain, routes, error handling.
// Kept separate from server.js so the app can be imported in tests
// without starting a real HTTP listener.
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiRouter } from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import compression from 'compression';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

// Compress all JSON responses
app.use(compression());

// Body size limit protects against oversized payloads.
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Basic security headers (a tiny subset of what helmet does, hand-rolled
// so the team can explain each one).
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff'); // no MIME sniffing
  res.setHeader('X-Frame-Options', 'DENY');           // no clickjacking iframes
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

// The frontend is plain HTML/CSS/JS served by this same Express server,
// so cookies are first-party and no CORS configuration is needed.
app.use(express.static(path.join(__dirname, '../../client')));

app.use('/api', apiRouter);

app.get('/api/ping', async (req, res) => {
  try {
    const { pool } = await import('./config/db.js');
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', ['admin@bandup.com']);
    const user = rows[0];
    if (!user) return res.json({ error: 'Admin not found' });
    
    let errorStack = 'None';
    try {
      const bcrypt = await import('bcryptjs');
      const passwordMatches = await bcrypt.default.compare('Admin@123', user.password_hash);
    } catch(e) {
      errorStack = e.stack;
    }
    
    res.json({ status: 'ok', userRole: user.role, supabaseId: user.supabase_id, errorStack });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message, stack: err.stack });
  }
});

app.get('/api/admin/force-db-reset', async (req, res) => {
  try {
    const { exec } = await import('node:child_process');
    exec('node scripts/run-seeds.js && node seed_writing_tests.js && node scripts/generate-mock-tests.js', (err, stdout, stderr) => {
      res.send(`<h1>Database Reset Output</h1><pre>STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}</pre><p><a href="/">Go back to app</a></p>`);
    });
  } catch(e) {
    res.send(e.toString());
  }
});

app.use(notFound);
app.use(errorHandler);
