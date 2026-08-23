// Admin controller — CRUD endpoints for all IELTS modules.
// Protected by requireAuth + requireAdmin middleware in routes.
import * as adminModel from '../models/adminModel.js';
import { generateReadingQuestions } from '../services/aiService.js';
import { ok, fail, asyncHandler } from '../utils/helpers.js';
import { isNonEmptyString, isPositiveInt } from '../utils/validate.js';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// ── Dashboard ────────────────────────────────────────────────────────
export const getStats = asyncHandler(async (req, res) => {
  const stats = await adminModel.getStats();
  return ok(res, stats);
});

// ── Reading passages ─────────────────────────────────────────────────
export const listPassages = asyncHandler(async (req, res) => {
  const passages = await adminModel.listPassages();
  return ok(res, passages);
});

export const createPassage = asyncHandler(async (req, res) => {
  const title = req.body.title;
  const bodyText = req.body.body;
  const passageType = req.body.passage_type || req.body.passageType;
  const difficulty = req.body.difficulty;
  const timeLimit = req.body.time_limit || req.body.timeLimit;
  if (!isNonEmptyString(title)) return fail(res, 'Title is required.');
  if (!isNonEmptyString(bodyText, 100000)) return fail(res, 'Passage body is required.');
  const id = await adminModel.createPassage({ title, body: bodyText, passageType, difficulty, timeLimit });
  return ok(res, { id }, 201);
});

export const updatePassage = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid passage ID.');
  const title = req.body.title;
  const bodyText = req.body.body;
  const passageType = req.body.passage_type || req.body.passageType;
  const difficulty = req.body.difficulty;
  const timeLimit = req.body.time_limit || req.body.timeLimit;
  if (!isNonEmptyString(title)) return fail(res, 'Title is required.');
  if (!isNonEmptyString(bodyText, 100000)) return fail(res, 'Passage body is required.');
  await adminModel.updatePassage(Number(req.params.id), { title, body: bodyText, passageType, difficulty, timeLimit });
  return ok(res, { message: 'Passage updated.' });
});

export const deletePassage = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid passage ID.');
  await adminModel.deletePassage(Number(req.params.id));
  return ok(res, { message: 'Passage deleted.' });
});

// ── AI question generation ───────────────────────────────────────────
export const generatePassageQuestions = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid passage ID.');
  const passage = await adminModel.getPassage(Number(req.params.id));
  if (!passage) return fail(res, 'Passage not found.', 404);

  const count = Math.min(Math.max(Number(req.body?.count) || 10, 1), 20);

  const { questions, isMock } = await generateReadingQuestions({
    passageTitle: passage.title,
    passageBody: passage.body,
    count,
  });

  return ok(res, { questions, isMock });
});

export const bulkCreatePassageQuestions = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid passage ID.');
  const passageId = Number(req.params.id);

  const passage = await adminModel.getPassage(passageId);
  if (!passage) return fail(res, 'Passage not found.', 404);

  const { questions } = req.body || {};
  if (!Array.isArray(questions) || questions.length === 0) {
    return fail(res, 'No questions provided.');
  }

  // Validate each question has minimum required fields
  for (const q of questions) {
    if (!isNonEmptyString(q.question_text, 5000)) return fail(res, 'Each question must have question_text.');
    if (!isNonEmptyString(q.correct_answer)) return fail(res, 'Each question must have correct_answer.');
  }

  const ids = await adminModel.bulkCreateQuestions(passageId, questions);
  return ok(res, { count: ids.length, ids }, 201);
});

// ── Questions (shared by reading + listening) ────────────────────────
export const listPassageQuestions = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid passage ID.');
  const questions = await adminModel.listQuestions({ passageId: Number(req.params.id) });
  return ok(res, questions);
});

export const listTestQuestions = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid test ID.');
  const questions = await adminModel.listQuestions({ listeningTestId: Number(req.params.id) });
  return ok(res, questions);
});

export const createPassageQuestion = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid passage ID.');
  const questionType = req.body.question_type || req.body.questionType;
  const questionText = req.body.question_text || req.body.questionText;
  const optionsJson = req.body.options_json || req.body.optionsJson;
  const correctAnswer = req.body.correct_answer || req.body.correctAnswer;
  const explanation = req.body.explanation;
  const position = req.body.position;
  if (!isNonEmptyString(questionText, 5000)) return fail(res, 'Question text is required.');
  if (!isNonEmptyString(correctAnswer)) return fail(res, 'Correct answer is required.');
  const id = await adminModel.createQuestion({
    passageId: Number(req.params.id), module: 'reading',
    questionType: questionType || 'mcq', questionText, optionsJson, correctAnswer, explanation, position,
  });
  return ok(res, { id }, 201);
});

export const createTestQuestion = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid test ID.');
  const questionType = req.body.question_type || req.body.questionType;
  const questionText = req.body.question_text || req.body.questionText;
  const optionsJson = req.body.options_json || req.body.optionsJson;
  const correctAnswer = req.body.correct_answer || req.body.correctAnswer;
  const explanation = req.body.explanation;
  const position = req.body.position;
  if (!isNonEmptyString(questionText, 5000)) return fail(res, 'Question text is required.');
  if (!isNonEmptyString(correctAnswer)) return fail(res, 'Correct answer is required.');
  const id = await adminModel.createQuestion({
    listeningTestId: Number(req.params.id), module: 'listening',
    questionType: questionType || 'mcq', questionText, optionsJson, correctAnswer, explanation, position,
  });
  return ok(res, { id }, 201);
});

export const updateQuestion = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid question ID.');
  const questionType = req.body.question_type || req.body.questionType;
  const questionText = req.body.question_text || req.body.questionText;
  const optionsJson = req.body.options_json || req.body.optionsJson;
  const correctAnswer = req.body.correct_answer || req.body.correctAnswer;
  const explanation = req.body.explanation;
  const position = req.body.position;
  if (!isNonEmptyString(questionText, 5000)) return fail(res, 'Question text is required.');
  if (!isNonEmptyString(correctAnswer)) return fail(res, 'Correct answer is required.');
  await adminModel.updateQuestion(Number(req.params.id), {
    questionType, questionText, optionsJson, correctAnswer, explanation, position,
  });
  return ok(res, { message: 'Question updated.' });
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid question ID.');
  await adminModel.deleteQuestion(Number(req.params.id));
  return ok(res, { message: 'Question deleted.' });
});

// ── Listening tests ──────────────────────────────────────────────────
export const listTests = asyncHandler(async (req, res) => {
  const tests = await adminModel.listTests();
  return ok(res, tests);
});

export const createTest = asyncHandler(async (req, res) => {
  const title = req.body.title;
  const audioUrl = req.body.audio_url || req.body.audioUrl;
  const transcript = req.body.transcript;
  const difficulty = req.body.difficulty;
  const timeLimit = req.body.time_limit || req.body.timeLimit;
  if (!isNonEmptyString(title)) return fail(res, 'Title is required.');
  if (!isNonEmptyString(audioUrl, 500)) return fail(res, 'Audio URL is required.');
  const id = await adminModel.createTest({ title, audioUrl, transcript, difficulty, timeLimit });
  return ok(res, { id }, 201);
});

export const updateTest = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid test ID.');
  const title = req.body.title;
  const audioUrl = req.body.audio_url || req.body.audioUrl;
  const transcript = req.body.transcript;
  const difficulty = req.body.difficulty;
  const timeLimit = req.body.time_limit || req.body.timeLimit;
  if (!isNonEmptyString(title)) return fail(res, 'Title is required.');
  if (!isNonEmptyString(audioUrl, 500)) return fail(res, 'Audio URL is required.');
  await adminModel.updateTest(Number(req.params.id), { title, audioUrl, transcript, difficulty, timeLimit });
  return ok(res, { message: 'Test updated.' });
});

export const deleteTest = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid test ID.');
  await adminModel.deleteTest(Number(req.params.id));
  return ok(res, { message: 'Test deleted.' });
});

// ── Vocabulary ───────────────────────────────────────────────────────
export const listVocabulary = asyncHandler(async (req, res) => {
  const words = await adminModel.listVocabulary();
  return ok(res, words);
});

export const createWord = asyncHandler(async (req, res) => {
  const word = req.body.word;
  const meaning = req.body.meaning;
  const synonyms = req.body.synonyms;
  const antonyms = req.body.antonyms;
  const exampleSentence = req.body.example_sentence || req.body.exampleSentence;
  const pronunciation = req.body.pronunciation;
  const category = req.body.category;
  const bandLevel = req.body.band_level || req.body.bandLevel;
  if (!isNonEmptyString(word, 100)) return fail(res, 'Word is required.');
  if (!isNonEmptyString(meaning, 5000)) return fail(res, 'Meaning is required.');
  const id = await adminModel.createWord({ word, meaning, synonyms, antonyms, exampleSentence, pronunciation, category, bandLevel });
  return ok(res, { id }, 201);
});

export const updateWord = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid word ID.');
  const word = req.body.word;
  const meaning = req.body.meaning;
  const synonyms = req.body.synonyms;
  const antonyms = req.body.antonyms;
  const exampleSentence = req.body.example_sentence || req.body.exampleSentence;
  const pronunciation = req.body.pronunciation;
  const category = req.body.category;
  const bandLevel = req.body.band_level || req.body.bandLevel;
  if (!isNonEmptyString(word, 100)) return fail(res, 'Word is required.');
  if (!isNonEmptyString(meaning, 5000)) return fail(res, 'Meaning is required.');
  await adminModel.updateWord(Number(req.params.id), { word, meaning, synonyms, antonyms, exampleSentence, pronunciation, category, bandLevel });
  return ok(res, { message: 'Word updated.' });
});

export const deleteWord = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid word ID.');
  await adminModel.deleteWord(Number(req.params.id));
  return ok(res, { message: 'Word deleted.' });
});

// ── Writing prompts ──────────────────────────────────────────────────
export const listPrompts = asyncHandler(async (req, res) => {
  const prompts = await adminModel.listPrompts();
  return ok(res, prompts);
});

export const createPrompt = asyncHandler(async (req, res) => {
  const taskType = req.body.task_type || req.body.taskType;
  const promptText = req.body.prompt_text || req.body.promptText;
  const category = req.body.category;
  const chartData = req.body.chart_data || req.body.chartData;
  if (!['task1', 'task2'].includes(taskType)) return fail(res, 'Task type must be task1 or task2.');
  if (!isNonEmptyString(promptText, 10000)) return fail(res, 'Prompt text is required.');
  const id = await adminModel.createPrompt({ taskType, promptText, category, chartData });
  return ok(res, { id }, 201);
});

export const updatePrompt = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid prompt ID.');
  const taskType = req.body.task_type || req.body.taskType;
  const promptText = req.body.prompt_text || req.body.promptText;
  const category = req.body.category;
  const chartData = req.body.chart_data || req.body.chartData;
  if (!['task1', 'task2'].includes(taskType)) return fail(res, 'Task type must be task1 or task2.');
  if (!isNonEmptyString(promptText, 10000)) return fail(res, 'Prompt text is required.');
  await adminModel.updatePrompt(Number(req.params.id), { taskType, promptText, category, chartData });
  return ok(res, { message: 'Prompt updated.' });
});

export const deletePrompt = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid prompt ID.');
  await adminModel.deletePrompt(Number(req.params.id));
  return ok(res, { message: 'Prompt deleted.' });
});

// ── Speaking prompts ─────────────────────────────────────────────────
export const listSpeakingPrompts = asyncHandler(async (req, res) => {
  const prompts = await adminModel.listSpeakingPrompts();
  return ok(res, prompts);
});

export const createSpeakingPrompt = asyncHandler(async (req, res) => {
  const part = req.body.part;
  const promptText = req.body.prompt_text || req.body.promptText;
  const category = req.body.category;
  if (!['part1', 'part2', 'part3'].includes(part)) return fail(res, 'Invalid speaking part.');
  if (!isNonEmptyString(promptText, 5000)) return fail(res, 'Prompt text is required.');
  const id = await adminModel.createSpeakingPrompt({ part, promptText, category });
  return ok(res, { id }, 201);
});

export const updateSpeakingPrompt = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid prompt ID.');
  const part = req.body.part;
  const promptText = req.body.prompt_text || req.body.promptText;
  const category = req.body.category;
  if (!['part1', 'part2', 'part3'].includes(part)) return fail(res, 'Invalid speaking part.');
  if (!isNonEmptyString(promptText, 5000)) return fail(res, 'Prompt text is required.');
  await adminModel.updateSpeakingPrompt(Number(req.params.id), { part, promptText, category });
  return ok(res, { message: 'Speaking prompt updated.' });
});

export const deleteSpeakingPrompt = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid prompt ID.');
  await adminModel.deleteSpeakingPrompt(Number(req.params.id));
  return ok(res, { message: 'Speaking prompt deleted.' });
});

// ── Students ─────────────────────────────────────────────────────────
export const listStudents = asyncHandler(async (req, res) => {
  const students = await adminModel.listStudents();
  return ok(res, students);
});

export const updateStudent = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid student ID.');
  const name = req.body.name;
  const targetBand = req.body.target_band || req.body.targetBand;
  if (!isNonEmptyString(name, 100)) return fail(res, 'Name is required and must be under 100 characters.');
  await adminModel.updateStudent(Number(req.params.id), { name, targetBand });
  return ok(res, { message: 'Student updated.' });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  if (!isPositiveInt(req.params.id)) return fail(res, 'Invalid student ID.');

  const studentId = Number(req.params.id);
  
  // Find the student's supabase_id to delete them from Auth as well
  const { findById } = await import('../models/userModel.js');
  const student = await findById(studentId);
  
  if (!student) {
    return fail(res, 'Student not found.', 404);
  }

  if (student.supabase_id) {
    if (!supabaseAdmin) {
      return fail(res, 'Cannot delete from Supabase. SUPABASE_SERVICE_ROLE_KEY is missing in Render.', 500);
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(student.supabase_id);
    if (error) {
      console.error('Failed to delete user from Supabase:', error);
      return fail(res, `Supabase delete error: ${error.message}`, 500);
    }
  }

  await adminModel.deleteStudent(studentId);
  return ok(res, { message: 'Student deleted.' });
});
