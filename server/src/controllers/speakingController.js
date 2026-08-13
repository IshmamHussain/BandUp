import fs from 'fs';
import path from 'path';
import * as speakingModel from '../models/speakingModel.js';
import * as aiService from '../services/aiService.js';
import { ok, fail, asyncHandler } from '../utils/helpers.js';

export const getPrompts = asyncHandler(async (req, res) => {
  const prompts = await speakingModel.getPrompts();
  return ok(res, prompts);
});

export const submitAudio = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { promptId, durationSec, mimeType, promptText } = req.body;
  
  if (!req.file) {
    return fail(res, 400, 'No audio file uploaded.');
  }

  const audioUrl = `/media/audio/submissions/${req.file.filename}`;
  const submissionId = await speakingModel.createSubmission(userId, promptId, audioUrl, durationSec || 0);

  // Run AI Evaluation in the background
  evaluateBackground(submissionId, req.file.path, mimeType, promptText).catch(console.error);

  return ok(res, { message: 'Audio submitted successfully. Evaluating...', submissionId });
});

async function evaluateBackground(submissionId, audioFilePath, mimeType, promptText) {
  try {
    const { evaluation } = await aiService.evaluateSpeaking({ promptText, audioFilePath, mimeType });
    await speakingModel.updateSubmissionEvaluation(submissionId, evaluation.band_overall, evaluation);
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
