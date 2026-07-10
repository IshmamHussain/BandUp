// Vocabulary module controller.
import * as vocabularyModel from '../models/vocabularyModel.js';
import * as progressModel from '../models/progressModel.js';
import * as userModel from '../models/userModel.js';
import { ok, fail, asyncHandler } from '../utils/helpers.js';
import { isPositiveInt } from '../utils/validate.js';

const VALID_STATUSES = ['new', 'learning', 'mastered'];

export const listWords = asyncHandler(async (req, res) => {
  const words = await vocabularyModel.listWords(req.user.id, {
    category: req.query.category || null,
    bookmarkedOnly: req.query.bookmarked === 'true',
    bandLevel: req.query.bandLevel || null,
  });
  return ok(res, words);
});

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await vocabularyModel.listCategories();
  return ok(res, categories);
});

export const setStatus = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid word id.');
  const { status } = req.body || {};
  if (!VALID_STATUSES.includes(status)) {
    return fail(res, `Status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }

  const vocabId = Number(req.params.id);
  if (!(await vocabularyModel.wordExists(vocabId))) return fail(res, 'Word not found.', 404);

  await vocabularyModel.setStatus(req.user.id, vocabId, status);

  // Marking a word as learning/mastered counts as study activity.
  if (status !== 'new') {
    await progressModel.recordActivity(req.user.id, 'vocabulary', { attempted: 1, correct: status === 'mastered' ? 1 : 0 });
    await userModel.touchStreak(req.user.id);
  }
  return ok(res, { vocabId, status });
});

export const toggleBookmark = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid word id.');
  const vocabId = Number(req.params.id);
  if (!(await vocabularyModel.wordExists(vocabId))) return fail(res, 'Word not found.', 404);

  const bookmarked = await vocabularyModel.toggleBookmark(req.user.id, vocabId);
  return ok(res, { vocabId, bookmarked });
});
