// Question normalisation and answer checking, shared by reading and listening.
//
// Why this exists (report defect B4): the AI question generator used to
// produce options like "B) Paris" with correct_answer "B", while the test
// page submits the full option text. An exact string comparison then marked
// every AI-generated multiple-choice answer wrong. We now
//   1. store MCQs canonically - plain option text, correct_answer equal to
//      one of the options (normalizeQuestion, used by every write path), and
//   2. compare answers tolerantly - case/whitespace-insensitive, and an MCQ
//      answer given as a letter ("B", "b)", "(B)") counts as that option
//      (isAnswerCorrect), so older or hand-entered rows still mark correctly.

const LETTERS = 'ABCDEFGH';
const LABEL_RE = /^\s*\(?([A-Ha-h])\s*[).:\]-]\s*/;      // "B) ", "(b) ", "C. ", "D: "
const BARE_LETTER_RE = /^\s*\(?([A-Ha-h])\)?[.:]?\s*$/;   // "B", "b)", "(B)", "B."

/** Parse options_json from the DB/API: array, JSON string, or null. */
export function parseOptions(raw) {
  if (raw == null || raw === '') return null;
  let value = raw;
  if (typeof raw === 'string') {
    try { value = JSON.parse(raw); } catch { return null; }
  }
  return Array.isArray(value) ? value.map((o) => String(o)) : null;
}

/** True when every option carries its own sequential label: A) .., B) .., C) .. */
function hasSequentialLabels(options) {
  return options.length > 0 && options.every((opt, i) => {
    const m = LABEL_RE.exec(opt);
    return m && m[1].toUpperCase() === LETTERS[i];
  });
}

const normalizeText = (s) => String(s ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Map an MCQ answer onto one of the (label-free) options, if it refers to
 * one: exact option text, a bare letter, or "B) option text". Otherwise
 * returns the answer unchanged.
 */
function resolveChoice(answer, options) {
  const text = String(answer ?? '').trim();
  if (!options || options.length === 0) return text;
  if (options.some((o) => normalizeText(o) === normalizeText(text))) return text;

  const bare = BARE_LETTER_RE.exec(text);
  if (bare) {
    const idx = LETTERS.indexOf(bare[1].toUpperCase());
    if (idx >= 0 && idx < options.length) return options[idx];
  }
  const labelled = LABEL_RE.exec(text);
  if (labelled) {
    const stripped = text.slice(labelled[0].length);
    const match = options.find((o) => normalizeText(o) === normalizeText(stripped));
    if (match) return match;
  }
  return text;
}

/**
 * Canonical form for storing a question.
 * @returns {{ optionsJson: string[] | null, correctAnswer: string }}
 */
export function normalizeQuestion({ questionType, optionsJson, correctAnswer }) {
  let options = parseOptions(optionsJson);
  let answer = String(correctAnswer ?? '').trim();

  if (options && questionType === 'mcq') {
    if (hasSequentialLabels(options)) {
      options = options.map((o) => o.replace(LABEL_RE, '').trim());
    }
    answer = resolveChoice(answer, options);
  }
  return { optionsJson: options, correctAnswer: answer };
}

/**
 * Is the student's answer correct?
 * @param {{ question_type?: string, options_json?: unknown, correct_answer: string }} question
 * @param {unknown} given
 */
export function isAnswerCorrect(question, given) {
  const isMcq = question.question_type === 'mcq';
  let options = isMcq ? parseOptions(question.options_json) : null;
  if (options && hasSequentialLabels(options)) options = options.map((o) => o.replace(LABEL_RE, '').trim());

  const expected = isMcq ? resolveChoice(question.correct_answer, options) : question.correct_answer;
  const actual = isMcq ? resolveChoice(given, options) : given;
  const a = normalizeText(actual);
  return a !== '' && a === normalizeText(expected);
}

/**
 * Score a submission against an answer key. Shared by reading and listening.
 * Answers for questions outside the test are ignored.
 */
export function scoreAnswers(answerKey, answers) {
  const keyById = new Map(answerKey.map((q) => [q.id, q]));
  const results = [];
  const attemptRows = [];

  for (const submitted of answers) {
    const question = keyById.get(Number(submitted?.questionId));
    if (!question) continue;

    const given = String(submitted.answer ?? '').trim();
    const isCorrect = isAnswerCorrect(question, given);
    results.push({
      questionId: question.id,
      givenAnswer: given,
      correctAnswer: question.correct_answer,
      isCorrect,
      explanation: question.explanation,
    });
    attemptRows.push({ questionId: question.id, givenAnswer: given, isCorrect, timeTaken: submitted.timeTaken });
  }
  return { results, attemptRows };
}
