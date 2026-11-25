// Login, admin access and session revocation (faculty report item 1).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { startTestApp, UUID, TEST_JWT_SECRET } from './helpers/testApp.js';

const PW = 'Pass-word-123';
let app;

before(async () => {
  app = await startTestApp({
    users: [
      // The old seeded admin: never linked to Supabase.
      { id: 1, name: 'Admin', email: 'admin@bandup.com', role: 'admin', is_verified: 0, supabase_id: null, token_version: 0 },
      { id: 2, name: 'Real Admin', email: 'boss@example.com', role: 'admin', is_verified: 1, supabase_id: UUID.admin, token_version: 0 },
      { id: 3, name: 'Student', email: 'stu@example.com', role: 'student', is_verified: 1, supabase_id: UUID.a, token_version: 0 },
    ],
    authUsers: {
      'boss@example.com': { password: PW, id: UUID.admin },
      'stu@example.com': { password: PW, id: UUID.a },
    },
  });
});
after(() => app?.close()); // app is undefined if before() failed

const sign = (payload) => jwt.sign(payload, TEST_JWT_SECRET, { algorithm: 'HS256' });

test('the old seeded admin password no longer logs in', async () => {
  const r = await app.request('POST', '/auth/login', { body: { email: 'admin@bandup.com', password: 'Admin@123' } });
  assert.equal(r.status, 401);
});

test('a Supabase account not bound to the MySQL row is rejected, even for an admin email', async () => {
  app.supabase.authUsers.set('admin@bandup.com', { password: PW, id: UUID.other });
  assert.equal((await app.request('POST', '/auth/login', { body: { email: 'admin@bandup.com', password: PW } })).status, 401);

  app.supabase.authUsers.set('boss@example.com', { password: 'different-1', id: UUID.other });
  assert.equal((await app.request('POST', '/auth/login', { body: { email: 'boss@example.com', password: 'different-1' } })).status, 401);
  app.supabase.authUsers.set('boss@example.com', { password: PW, id: UUID.admin });
});

test('wrong password is rejected with a generic message', async () => {
  const r = await app.request('POST', '/auth/login', { body: { email: 'stu@example.com', password: 'nope-12345' } });
  assert.equal(r.status, 401);
  assert.equal(r.json.error, 'Email or password is incorrect.');
});

test('a Supabase-linked admin logs in and can reach admin routes', async () => {
  const cookie = await app.login('boss@example.com', PW);
  const r = await app.request('GET', '/admin/stats', { cookie });
  assert.ok(![401, 403].includes(r.status), `expected access, got ${r.status}`);
});

test('students cannot reach admin routes', async () => {
  const cookie = await app.login('stu@example.com', PW);
  assert.equal((await app.request('GET', '/admin/stats', { cookie })).status, 403);
});

test('requests without a session get 401', async () => {
  assert.equal((await app.request('GET', '/auth/me')).status, 401);
});

test('a token without the token-version claim is rejected', async () => {
  const token = sign({ sub: 2, role: 'admin', name: 'x' });
  assert.equal((await app.request('GET', '/auth/me', { cookie: `token=${token}` })).status, 401);
});

test('the role comes from the database, not from the token', async () => {
  const token = sign({ sub: 3, role: 'admin', name: 'x', tv: 0 });
  assert.equal((await app.request('GET', '/admin/stats', { cookie: `token=${token}` })).status, 403);
});

test('unsigned (alg=none) tokens are rejected', async () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const token = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: 2, role: 'admin', tv: 0 })}.`;
  assert.equal((await app.request('GET', '/auth/me', { cookie: `token=${token}` })).status, 401);
});

test('demoting an admin takes effect on their existing session', async () => {
  const cookie = await app.login('boss@example.com', PW);
  const boss = app.db.users.find((u) => u.id === 2);
  boss.role = 'student';
  try {
    assert.equal((await app.request('GET', '/admin/stats', { cookie })).status, 403);
  } finally {
    boss.role = 'admin';
  }
});

test('logout revokes the session server-side', async () => {
  const cookie = await app.login('stu@example.com', PW);
  assert.equal((await app.request('GET', '/auth/me', { cookie })).status, 200);
  assert.equal((await app.request('POST', '/auth/logout', { cookie })).status, 200);
  assert.equal((await app.request('GET', '/auth/me', { cookie })).status, 401);
});
