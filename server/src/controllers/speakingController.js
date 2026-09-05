import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as speakingModel from '../models/speakingModel.js';
import * as progressModel from '../models/progressModel.js';
import * as userModel from '../models/userModel.js';
import * as aiService from '../services/aiService.js';
import { ok, fail, asyncHandler } from '../utils/helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const getPrompts = asyncHandler(async (req, res) => {
  const prompts = await speakingModel.getPrompts();
  return ok(res, prompts);
});

export const submitAudio = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { testId, durationSec, mimeType, promptText } = req.body;
  
  if (!req.file) {
    return fail(res, 400, 'No audio file uploaded.');
  }

  const audioUrl = `/media/audio/submissions/${req.file.filename}`;
  const submissionId = await speakingModel.createSubmission(userId, testId, audioUrl, durationSec || 0);

  // Run AI Evaluation in the background
  evaluateBackground(userId, submissionId, req.file.path, mimeType, promptText, durationSec || 0).catch(console.error);

  return ok(res, { message: 'Audio submitted successfully. Evaluating...', submissionId });
});

async function evaluateBackground(userId, submissionId, audioFilePath, mimeType, promptText, durationSec) {
  try {
    const { evaluation } = await aiService.evaluateSpeaking({ promptText, audioFilePath, mimeType });
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
  } finally {
    // Optionally clean up the file or leave it for the user to listen back
  }
}

export const getHistory = asyncHandler(async (req, res) => {
  const history = await speakingModel.getUserHistory(req.user.id);
  return ok(res, history);
});

export const getSubmission = asyncHandler(async (req, res) => {
  const submission = await speakingModel.getSubmission(req.params.id, req.user.id);
  if (!submission) return fail(res, 404, 'Submission not found');
  return ok(res, submission);
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await speakingModel.getSpeakingStats(req.user.id);
  return ok(res, stats);
});

export const retryEvaluation = asyncHandler(async (req, res) => {
  const submission = await speakingModel.getSubmission(req.params.id, req.user.id);
  if (!submission) return fail(res, 404, 'Submission not found');
  
  await speakingModel.resetSubmissionEvaluation(submission.id);
  
  const audioFilePath = path.join(__dirname, '../../../client', submission.audio_url);
  const combinedPrompt = submission.part1_prompt 
    ? `Part 1:\n${submission.part1_prompt}\n\nPart 2:\n${submission.part2_prompt}\n\nPart 3:\n${submission.part3_prompt}`
    : submission.prompt_text;
    
  evaluateBackground(req.user.id, submission.id, audioFilePath, 'audio/webm', combinedPrompt, submission.duration_sec).catch(console.error);
  
  return ok(res, { message: 'Re-evaluation started' });
});

export const deleteSubmission = asyncHandler(async (req, res) => {
  await speakingModel.deleteSubmission(req.params.id, req.user.id);
  await userModel.recalculateBandEstimate(req.user.id);
  return ok(res, { message: 'Submission deleted' });
});
