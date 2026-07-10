// AI writing evaluation service.
// The frontend NEVER talks to the AI API directly - only this server does.
// That keeps the API key secret and lets us control cost and prompts.
//
// If ANTHROPIC_API_KEY is missing (e.g. a teammate developing the UI),
// evaluateEssay returns a clearly-labelled mock so the rest of the app
// still works end to end.
import { env } from '../config/env.js';

const SYSTEM_PROMPT = `You are a certified IELTS examiner. Evaluate the student's essay strictly against the official IELTS Writing band descriptors.

Respond ONLY with a valid JSON object, no markdown fences, no preamble, using exactly this structure:
{
  "band_overall": 6.5,
  "criteria": {
    "task_achievement": { "band": 6.0, "comment": "..." },
    "coherence_cohesion": { "band": 6.5, "comment": "..." },
    "lexical_resource": { "band": 7.0, "comment": "..." },
    "grammatical_range_accuracy": { "band": 6.0, "comment": "..." }
  },
  "grammar_mistakes": [
    { "original": "sentence with error", "corrected": "fixed sentence", "explanation": "why" }
  ],
  "vocabulary_suggestions": [
    { "original": "good", "better": "beneficial", "context": "where it appeared" }
  ],
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "improved_sample_paragraph": "One paragraph of the essay rewritten at band 8 level."
}

Rules:
- Bands are in 0.5 steps between 4.0 and 9.0.
- band_overall is the average of the four criteria rounded to the nearest 0.5.
- Include at most 5 grammar mistakes and 5 vocabulary suggestions (the most important ones).
- Comments must be specific to THIS essay, never generic.
- If the essay is off-topic or under 100 words, reflect that honestly in task_achievement.`;

export async function evaluateEssay({ taskType, promptText, essayText }) {
  if (!env.ai.apiKey) {
    return { evaluation: mockEvaluation(essayText), isMock: true };
  }

  const userMessage = `Task type: ${taskType === 'task1' ? 'Writing Task 1' : 'Writing Task 2'}
Essay question: ${promptText || 'Not provided - evaluate the essay on general merit.'}

Student essay:
"""
${essayText}
"""`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ai.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.ai.model,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('AI API error:', response.status, body.slice(0, 300));
    throw new Error('The AI evaluator is temporarily unavailable. Your essay was saved - please try evaluating again in a minute.');
  }

  const data = await response.json();
  const text = (data.content || [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  // Strip accidental markdown fences before parsing.
  const clean = text.replace(/```json|```/g, '').trim();
  let evaluation;
  try {
    evaluation = JSON.parse(clean);
  } catch {
    console.error('AI returned unparseable JSON:', clean.slice(0, 300));
    throw new Error('The AI evaluator returned an unexpected response. Your essay was saved - please try again.');
  }

  if (typeof evaluation.band_overall !== 'number' || !evaluation.criteria) {
    throw new Error('The AI evaluation was incomplete. Your essay was saved - please try again.');
  }

  return { evaluation, isMock: false };
}

// Deterministic mock used when no API key is configured. Word-count based
// so the UI has realistic-looking data to render during development.
function mockEvaluation(essayText) {
  const words = essayText.trim().split(/\s+/).length;
  const base = words < 150 ? 5.0 : words < 250 ? 6.0 : 6.5;
  return {
    band_overall: base,
    criteria: {
      task_achievement: { band: base, comment: '[MOCK] Add an ANTHROPIC_API_KEY to .env for real evaluation. This placeholder score is based only on word count.' },
      coherence_cohesion: { band: base, comment: '[MOCK] Placeholder comment.' },
      lexical_resource: { band: base + 0.5, comment: '[MOCK] Placeholder comment.' },
      grammatical_range_accuracy: { band: base - 0.5, comment: '[MOCK] Placeholder comment.' },
    },
    grammar_mistakes: [],
    vocabulary_suggestions: [],
    strengths: ['[MOCK] Real strengths will appear here once the AI key is configured.'],
    improvements: ['[MOCK] Real improvement advice will appear here once the AI key is configured.'],
    improved_sample_paragraph: '[MOCK] A band 8 sample paragraph will appear here with a real API key.',
  };
}
