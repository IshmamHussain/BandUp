// Reading module controller.
import * as readingModel from '../models/readingModel.js';
import * as progressModel from '../models/progressModel.js';
import * as userModel from '../models/userModel.js';
import { ok, fail, asyncHandler } from '../utils/helpers.js';
import { isPositiveInt } from '../utils/validate.js';

export const listPassages = asyncHandler(async (req, res) => {
  const passages = await readingModel.listPassages(req.user.id);
  return ok(res, passages);
});

export const getPassage = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid passage id.');
  const passage = await readingModel.getPassageWithQuestions(Number(req.params.id));
  if (!passage) return fail(res, 'Passage not found.', 404);
  return ok(res, passage);
});

export const toggleBookmark = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid passage id.');
  const passageId = Number(req.params.id);
  if (!(await readingModel.passageExists(passageId))) return fail(res, 'Passage not found.', 404);
  const bookmarked = await readingModel.toggleBookmark(req.user.id, passageId);
  return ok(res, { passageId, bookmarked });
});

// Scoring happens HERE, on the server. The browser only ever sends the
// student's answers and receives the verdict - it never holds the answer key.
export const submitAnswers = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid passage id.');
  const passageId = Number(req.params.id);

  const { answers, minutesSpent } = req.body || {};
  if (!Array.isArray(answers) || answers.length === 0) {
    return fail(res, 'No answers were submitted.');
  }

  const answerKey = await readingModel.getAnswerKey(passageId);
  if (answerKey.length === 0) return fail(res, 'Passage not found.', 404);

  const keyById = new Map(answerKey.map((q) => [q.id, q]));
  const results = [];
  const attemptRows = [];

  for (const submitted of answers) {
    const question = keyById.get(Number(submitted.questionId));
    if (!question) continue; // ignore answers for questions not in this passage

    const given = String(submitted.answer ?? '').trim();
    const isCorrect = given.toLowerCase() === question.correct_answer.toLowerCase();

    results.push({
      questionId: question.id,
      givenAnswer: given,
      correctAnswer: question.correct_answer,
      isCorrect,
      explanation: question.explanation,
    });
    attemptRows.push({ questionId: question.id, givenAnswer: given, isCorrect, timeTaken: submitted.timeTaken });
  }

  if (results.length === 0) return fail(res, 'Submitted answers did not match any questions in this passage.');

  await readingModel.saveAttempts(req.user.id, attemptRows);

  const correctCount = results.filter((r) => r.isCorrect).length;
  const minutes = Math.min(Math.max(Number(minutesSpent) || 0, 0), 180); // clamp to sane range
  await progressModel.recordActivity(req.user.id, 'reading', {
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
