// Route-level checks for report defects B1, B4 and B7, plus the startup
// script (B2). The AI runs in mock mode (no GEMINI_API_KEY).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { startTestApp, UUID } from './helpers/testApp.js';

const PW = 'Pass-word-123';
const ESSAY = 'Some people think that public transport should be free for everyone. '.repeat(5);
const old = new Date(Date.now() - 60 * 60 * 1000).toISOString();
let app, A;

before(async () => {
  app = await startTestApp({
    users: [{ id: 1, name: 'A', email: 'a@x.com', role: 'student', is_verified: 1, supabase_id: UUID.a, token_version: 0 }],
    authUsers: { 'a@x.com': { password: PW, id: UUID.a } },
    essays: [
      { id: 10, user_id: 1, task_type: 'task2', essay_text: ESSAY, word_count: 55, status: 'failed', band_overall: null, evaluation_json: { error: 'x' }, created_at: old, prompt_text: 'Discuss.' },
      { id: 11, user_id: 1, task_type: 'task2', essay_text: ESSAY, word_count: 55, status: 'evaluated', band_overall: 6.5, evaluation_json: {}, created_at: old, prompt_text: 'Discuss.' },
      { id: 12, user_id: 1, task_type: 'task2', essay_text: ESSAY, word_count: 55, status: 'submitted', band_overall: null, evaluation_json: null, created_at: old, prompt_text: 'Discuss.' },
    ],
    questions: [
      // Shapes the old AI generator produced (B4)
      { id: 1, listening_test_id: 7, question_type: 'mcq', options_json: ['A) Rice', 'B) Wheat', 'C) Maize'], correct_answer: 'B', explanation: '' },
      { id: 2, listening_test_id: 7, question_type: 'fill_blank', options_json: null, correct_answer: 'society', explanation: '' },
    ],
  });
  A = await app.login('a@x.com', PW);
});
after(() => app?.close()); // app is undefined if before() failed

test('B1: speaking submit without a file is a 400, not a 500', async () => {
  const form = new FormData();
  form.append('testId', '1');
  const r = await app.request('POST', '/speaking/submit', { cookie: A, form });
  assert.equal(r.status, 400);
  assert.equal(r.json.error, 'No audio file uploaded.');
});

test('B1: unknown speaking submission is a 404, not a 500', async () => {
  for (const path of ['/speaking/99999', '/speaking/99999/audio']) {
    assert.equal((await app.request('GET', path, { cookie: A })).status, 404, path);
  }
  assert.equal((await app.request('POST', '/speaking/99999/retry', { cookie: A })).status, 404);
});

test('B4: listening MCQ answered with the option text the page submits is marked correct', async () => {
  const r = await app.request('POST', '/listening/tests/7/submit', {
    cookie: A,
    body: { answers: [{ questionId: 1, answer: 'B) Wheat' }, { questionId: 2, answer: 'Society ' }], minutesSpent: 3 },
  });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json.data.correct, 2);
  assert.deepEqual(r.json.data.results.map((x) => x.isCorrect), [true, true]);
});

test('B7: a failed essay can be retried and becomes evaluated', async () => {
  const r = await app.request('POST', '/writing/submissions/10/retry', { cookie: A });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json.data.isMock, true);
  const essay = app.db.essays.find((e) => e.id === 10);
  assert.equal(essay.status, 'evaluated');
  assert.ok(Number(essay.band_overall) > 0);
});

test('B7: an essay stuck in "submitted" (e.g. after a restart) can be retried', async () => {
  assert.equal((await app.request('POST', '/writing/submissions/12/retry', { cookie: A })).status, 200);
});

test('B7: an evaluated essay cannot be re-marked; unknown essays are 404', async () => {
  assert.equal((await app.request('POST', '/writing/submissions/11/retry', { cookie: A })).status, 409);
  assert.equal((await app.request('POST', '/writing/submissions/999/retry', { cookie: A })).status, 404);
  assert.equal((await app.request('POST', '/writing/submissions/abc/retry', { cookie: A })).status, 400);
});

test('B2: the start script only starts the server (no data-rewriting scripts)', () => {
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.scripts.start, 'node server.js');
  assert.ok(!fs.existsSync(new URL('../scripts/run-prod-fixes.js', import.meta.url)));
});
