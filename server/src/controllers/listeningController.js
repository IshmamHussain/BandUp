import * as listeningModel from '../models/listeningModel.js';
import * as progressModel from '../models/progressModel.js';
import * as userModel from '../models/userModel.js';
import { ok, fail, asyncHandler } from '../utils/helpers.js';
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

  const keyById = new Map(answerKey.map((q) => [q.id, q]));
  const results = [];
  const attemptRows = [];

  for (const submitted of answers) {
    const question = keyById.get(Number(submitted.questionId));
    if (!question) continue;

    const given = String(submitted.answer ?? '').trim();
    const isCorrect = given.toLowerCase() === question.correct_answer.toLowerCase();

    results.push({
      questionId: question.id,
      givenAnswer: given,
      correctAnswer: question.correct_answer,
      isCorrect,
      explanation: question.explanation,
    });
    // Record attempts for listening as well (reuse attempts table)
    attemptRows.push({ questionId: question.id, givenAnswer: given, isCorrect, timeTaken: submitted.timeTaken });
  }

  if (results.length === 0) return fail(res, 'Submitted answers did not match any questions in this test.');

  // Import readingModel to reuse saveAttempts which writes to the common attempts table
  const { saveAttempts } = await import('../models/readingModel.js');
  await saveAttempts(req.user.id, attemptRows);

  const correctCount = results.filter((r) => r.isCorrect).length;
  const minutes = Math.min(Math.max(Number(minutesSpent) || 0, 0), 180);
  await progressModel.recordActivity(req.user.id, 'listening', {
    minutes,
    attempted: results.length,
    correct: correctCount,
  });
  await userModel.touchStreak(req.user.id);

  return ok(res, {
    total: results.length,
    correct: correctCount,
    accuracy: Math.round((100 * correctCount) / results.length),
    results,
  });
});

export const deleteAttempts = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid test id.');
  const testId = Number(req.params.id);
  await listeningModel.deleteAttempts(req.user.id, testId);
  return ok(res, { message: 'Attempts deleted successfully.' });
});
