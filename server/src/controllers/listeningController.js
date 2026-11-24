import * as listeningModel from '../models/listeningModel.js';
import * as readingModel from '../models/readingModel.js';
import * as progressModel from '../models/progressModel.js';
import * as userModel from '../models/userModel.js';
import { ok, fail, asyncHandler, calculateIeltsBand } from '../utils/helpers.js';
import { scoreAnswers } from '../utils/questions.js';
import { isPositiveInt } from '../utils/validate.js';

export const listTests = asyncHandler(async (req, res) => {
  const tests = await listeningModel.listTests(req.user.id);
  return ok(res, tests);
});

export const getTest = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid test id.');
  const test = await listeningModel.getTestWithQuestions(Number(req.params.id));
  if (!test) return fail(res, 'Test not found.', 404);
  return ok(res, test);
});

export const submitAnswers = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid test id.');
  const testId = Number(req.params.id);

  const { answers, minutesSpent } = req.body || {};
  if (!Array.isArray(answers) || answers.length === 0) {
    return fail(res, 'No answers were submitted.');
  }

  const answerKey = await listeningModel.getAnswerKey(testId);
  if (answerKey.length === 0) return fail(res, 'Test not found.', 404);

  const { results, attemptRows } = scoreAnswers(answerKey, answers);

  if (results.length === 0) return fail(res, 'Submitted answers did not match any questions in this test.');

  await readingModel.saveAttempts(req.user.id, attemptRows);

  const correctCount = results.filter((r) => r.isCorrect).length;
  const minutes = Math.min(Math.max(Number(minutesSpent) || 0, 0), 180);
  const bandScore = calculateIeltsBand(correctCount, results.length);

  await Promise.all([
    progressModel.recordActivity(req.user.id, 'listening', {
      minutes,
      attempted: results.length,
      correct: correctCount,
    }),
    userModel.touchStreak(req.user.id),
    userModel.updateBandEstimate(req.user.id, bandScore)
  ]);

  return ok(res, {
    total: results.length,
    correct: correctCount,
    accuracy: Math.round((100 * correctCount) / results.length),
    bandScore,
    results,
  });
});

export const deleteAttempts = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid test id.');
  const testId = Number(req.params.id);
  await listeningModel.deleteAttempts(req.user.id, testId);
  return ok(res, { message: 'Attempts deleted successfully.' });
});
