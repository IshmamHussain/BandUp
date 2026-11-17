import * as speakingModel from '../models/speakingModel.js';
import * as progressModel from '../models/progressModel.js';
import * as userModel from '../models/userModel.js';
import * as aiService from '../services/aiService.js';
import * as storage from '../services/storageService.js';
import { ok, fail, asyncHandler } from '../utils/helpers.js';

export const getPrompts = asyncHandler(async (req, res) => {
  const prompts = await speakingModel.getPrompts();
  return ok(res, prompts);
});

export const submitAudio = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { testId, durationSec, mimeType, promptText } = req.body;

  if (!req.file) {
    return fail(res, 'No audio file uploaded.', 400);
  }

  // Build a filename the same way the old multer disk storage did
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  let ext = '.webm';
  if (req.file.mimetype?.includes('mp4') || req.file.mimetype?.includes('m4a')) ext = '.mp4';
  else if (req.file.mimetype?.includes('mp3')) ext = '.mp3';
  else if (req.file.mimetype?.includes('wav')) ext = '.wav';
  const filename = `audio-${uniqueSuffix}${ext}`;

  // Upload to Supabase Storage (private bucket)
  const storagePath = await storage.uploadAudio(
    req.file.buffer, filename, mimeType || req.file.mimetype, userId
  );

  // Store the Supabase storage path (e.g. "4/audio-17000…-12345.webm")
  const submissionId = await speakingModel.createSubmission(userId, testId, storagePath, durationSec || 0);

  // Run AI Evaluation in the background using the buffer we already have
  evaluateBackground(userId, submissionId, req.file.buffer, mimeType || req.file.mimetype, promptText, durationSec || 0)
    .catch(console.error);

  return ok(res, { message: 'Audio submitted successfully. Evaluating...', submissionId });
});

/**
 * Run AI evaluation in the background.
 * Accepts a Buffer directly so we don't need to touch the filesystem.
 */
async function evaluateBackground(userId, submissionId, audioBuffer, mimeType, promptText, durationSec) {
  try {
    const { evaluation } = await aiService.evaluateSpeakingFromBuffer({ promptText, audioBuffer, mimeType });
    const minutes = Math.max(1, Math.round((durationSec || 0) / 60));
    await Promise.all([
      speakingModel.updateSubmissionEvaluation(submissionId, evaluation.band_overall, evaluation),
      progressModel.recordActivity(userId, 'speaking', { minutes, attempted: 1, correct: 1 }),
      userModel.touchStreak(userId),
      userModel.updateBandEstimate(userId, evaluation.band_overall)
    ]);
  } catch (error) {
    console.error('Failed to evaluate speaking submission:', error);
    await speakingModel.updateSubmissionEvaluation(submissionId, null, { error: error.message });
  }
}

export const getHistory = asyncHandler(async (req, res) => {
  const history = await speakingModel.getUserHistory(req.user.id);
  return ok(res, history);
});

export const getSubmission = asyncHandler(async (req, res) => {
  const submission = await speakingModel.getSubmission(req.params.id, req.user.id);
  if (!submission) return fail(res, 'Submission not found', 404);

  // Replace raw storage path with an API URL the frontend can use
  if (submission.audio_url && !submission.audio_url.startsWith('/media/')) {
    submission.audio_url = `/api/speaking/${submission.id}/audio`;
  }

  return ok(res, submission);
});

/**
 * GET /api/speaking/:id/audio
 * Generates a short-lived signed URL and redirects the browser to it.
 * The <audio> element follows the redirect transparently.
 */
export const getAudioUrl = asyncHandler(async (req, res) => {
  const submission = await speakingModel.getSubmission(req.params.id, req.user.id);
  if (!submission) return fail(res, 'Submission not found', 404);

  const audioPath = submission.audio_url;

  // Legacy local files (old /media/... paths) — not in Supabase
  if (!audioPath || audioPath.startsWith('/media/')) {
    return fail(res, 'Audio file is no longer available (legacy local storage).', 410);
  }

  const signedUrl = await storage.getSignedUrl(audioPath, 300); // 5-minute URL
  return res.redirect(signedUrl);
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await speakingModel.getSpeakingStats(req.user.id);
  return ok(res, stats);
});

export const retryEvaluation = asyncHandler(async (req, res) => {
  const submission = await speakingModel.getSubmission(req.params.id, req.user.id);
  if (!submission) return fail(res, 'Submission not found', 404);

  await speakingModel.resetSubmissionEvaluation(submission.id);

  const audioPath = submission.audio_url;

  if (!audioPath || audioPath.startsWith('/media/')) {
    return fail(res, 'Audio file is no longer available for re-evaluation.', 410);
  }

  // Download from Supabase Storage to get the buffer for Gemini
  const audioBuffer = await storage.downloadAudio(audioPath);
  const combinedPrompt = submission.part1_prompt
    ? `Part 1:\n${submission.part1_prompt}\n\nPart 2:\n${submission.part2_prompt}\n\nPart 3:\n${submission.part3_prompt}`
    : submission.prompt_text;

  evaluateBackground(req.user.id, submission.id, audioBuffer, 'audio/webm', combinedPrompt, submission.duration_sec)
    .catch(console.error);

  return ok(res, { message: 'Re-evaluation started' });
});

export const deleteSubmission = asyncHandler(async (req, res) => {
  const submission = await speakingModel.getSubmission(req.params.id, req.user.id);
  if (submission && submission.audio_url) {
    // Clean up the file from Supabase Storage
    await storage.deleteAudio(submission.audio_url);
  }
  await speakingModel.deleteSubmission(req.params.id, req.user.id);
  await userModel.recalculateBandEstimate(req.user.id);
  return ok(res, { message: 'Submission deleted' });
});
