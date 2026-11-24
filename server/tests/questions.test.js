// MCQ normalisation and answer checking (report defect B4).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeQuestion, isAnswerCorrect, scoreAnswers, parseOptions } from '../src/utils/questions.js';

const aiMcq = {
  question_type: 'mcq',
  options_json: ['A) Maritime trade', 'B) Grinding grain', 'C) Smelting', 'D) Heating'],
  correct_answer: 'B',
};

test('B4: an AI-style MCQ ("B) ..." options, answer "B") accepts the option text the page submits', () => {
  assert.ok(isAnswerCorrect(aiMcq, 'B) Grinding grain'), 'labelled option text');
  assert.ok(isAnswerCorrect(aiMcq, 'Grinding grain'), 'plain option text');
  assert.ok(isAnswerCorrect(aiMcq, 'b'), 'bare letter');
  assert.ok(!isAnswerCorrect(aiMcq, 'C) Smelting'));
  assert.ok(!isAnswerCorrect(aiMcq, ''));
});

test('B4: questions are stored canonically (labels stripped, letter answer -> option text)', () => {
  const n = normalizeQuestion({ questionType: 'mcq', optionsJson: aiMcq.options_json, correctAnswer: 'B' });
  assert.deepEqual(n.optionsJson, ['Maritime trade', 'Grinding grain', 'Smelting', 'Heating']);
  assert.equal(n.correctAnswer, 'Grinding grain');

  // Options given as a JSON string (admin form) and answer as "(c)"
  const s = normalizeQuestion({ questionType: 'mcq', optionsJson: '["A. One", "B. Two", "C. Three"]', correctAnswer: '(c)' });
  assert.deepEqual(s.optionsJson, ['One', 'Two', 'Three']);
  assert.equal(s.correctAnswer, 'Three');

  // Already canonical: unchanged (so the repair migration is a no-op on good rows)
  const ok = normalizeQuestion({ questionType: 'mcq', optionsJson: ['Rich', 'Good neighbours'], correctAnswer: 'Good neighbours' });
  assert.deepEqual(ok, { optionsJson: ['Rich', 'Good neighbours'], correctAnswer: 'Good neighbours' });
});

test('labels are only stripped when every option is labelled A, B, C... in order', () => {
  const names = normalizeQuestion({ questionType: 'mcq', optionsJson: ['A. Smith', 'J. Jones'], correctAnswer: 'A. Smith' });
  assert.deepEqual(names.optionsJson, ['A. Smith', 'J. Jones']);
  assert.equal(names.correctAnswer, 'A. Smith');
});

test('non-MCQ questions keep exact-text matching (case and spacing insensitive)', () => {
  const blank = { question_type: 'fill_blank', options_json: null, correct_answer: 'science labs' };
  assert.ok(isAnswerCorrect(blank, '  Science   Labs '));
  assert.ok(!isAnswerCorrect(blank, 'B'));
  const tfng = { question_type: 'true_false_ng', options_json: ['True', 'False', 'Not Given'], correct_answer: 'False' };
  assert.ok(isAnswerCorrect(tfng, 'false'));
  assert.ok(!isAnswerCorrect(tfng, 'B'), 'letters only map onto options for MCQs');
});

test('scoreAnswers ignores answers for questions outside the test', () => {
  const key = [{ id: 1, ...aiMcq, explanation: 'x' }];
  const { results, attemptRows } = scoreAnswers(key, [
    { questionId: 1, answer: 'Grinding grain' },
    { questionId: 99, answer: 'anything' },
  ]);
  assert.equal(results.length, 1);
  assert.equal(results[0].isCorrect, true);
  assert.equal(attemptRows.length, 1);
});

test('parseOptions handles arrays, JSON strings and junk', () => {
  assert.deepEqual(parseOptions(['a']), ['a']);
  assert.deepEqual(parseOptions('["a","b"]'), ['a', 'b']);
  assert.equal(parseOptions('not json'), null);
  assert.equal(parseOptions(null), null);
});
