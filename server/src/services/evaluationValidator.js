// Server-side validation of AI (Gemini) evaluations - faculty item 4 / S3.
//
// The model's JSON used to be stored as returned: band_overall was never
// range-checked or compared with the criteria. Now every evaluation (real or
// mock) passes through validateEvaluation() before it is saved:
//   - the expected criteria must all be present with a numeric band,
//     otherwise the evaluation is rejected (and can be retried),
//   - each criterion band is clamped to 0-9 and rounded to a 0.5 step,
//   - band_overall is RECOMPUTED from the criteria (mean, IELTS rounding);
//     if the model's own overall disagrees by more than half a band, the
//     mismatch is recorded in meta.inconsistent,
//   - feedback fields are coerced to the right types and length-capped,
//   - meta records the model name and any adjustments made.
import { HttpError } from '../utils/helpers.js';
import { roundToHalfBand } from './bandEstimate.js';

export const CRITERIA = {
  writing: ['task_achievement', 'coherence_cohesion', 'lexical_resource', 'grammatical_range_accuracy'],
  speaking: ['fluency_and_coherence', 'lexical_resource', 'grammatical_range_accuracy', 'pronunciation'],
};

const MAX_TEXT = 4000;
const text = (v, max = MAX_TEXT) => (typeof v === 'string' ? v : v == null ? '' : String(v)).slice(0, max);
const textList = (v, maxItems = 10) => (Array.isArray(v) ? v : []).slice(0, maxItems).map((x) => text(x, 1000)).filter(Boolean);

function objectList(v, keys, maxItems) {
  return (Array.isArray(v) ? v : [])
    .filter((x) => x && typeof x === 'object')
    .slice(0, maxItems)
    .map((x) => Object.fromEntries(keys.map((k) => [k, text(x[k], 1000)])));
}

function invalid(reason) {
  return new HttpError(503, `The AI evaluator returned an invalid result (${reason}).`);
}

/** Parse a band that may arrive as a number or numeric string. */
function toBand(value) {
  const n = typeof value === 'string' ? Number(value.trim()) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

/**
 * @param {unknown} raw - parsed JSON from the model (or a mock)
 * @param {'writing' | 'speaking'} kind
 * @param {{ model: string, isMock?: boolean }} info
 */
export function validateEvaluation(raw, kind, { model, isMock = false }) {
  const names = CRITERIA[kind];
  if (!names) throw new Error(`Unknown evaluation kind: ${kind}`);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw invalid('not an object');
  if (!raw.criteria || typeof raw.criteria !== 'object') throw invalid('missing criteria');

  const adjustments = [];
  const criteria = {};
  for (const name of names) {
    const c = raw.criteria[name];
    const band = toBand(c && typeof c === 'object' ? c.band : c);
    if (band === null) throw invalid(`missing or non-numeric band for ${name}`);

    const clamped = Math.min(9, Math.max(0, band));
    const rounded = roundToHalfBand(clamped);
    if (rounded !== band) adjustments.push(`${name}: ${band} -> ${rounded}`);
    criteria[name] = { band: rounded, comment: text(c && c.comment) };
  }

  const computed = roundToHalfBand(names.reduce((sum, n) => sum + criteria[n].band, 0) / names.length);
  const reported = toBand(raw.band_overall ?? raw.overall_band);
  const inconsistent = reported === null || Math.abs(reported - computed) > 0.5;

  const evaluation = {
    band_overall: computed,
    criteria,
    grammar_mistakes: objectList(raw.grammar_mistakes, ['original', 'corrected', 'explanation'], 5),
    strengths: textList(raw.strengths),
    improvements: textList(raw.improvements),
  };
  if (kind === 'writing') {
    evaluation.vocabulary_suggestions = objectList(raw.vocabulary_suggestions, ['original', 'better', 'context'], 5);
    evaluation.improved_sample_paragraph = text(raw.improved_sample_paragraph);
  } else {
    evaluation.pronunciation_issues = objectList(raw.pronunciation_issues, ['word', 'issue'], 10);
    evaluation.transcript = text(raw.transcript, 10000);
  }

  evaluation.meta = {
    model: isMock ? 'mock' : model,
    validated_at: new Date().toISOString(),
    reported_band_overall: reported,
    inconsistent,
    adjustments,
  };
  return evaluation;
}
