// Pure functions and startup guards: no app server needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import { isValidEmail, isValidPassword, isPositiveInt, isNonEmptyString } from '../src/utils/validate.js';
import { normalizeAudioMime, extensionForMime, mimeForPath } from '../src/services/storageService.js';

test('validators', () => {
  assert.ok(isValidEmail('a@b.co'));
  assert.ok(!isValidEmail('not-an-email'));
  assert.ok(!isValidEmail(`${'a'.repeat(260)}@b.co`), 'longer than 255 chars');

  assert.ok(isValidPassword('abcdefg1'));
  assert.ok(!isValidPassword('abcdefgh'), 'needs a number');
  assert.ok(!isValidPassword('12345678'), 'needs a letter');
  assert.ok(!isValidPassword('a1'), 'too short');

  assert.ok(isPositiveInt('7'));
  assert.ok(!isPositiveInt('0'));
  assert.ok(!isPositiveInt('1.5'));
  assert.ok(!isPositiveInt('abc'));

  assert.ok(isNonEmptyString('x'));
  assert.ok(!isNonEmptyString('   '));
  assert.ok(!isNonEmptyString('abc', 2));
});

test('audio MIME handling', () => {
  assert.equal(normalizeAudioMime('audio/webm;codecs=opus'), 'audio/webm');
  assert.equal(normalizeAudioMime('video/webm'), 'audio/webm', 'Chromium labels audio-only recordings video/webm');
  assert.equal(normalizeAudioMime('AUDIO/MP4'), 'audio/mp4');
  assert.equal(normalizeAudioMime('text/html'), null);
  assert.equal(normalizeAudioMime(undefined), null);

  assert.equal(extensionForMime('audio/mp4'), '.mp4');
  assert.equal(extensionForMime('audio/mpeg'), '.mp3');
  assert.equal(mimeForPath('4/audio-1-2.mp4'), 'audio/mp4');
  assert.equal(mimeForPath('4/audio-1-2.webm'), 'audio/webm');
  assert.equal(mimeForPath('4/no-extension'), 'audio/webm');
});

// env.js calls process.exit, so run it in a child process. cwd is the OS
// temp dir so no developer .env can be picked up.
function startEnv(vars) {
  const envUrl = new URL('../src/config/env.js', import.meta.url).href; // file:// URL on every OS
  return spawnSync(process.execPath, ['-e', `import(${JSON.stringify(envUrl)})`], {
    cwd: os.tmpdir(),
    env: { PATH: process.env.PATH, SYSTEMROOT: process.env.SYSTEMROOT, DB_HOST: 'x', DB_USER: 'x', DB_PASSWORD: '', DB_NAME: 'x', ...vars },
    encoding: 'utf8',
  });
}

test('the server refuses to start with the JWT secret that leaked in Git history', () => {
  const r = startEnv({ NODE_ENV: 'production', JWT_SECRET: '5df6aee4003c66b78815db50496864f2534121f8b56c194fb1c024b5dccc8541' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /leaked/);
});

test('production requires a JWT secret of at least 32 characters', () => {
  assert.equal(startEnv({ NODE_ENV: 'production', JWT_SECRET: 'short' }).status, 1);
  assert.equal(startEnv({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(48) }).status, 0);
});

test('the server refuses to start without JWT_SECRET', () => {
  const r = startEnv({ NODE_ENV: 'production' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /JWT_SECRET/);
});
