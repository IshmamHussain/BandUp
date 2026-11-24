// Private speaking-audio storage (faculty report item 2).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestApp, UUID } from './helpers/testApp.js';

const PW = 'Pass-word-123';
let app, A, B, ADMIN;

before(async () => {
  app = await startTestApp({
    users: [
      { id: 1, name: 'A', email: 'a@x.com', role: 'student', is_verified: 1, supabase_id: UUID.a, token_version: 0 },
      { id: 2, name: 'B', email: 'b@x.com', role: 'student', is_verified: 1, supabase_id: UUID.b, token_version: 0 },
      { id: 3, name: 'Admin', email: 'admin@x.com', role: 'admin', is_verified: 1, supabase_id: UUID.admin, token_version: 0 },
    ],
    submissions: [
      // Row from before Supabase Storage: its file lived on the wiped local disk.
      { id: 50, user_id: 1, test_id: 1, audio_url: '/media/audio/submissions/old.webm', duration_sec: 10 },
    ],
    authUsers: {
      'a@x.com': { password: PW, id: UUID.a },
      'b@x.com': { password: PW, id: UUID.b },
      'admin@x.com': { password: PW, id: UUID.admin },
    },
  });
  [A, B, ADMIN] = await Promise.all([app.login('a@x.com', PW), app.login('b@x.com', PW), app.login('admin@x.com', PW)]);
});
after(() => app.close());

function upload(cookie, { type = 'audio/webm;codecs=opus', size = 2048, name = 'rec.webm' } = {}) {
  const form = new FormData();
  form.append('testId', '1');
  form.append('durationSec', '30');
  form.append('mimeType', 'text/html'); // client-supplied field: must be ignored
  form.append('promptText', 'Describe your hometown.');
  form.append('audio', new Blob([Buffer.alloc(size, 1)], { type }), name);
  return app.request('POST', '/speaking/submit', { cookie, form });
}
const pathOf = (id) => app.db.submissions.find((s) => s.id === id).audio_url;
const filesOf = (userId) => [...app.supabase.objects.keys()].filter((k) => k.startsWith(`${userId}/`));

test('uploads go to private storage under the user folder, typed from the file', async () => {
  const r = await upload(A);
  assert.equal(r.status, 200, r.text);
  const key = pathOf(r.json.data.submissionId);
  assert.match(key, /^1\/audio-\d+-\d+\.webm$/);
  assert.equal(app.supabase.objects.get(key).type, 'audio/webm');
});

test('non-audio uploads are rejected and nothing is stored', async () => {
  const before = app.supabase.objects.size;
  const r = await upload(A, { type: 'text/html', name: 'page.html' });
  assert.equal(r.status, 400);
  assert.equal(app.supabase.objects.size, before);
});

test('uploads over 25 MB are rejected with 413', async () => {
  assert.equal((await upload(A, { size: 25 * 1024 * 1024 + 1 })).status, 413);
});

test('the API never exposes the raw storage path', async () => {
  const { json } = await upload(A);
  const id = json.data.submissionId;
  const r = await app.request('GET', `/speaking/${id}`, { cookie: A });
  assert.equal(r.json.data.audio_url, `/api/speaking/${id}/audio`);
});

test('the owner is redirected to a 5-minute signed URL that is not cached', async () => {
  const { json } = await upload(A);
  const r = await app.request('GET', `/speaking/${json.data.submissionId}/audio`, { cookie: A });
  assert.equal(r.status, 302, r.text);
  assert.match(r.headers.get('location'), /\/object\/sign\/speaking-audio\/1\/.*token=signed-300$/);
  assert.equal(r.headers.get('cache-control'), 'no-store');
});

test("other students cannot get someone else's recording", async () => {
  const { json } = await upload(A);
  assert.equal((await app.request('GET', `/speaking/${json.data.submissionId}/audio`, { cookie: B })).status, 404);
});

test('logged-out requests get 401', async () => {
  assert.equal((await app.request('GET', '/speaking/50/audio')).status, 401);
});

test('legacy local-disk rows answer 410 and do not leak the old path', async () => {
  assert.equal((await app.request('GET', '/speaking/50/audio', { cookie: A })).status, 410);
  assert.equal((await app.request('GET', '/speaking/50', { cookie: A })).json.data.audio_url, '/api/speaking/50/audio');
});

test('if saving the submission fails, the uploaded file is removed', async () => {
  const before = app.supabase.objects.size;
  app.db.failInserts = true;
  const original = console.error;
  console.error = () => {}; // the 500 is expected; keep test output clean
  try {
    assert.equal((await upload(A)).status, 500);
  } finally {
    app.db.failInserts = false;
    console.error = original;
  }
  assert.equal(app.supabase.objects.size, before);
});

test("deleting a student also deletes all of the student's recordings", async () => {
  await upload(B);
  await upload(B);
  assert.equal(filesOf(2).length, 2);
  const r = await app.request('DELETE', '/admin/students/2', { cookie: ADMIN });
  assert.equal(r.status, 200, r.text);
  assert.equal(filesOf(2).length, 0);
  assert.ok(app.supabase.deletedAuthUsers.includes(UUID.b));
});

test('startup check logs a security error if the bucket is public', async () => {
  const { ensureAudioBucket } = await import('../src/services/storageService.js');
  const logs = [];
  const original = console.error;
  console.error = (...args) => logs.push(args.join(' '));
  app.supabase.bucket = { ...app.supabase.bucket, public: true };
  try {
    await ensureAudioBucket();
  } finally {
    console.error = original;
    app.supabase.bucket = { ...app.supabase.bucket, public: false };
  }
  assert.ok(logs.some((l) => l.includes('SECURITY') && l.includes('PUBLIC')), logs.join('\n'));
});

test('startup check creates a missing bucket as private, audio-only, 25 MB', async () => {
  const { ensureAudioBucket } = await import('../src/services/storageService.js');
  const saved = app.supabase.bucket;
  app.supabase.bucket = null;
  const original = console.log;
  console.log = () => {};
  try {
    await ensureAudioBucket();
  } finally {
    console.log = original;
  }
  const created = app.supabase.createdBucket;
  assert.equal(created.public, false);
  assert.equal(created.file_size_limit, 25 * 1024 * 1024);
  assert.ok(created.allowed_mime_types.includes('audio/webm'));
  app.supabase.bucket = saved;
});
