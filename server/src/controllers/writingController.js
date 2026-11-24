// Writing module controller - includes the AI evaluation flow.
import * as writingModel from '../models/writingModel.js';
import * as progressModel from '../models/progressModel.js';
import * as userModel from '../models/userModel.js';
import { evaluateEssay } from '../services/aiService.js';
import { ok, fail, asyncHandler } from '../utils/helpers.js';
import { isPositiveInt } from '../utils/validate.js';

const MAX_ESSAY_CHARS = 10000; // ~1600 words, well above any real IELTS essay

export const listPrompts = asyncHandler(async (req, res) => {
  const prompts = await writingModel.listPrompts();
  return ok(res, prompts);
});

// Flow: save the essay first, then evaluate. If the AI call fails, the
// student's work is already safe in the database and they can retry.
export const submitEssay = asyncHandler(async (req, res) => {
  const { promptId, taskType, essayText } = req.body || {};

  if (!['task1', 'task2'].includes(taskType)) {
    return fail(res, 'Task type must be task1 or task2.');
  }
  if (typeof essayText !== 'string' || essayText.trim().length < 50) {
    return fail(res, 'Your essay is too short to evaluate. Write at least a few sentences.');
  }
  if (essayText.length > MAX_ESSAY_CHARS) {
    return fail(res, 'Your essay is too long. IELTS essays are under 400 words.');
  }

  let prompt = null;
  if (promptId !== undefined && promptId !== null) {
    if (!isPositiveInt(promptId)) return fail(res, 'Invalid prompt id.');
    prompt = await writingModel.getPrompt(Number(promptId));
    if (!prompt) return fail(res, 'Writing prompt not found.', 404);
  }

  const wordCount = essayText.trim().split(/\s+/).length;
  const submissionId = await writingModel.createSubmission(req.user.id, {
    promptId: prompt?.id ?? null,
    taskType,
    essayText: essayText.trim(),
    wordCount,
    status: 'submitted',
  });

  // The essay is saved before the AI call, so if evaluation fails the
  // student's work survives as a 'failed' submission they can retry.
  const { evaluation, isMock } = await evaluateAndSave(req.user.id, {
    id: submissionId, taskType, promptText: prompt?.prompt_text, essayText: essayText.trim(), wordCount,
  });

  return ok(res, { submissionId, wordCount, isMock, evaluation }, 201);
});

/**
 * Evaluate an essay with the AI and store the result. Shared by submit and
 * retry. On failure the submission is marked 'failed' and the error is
 * rethrown (the client sees 503 and can retry from history).
 */
async function evaluateAndSave(userId, { id, taskType, promptText, essayText, wordCount }) {
  let result;
  try {
    result = await evaluateEssay({ taskType, promptText, essayText });
  } catch (err) {
    await writingModel.markFailed(id, err.message);
    if (err.statusCode === 503) {
      err.message = 'The AI evaluator is temporarily unavailable. Your essay was saved - you can retry it from your history.';
    }
    throw err;
  }

  // evaluation was validated in aiService: band_overall is recomputed from
  // the four criteria, each clamped to 0-9 in 0.5 steps.
  const { evaluation, isMock } = result;
  await writingModel.saveEvaluation(id, evaluation.band_overall, evaluation);
  await Promise.all([
    progressModel.recordActivity(userId, 'writing', { minutes: Math.min(40, Math.round(wordCount / 10)), attempted: 1, correct: 1 }),
    userModel.touchStreak(userId),
  ]);
  await userModel.recalculateBandEstimate(userId);
  return { evaluation, isMock };
}

// POST /api/writing/submissions/:id/retry  (B7)
// Re-run the AI evaluation for an essay whose evaluation failed.
export const retryEvaluation = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid submission id.');
  const submission = await writingModel.getSubmission(req.user.id, Number(req.params.id));
  if (!submission) return fail(res, 'Submission not found.', 404);

  // Only failed essays (or ones stuck mid-evaluation for over 2 minutes,
  // e.g. after a server restart) can be re-marked; evaluated essays keep
  // their result.
  const stuck = submission.status === 'submitted' &&
    Date.now() - new Date(submission.created_at).getTime() > 2 * 60 * 1000;
  if (submission.status !== 'failed' && !stuck) {
    return fail(res, 'Only essays whose evaluation failed can be retried.', 409);
  }

  await writingModel.markRetrying(submission.id);
  const { evaluation, isMock } = await evaluateAndSave(req.user.id, {
    id: submission.id,
    taskType: submission.task_type,
    promptText: submission.prompt_text,
    essayText: submission.essay_text,
    wordCount: submission.word_count,
  });
  return ok(res, { submissionId: submission.id, wordCount: submission.word_count, isMock, evaluation });
});

export const listSubmissions = asyncHandler(async (req, res) => {
  const submissions = await writingModel.listSubmissions(req.user.id);
  return ok(res, submissions);
});

export const getSubmission = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid submission id.');
  const submission = await writingModel.getSubmission(req.user.id, Number(req.params.id));
  if (!submission) return fail(res, 'Submission not found.', 404);
  return ok(res, submission);
});

export const getWritingStats = asyncHandler(async (req, res) => {
  const submissions = await writingModel.getWritingStats(req.user.id);

  if (submissions.length === 0) {
    return ok(res, { totalEssays: 0, timeline: [], criteriaAverages: null, avgBand: null, bestBand: null });
  }

  // Timeline for line chart
  const timeline = submissions.map((s) => ({
    date: s.created_at,
    band: Number(s.band_overall),
    taskType: s.task_type,
    category: s.category || 'general',
    wordCount: s.word_count,
  }));

  // Criteria averages for radar chart
  const criteriaKeys = ['task_achievement', 'coherence_cohesion', 'lexical_resource', 'grammatical_range_accuracy'];
  const criteriaSums = {};
  let criteriaCount = 0;
  for (const sub of submissions) {
    const criteria = sub.evaluation_json?.criteria;
    if (!criteria) continue;
    criteriaCount++;
    for (const key of criteriaKeys) {
      if (criteria[key]?.band !== undefined) {
        criteriaSums[key] = (criteriaSums[key] || 0) + Number(criteria[key].band);
      }
    }
  }
  const criteriaAverages = criteriaCount > 0
    ? Object.fromEntries(criteriaKeys.map((k) => [k, Math.round(((criteriaSums[k] || 0) / criteriaCount) * 10) / 10]))
    : null;

  const bands = submissions.map((s) => Number(s.band_overall));
  const avgBand = Math.round((bands.reduce((a, b) => a + b, 0) / bands.length) * 10) / 10;
  const bestBand = Math.max(...bands);

  return ok(res, { totalEssays: submissions.length, avgBand, bestBand, timeline, criteriaAverages });
});

export const deleteSubmission = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid submission id.');
  await writingModel.deleteSubmission(Number(req.params.id), req.user.id);
  await userModel.recalculateBandEstimate(req.user.id);
  return ok(res, { message: 'Submission deleted successfully.' });
});
