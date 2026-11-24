// Band estimate aggregation and AI evaluation validation (faculty item 4).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roundToHalfBand, moduleBand, estimateBand, RECENT_RESULTS_PER_MODULE } from '../src/services/bandEstimate.js';
import { validateEvaluation } from '../src/services/evaluationValidator.js';

test('IELTS rounding: .25 and .75 round up, anything below rounds down', () => {
  assert.equal(roundToHalfBand(6.25), 6.5);
  assert.equal(roundToHalfBand(6.75), 7.0);
  assert.equal(roundToHalfBand(6.125), 6.0);
  assert.equal(roundToHalfBand(6.6), 6.5);
  assert.equal(roundToHalfBand((6.5 + 6 + 6 + 6.5) / 4), 6.5); // 6.25
});

test('B3: one short passage cannot swing the module band', () => {
  // newest first: a perfect 2-question passage after a full 40-question test at 5.5
  const band = moduleBand('reading', [
    { band: 9.0, total: 2 },
    { band: 5.5, total: 40 },
  ]).band;
  assert.equal(band, 5.5, 'weighted by question count: (9*2 + 5.5*40) / 42 = 5.67 -> 5.5');
});

test('only the most recent results per module count', () => {
  const results = [
    ...Array.from({ length: RECENT_RESULTS_PER_MODULE }, () => ({ band: 7.0 })),
    { band: 4.0 }, { band: 4.0 }, // older, outside the window
  ];
  assert.deepEqual(moduleBand('speaking', results), { band: 7.0, count: RECENT_RESULTS_PER_MODULE });
});

test('writing: Task 2 counts double', () => {
  const { band } = moduleBand('writing', [{ band: 7.0, taskType: 'task2' }, { band: 5.5, taskType: 'task1' }]);
  assert.equal(band, 6.5); // (14 + 5.5) / 3 = 6.5
});

test('overall is the mean of module bands, IELTS-rounded; empty modules are skipped', () => {
  const est = estimateBand({
    reading: [{ band: 7.0, total: 40 }],
    listening: [{ band: 6.5, total: 40 }],
    writing: [{ band: 6.0, taskType: 'task2' }],
    speaking: [{ band: 6.0 }],
  });
  assert.equal(est.overall, 6.5); // 25.5 / 4 = 6.375 -> 6.5
  assert.equal(est.modulesCounted, 4);

  const partial = estimateBand({ reading: [{ band: 7.0, total: 13 }], speaking: [] });
  assert.equal(partial.overall, 7.0);
  assert.equal(partial.modules.speaking.band, null);
  assert.equal(partial.modulesCounted, 1);

  assert.equal(estimateBand({}).overall, null);
});

// ---------------------------------------------------------------- validator

const writing = (criteria, extra = {}) => ({
  band_overall: 7.0,
  criteria: Object.fromEntries(Object.entries(criteria).map(([k, band]) => [k, { band, comment: `about ${k}` }])),
  ...extra,
});
const W = { task_achievement: 6.5, coherence_cohesion: 7, lexical_resource: 7, grammatical_range_accuracy: 6.5 };

test('band_overall is recomputed from the criteria, not trusted', () => {
  const ev = validateEvaluation(writing(W, { band_overall: 9 }), 'writing', { model: 'gemini-test' });
  assert.equal(ev.band_overall, 7.0); // 27 / 4 = 6.75 -> 7.0
  assert.equal(ev.meta.reported_band_overall, 9);
  assert.equal(ev.meta.inconsistent, true, 'model said 9, criteria say 7');
  assert.equal(ev.meta.model, 'gemini-test');
});

test('a consistent evaluation is not flagged', () => {
  const ev = validateEvaluation(writing(W, { band_overall: 7.0 }), 'writing', { model: 'm' });
  assert.equal(ev.meta.inconsistent, false);
  assert.deepEqual(ev.meta.adjustments, []);
});

test('criterion bands are clamped to 0-9 and rounded to 0.5 steps', () => {
  const ev = validateEvaluation(writing({ ...W, task_achievement: 12, lexical_resource: '6.8', coherence_cohesion: -3 }), 'writing', { model: 'm' });
  assert.equal(ev.criteria.task_achievement.band, 9);
  assert.equal(ev.criteria.lexical_resource.band, 7);
  assert.equal(ev.criteria.coherence_cohesion.band, 0);
  assert.equal(ev.meta.adjustments.length, 3);
});

test('missing or non-numeric criteria reject the evaluation (so it can be retried)', () => {
  const missing = { ...W };
  delete missing.lexical_resource;
  assert.throws(() => validateEvaluation(writing(missing), 'writing', { model: 'm' }), /lexical_resource/);
  assert.throws(() => validateEvaluation(writing({ ...W, task_achievement: 'nine' }), 'writing', { model: 'm' }), /task_achievement/);
  assert.throws(() => validateEvaluation('not json', 'writing', { model: 'm' }), /not an object/);
  assert.throws(() => validateEvaluation({ band_overall: 9 }, 'writing', { model: 'm' }), /missing criteria/);
});

test('speaking uses the four speaking criteria and keeps the transcript', () => {
  const raw = {
    band_overall: 6,
    criteria: { fluency_and_coherence: { band: 6 }, lexical_resource: { band: 6 }, grammatical_range_accuracy: { band: 6.5 }, pronunciation: { band: 5.5 } },
    transcript: 'Hello',
    pronunciation_issues: [{ word: 'th', issue: 'x' }],
  };
  const ev = validateEvaluation(raw, 'speaking', { model: 'm' });
  assert.equal(ev.band_overall, 6.0);
  assert.equal(ev.transcript, 'Hello');
  assert.equal(ev.pronunciation_issues.length, 1);
  assert.throws(() => validateEvaluation(writing(W), 'speaking', { model: 'm' }), /fluency_and_coherence/);
});

test('feedback lists are type-checked and capped', () => {
  const many = Array.from({ length: 20 }, (_, i) => ({ original: `o${i}`, corrected: `c${i}`, explanation: 'e' }));
  const ev = validateEvaluation(writing(W, { grammar_mistakes: [...many, 'junk', null], strengths: 'not a list' }), 'writing', { model: 'm' });
  assert.equal(ev.grammar_mistakes.length, 5);
  assert.deepEqual(ev.strengths, []);
});

test('mock evaluations are labelled as such', () => {
  assert.equal(validateEvaluation(writing(W), 'writing', { model: 'm', isMock: true }).meta.model, 'mock');
});
