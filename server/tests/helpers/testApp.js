// Test harness: boots the real Express app against
//   - an in-memory fake of the MySQL pool (pool.execute / pool.query), and
//   - a local fake of Supabase (Auth sign-in, admin user delete, Storage).
// Nothing touches a real database or network service, so tests run in CI
// with no secrets. Each test file runs in its own process (node --test), so
// every file gets a fresh app and fresh fakes.
import http from 'node:http';

export const UUID = {
  a: '11111111-1111-4111-8111-111111111111',
  b: '22222222-2222-4222-8222-222222222222',
  admin: '33333333-3333-4333-8333-333333333333',
  other: '44444444-4444-4444-8444-444444444444',
};

export const TEST_JWT_SECRET = 'test_secret_that_is_definitely_longer_than_32_chars';

// ---------------------------------------------------------------- Supabase
function startFakeSupabase() {
  const state = {
    authUsers: new Map(), // email -> { password, id }
    objects: new Map(),   // storage path -> { type, size }
    bucket: { id: 'speaking-audio', name: 'speaking-audio', public: false },
    createdBucket: null,
    deletedAuthUsers: [],
  };

  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks);
      const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const json = (code, body) => {
        res.writeHead(code, { 'content-type': 'application/json' });
        res.end(JSON.stringify(body));
      };
      const body = () => { try { return JSON.parse(raw.toString() || '{}'); } catch { return {}; } };

      // Auth: password sign-in
      if (p === '/auth/v1/token') {
        const { email, password } = body();
        const u = state.authUsers.get(email);
        if (!u || u.password !== password) {
          return json(400, { error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
        }
        return json(200, {
          access_token: 'x', token_type: 'bearer', expires_in: 3600, expires_at: 9999999999, refresh_token: 'r',
          user: { id: u.id, aud: 'authenticated', email, email_confirmed_at: '2026-01-01T00:00:00Z' },
        });
      }
      // Auth admin: delete user
      if (p.startsWith('/auth/v1/admin/users/') && req.method === 'DELETE') {
        state.deletedAuthUsers.push(p.split('/').pop());
        return json(200, {});
      }

      // Storage
      const S = '/storage/v1';
      const OBJ = `${S}/object/speaking-audio/`;
      const SIGN = `${S}/object/sign/speaking-audio/`;
      if (p === `${S}/bucket/speaking-audio` && req.method === 'GET') {
        return state.bucket ? json(200, state.bucket) : json(404, { statusCode: '404', error: 'Bucket not found', message: 'Bucket not found' });
      }
      if (p === `${S}/bucket` && req.method === 'POST') {
        state.createdBucket = body();
        state.bucket = { ...state.createdBucket };
        return json(200, { name: state.createdBucket.name });
      }
      if (p.startsWith(SIGN)) {
        const key = p.slice(SIGN.length);
        if (!state.objects.has(key)) return json(404, { statusCode: '404', error: 'not_found', message: 'Object not found' });
        return json(200, { signedURL: `/object/sign/speaking-audio/${key}?token=signed-${body().expiresIn}` });
      }
      if (p === `${S}/object/list/speaking-audio`) {
        const { prefix } = body();
        const names = [...state.objects.keys()]
          .filter((k) => k.startsWith(prefix + '/'))
          .map((k) => ({ name: k.slice(prefix.length + 1) }));
        return json(200, names);
      }
      if (p === `${S}/object/speaking-audio` && req.method === 'DELETE') {
        const removed = body().prefixes.filter((k) => state.objects.delete(k));
        return json(200, removed.map((name) => ({ name })));
      }
      if (p.startsWith(OBJ) && req.method === 'POST') {
        const key = p.slice(OBJ.length);
        state.objects.set(key, { type: req.headers['content-type'], size: raw.length });
        return json(200, { Key: `speaking-audio/${key}` });
      }
      return json(404, { message: `fake supabase: unhandled ${req.method} ${p}` });
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ state, server, url: `http://127.0.0.1:${server.address().port}` }));
  });
}

// ------------------------------------------------------------------- MySQL
// Only the queries the tested routes use are modelled; anything else returns
// an empty result, which is what background work (streaks, progress) needs.
const DEFAULT_SPEAKING_TESTS = [
  { id: 1, title: 'Hometown', part1_prompt: 'Where is your hometown?', part2_prompt: 'Describe a person.', part3_prompt: 'Why do people move?' },
];

function createFakeDb({ users = [], submissions = [], essays = [], questions = [], speakingTests = DEFAULT_SPEAKING_TESTS }) {
  const db = {
    users: users.map((u) => ({ ...u })),
    submissions: submissions.map((s) => ({ ...s })), // speaking
    essays: essays.map((e) => ({ ...e })),           // writing
    questions: questions.map((q) => ({ ...q })),     // listening questions
    attempts: [],
    speakingTests: speakingTests.map((t) => ({ ...t })),
    testResults: [],   // reading/listening per-test results, oldest first
    estimates: {},     // userId -> last stored current_band_estimate
    nextId: 1000,
    failInserts: false,
  };
  const essayById = (id) => db.essays.find((e) => e.id === Number(id));
  const userById = (id) => db.users.find((u) => u.id === Number(id));
  const copy = (row) => (row ? [{ ...row }] : []); // MySQL returns fresh rows

  db.execute = async (sql, params = []) => {
    const q = sql.replace(/\s+/g, ' ').trim();

    if (q.startsWith('SELECT id, name, email, role, is_verified, supabase_id, token_version FROM users WHERE email')) {
      return [copy(db.users.find((u) => u.email === params[0]))];
    }
    if (q.startsWith('SELECT id, name, role, token_version FROM users WHERE id')) return [copy(userById(params[0]))];
    if (q.includes('FROM users u LEFT JOIN profiles')) return [copy(userById(params[0]))];
    if (q.startsWith('UPDATE users SET token_version = token_version + 1 WHERE id')) {
      userById(params[0]).token_version++;
      return [{ affectedRows: 1 }];
    }
    if (q.startsWith("DELETE FROM users WHERE id = ? AND role = 'student'")) {
      db.users = db.users.filter((u) => !(u.id === Number(params[0]) && u.role === 'student'));
      return [{ affectedRows: 1 }];
    }

    if (q.startsWith('INSERT INTO speaking_submissions')) {
      if (db.failInserts) throw new Error('simulated database failure');
      const row = { id: db.nextId++, user_id: params[0], test_id: params[1], audio_url: params[2], duration_sec: params[3], status: params[4] };
      db.submissions.push(row);
      return [{ insertId: row.id }];
    }
    if (q.startsWith('SELECT s.*')) {
      return [copy(db.submissions.find((s) => s.id === Number(params[0]) && s.user_id === Number(params[1])))];
    }

    // Writing submissions
    if (q.startsWith('SELECT ws.*, wp.prompt_text FROM writing_submissions ws')) {
      return [copy(db.essays.find((e) => e.id === Number(params[0]) && e.user_id === Number(params[1])))];
    }
    if (q.startsWith("UPDATE writing_submissions SET status = 'failed'")) {
      Object.assign(essayById(params[1]), { status: 'failed', band_overall: null, evaluation_json: JSON.parse(params[0]) });
      return [{ affectedRows: 1 }];
    }
    if (q.startsWith("UPDATE writing_submissions SET status = 'submitted'")) {
      Object.assign(essayById(params[0]), { status: 'submitted', evaluation_json: null });
      return [{ affectedRows: 1 }];
    }
    if (q.startsWith("UPDATE writing_submissions SET status = 'evaluated'")) {
      Object.assign(essayById(params[2]), { status: 'evaluated', band_overall: params[0], evaluation_json: JSON.parse(params[1]) });
      return [{ affectedRows: 1 }];
    }

    // Speaking tests and evaluation results
    if (q.startsWith('SELECT id, title, part1_prompt, part2_prompt, part3_prompt FROM speaking_tests WHERE id')) {
      return [copy(db.speakingTests.find((t) => t.id === Number(params[0])))];
    }
    if (q.startsWith('UPDATE speaking_submissions SET status = ?, band_overall = ?, evaluation_json = ? WHERE id')) {
      Object.assign(db.submissions.find((s) => s.id === Number(params[3])) || {}, { status: params[0], band_overall: params[1] });
      return [{ affectedRows: 1 }];
    }
    if (q.startsWith('UPDATE speaking_submissions SET status = ?, band_overall = NULL, evaluation_json = ? WHERE id')) {
      Object.assign(db.submissions.find((s) => s.id === Number(params[2])) || {}, { status: params[0], band_overall: null });
      return [{ affectedRows: 1 }];
    }

    // Band estimate inputs and output
    if (q.startsWith('INSERT INTO test_results')) {
      const [user_id, module, test_id, correct, total, band] = params;
      db.testResults.push({ id: db.nextId++, user_id, module, test_id, correct, total, band });
      return [{ affectedRows: 1 }];
    }
    if (q.startsWith('DELETE FROM test_results')) {
      db.testResults = db.testResults.filter((r) => !(r.user_id === params[0] && r.module === params[1] && r.test_id === params[2]));
      return [{ affectedRows: 1 }];
    }
    if (q.startsWith('SELECT band, total FROM test_results')) {
      const module = q.includes("'reading'") ? 'reading' : 'listening';
      const limit = Number(/LIMIT (\d+)/.exec(q)[1]);
      return [db.testResults.filter((r) => r.user_id === Number(params[0]) && r.module === module)
        .slice().reverse().slice(0, limit).map(({ band, total }) => ({ band, total }))];
    }
    if (q.startsWith('SELECT band_overall AS band, task_type AS taskType FROM writing_submissions')) {
      return [db.essays.filter((e) => e.user_id === Number(params[0]) && e.status === 'evaluated' && e.band_overall != null)
        .slice().reverse().map((e) => ({ band: e.band_overall, taskType: e.task_type }))];
    }
    if (q.startsWith('SELECT band_overall AS band FROM speaking_submissions')) {
      return [db.submissions.filter((s) => s.user_id === Number(params[0]) && s.status === 'evaluated' && s.band_overall != null)
        .slice().reverse().map((s) => ({ band: s.band_overall }))];
    }
    if (q.startsWith('UPDATE profiles SET current_band_estimate')) {
      db.estimates[params[1]] = params[0];
      return [{ affectedRows: 1 }];
    }

    // Dashboard module accuracy (aggregate rows always exist in MySQL)
    if (q.startsWith('SELECT COUNT(*) AS attempted')) {
      return [[{ attempted: 0, correct: 0, avg_band: null }]];
    }

    // Listening scoring
    if (q.startsWith('SELECT id, question_type, options_json, correct_answer, explanation FROM questions WHERE listening_test_id')) {
      return [db.questions.filter((x) => x.listening_test_id === Number(params[0])).map((x) => ({ ...x }))];
    }
    if (q.startsWith('INSERT INTO attempts')) {
      db.attempts.push(params);
      return [{ affectedRows: 1 }];
    }

    return [[], []];
  };
  return db;
}

// --------------------------------------------------------------------- App
/**
 * Boot the app with fake services.
 * @param {{ users?: object[], submissions?: object[], authUsers?: Record<string, {password: string, id: string}> }} opts
 */
export async function startTestApp({ users = [], submissions = [], essays = [], questions = [], authUsers = {} } = {}) {
  const supa = await startFakeSupabase();
  for (const [email, u] of Object.entries(authUsers)) supa.state.authUsers.set(email, u);

  // Must be set before any app module is imported (env.js reads them once).
  Object.assign(process.env, {
    NODE_ENV: 'test',
    DB_HOST: 'fake', DB_USER: 'fake', DB_PASSWORD: '', DB_NAME: 'fake',
    JWT_SECRET: TEST_JWT_SECRET, JWT_EXPIRES_IN: '7d',
    GEMINI_API_KEY: '', // AI calls fall back to clearly-labelled mock results
    SUPABASE_URL: supa.url, SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service',
  });

  const { pool } = await import('../../src/config/db.js');
  const db = createFakeDb({ users, submissions, essays, questions });
  pool.execute = db.execute;
  pool.query = db.execute;
  pool.getConnection = async () => { throw new Error('fake db: transactions are not modelled'); };

  const { app } = await import('../../src/app.js');
  const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api`;

  /** Plain request; returns { status, headers, json, cookie }. Never follows redirects. */
  async function request(method, path, { cookie, body, form } = {}) {
    const headers = {};
    if (cookie) headers.cookie = cookie;
    let payload;
    if (form) payload = form;
    else if (body !== undefined) { headers['content-type'] = 'application/json'; payload = JSON.stringify(body); }
    const r = await fetch(base + path, { method, headers, body: payload, redirect: 'manual' });
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not JSON */ }
    return { status: r.status, headers: r.headers, json, text, cookie: (r.headers.get('set-cookie') || '').split(';')[0] };
  }

  async function login(email, password) {
    const r = await request('POST', '/auth/login', { body: { email, password } });
    if (r.status !== 200) throw new Error(`login(${email}) failed: ${r.status} ${r.text}`);
    return r.cookie;
  }

  async function close() {
    await new Promise((r) => server.close(r));
    await new Promise((r) => supa.server.close(r));
    await pool.end().catch(() => {});
  }

  return { base, request, login, db, supabase: supa.state, close };
}
