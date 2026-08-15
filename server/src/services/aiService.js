import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from '../config/env.js';
import fs from 'fs';

const SYSTEM_PROMPT = `You are a certified IELTS examiner. Evaluate the student's essay strictly against the official IELTS Writing band descriptors.

Respond ONLY with a valid JSON object, no markdown fences, no preamble, using exactly this structure (replace 0.0 with your actual evaluation):
{
  "band_overall": 0.0,
  "criteria": {
    "task_achievement": { "band": 0.0, "comment": "..." },
    "coherence_cohesion": { "band": 0.0, "comment": "..." },
    "lexical_resource": { "band": 0.0, "comment": "..." },
    "grammatical_range_accuracy": { "band": 0.0, "comment": "..." }
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

const SPEAKING_SYSTEM_PROMPT = `You are a certified IELTS examiner. Evaluate the student's spoken audio strictly against the official IELTS Speaking band descriptors. Pay close attention to their speech pattern, stuttering, fluency, vocabulary, grammar, pronunciation, and relevance to the topic.

Respond ONLY with a valid JSON object, no markdown fences, no preamble, using exactly this structure (replace 0.0 with your actual evaluation):
{
  "band_overall": 0.0,
  "criteria": {
    "fluency_and_coherence": { "band": 0.0, "comment": "Analyze their stuttering, hesitations, and flow..." },
    "lexical_resource": { "band": 0.0, "comment": "..." },
    "grammatical_range_accuracy": { "band": 0.0, "comment": "..." },
    "pronunciation": { "band": 0.0, "comment": "Analyze their intonation and clarity..." }
  },
  "grammar_mistakes": [
    { "original": "spoken error", "corrected": "fixed phrase", "explanation": "why" }
  ],
  "pronunciation_issues": [
    { "word": "word", "issue": "how it sounded vs how it should sound" }
  ],
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "transcript": "Provide a rough transcript of what the student said."
}

Rules:
- Bands are in 0.5 steps between 4.0 and 9.0.
- band_overall is the average of the four criteria rounded to the nearest 0.5.
- Be very strict on stuttering and pauses in fluency_and_coherence.`;

function mockEvaluation(essayText) {
  const words = essayText.trim().split(/\s+/).length;
  const base = words < 150 ? 5.0 : words < 250 ? 6.0 : 6.5;
  return {
    band_overall: base,
    criteria: {
      task_achievement: { band: base, comment: '[MOCK]' },
      coherence_cohesion: { band: base, comment: '[MOCK]' },
      lexical_resource: { band: base + 0.5, comment: '[MOCK]' },
      grammatical_range_accuracy: { band: base - 0.5, comment: '[MOCK]' },
    },
    grammar_mistakes: [],
    vocabulary_suggestions: [],
    strengths: ['[MOCK]'],
    improvements: ['[MOCK]'],
    improved_sample_paragraph: '[MOCK]',
  };
}

function mockSpeakingEvaluation() {
  return {
    band_overall: 6.0,
    criteria: {
      fluency_and_coherence: { band: 6.0, comment: '[MOCK] Add a GEMINI_API_KEY to .env for real evaluation.' },
      lexical_resource: { band: 6.0, comment: '[MOCK] Placeholder.' },
      grammatical_range_accuracy: { band: 6.0, comment: '[MOCK] Placeholder.' },
      pronunciation: { band: 6.0, comment: '[MOCK] Placeholder.' },
    },
    grammar_mistakes: [],
    pronunciation_issues: [],
    strengths: ['[MOCK] Configure API key for real feedback.'],
    improvements: ['[MOCK] Configure API key for real feedback.'],
    transcript: '[MOCK] We heard you say something!',
  };
}

export async function evaluateEssay({ taskType, promptText, essayText }) {
  if (!env.ai.apiKey) return { evaluation: mockEvaluation(essayText), isMock: true };
  const userMessage = `Task type: ${taskType === 'task1' ? 'Writing Task 1' : 'Writing Task 2'}\nEssay question: ${promptText || 'Not provided'}\n\nStudent essay:\n"""\n${essayText}\n"""`;
  try {
    const genAI = new GoogleGenerativeAI(env.ai.apiKey);
    const model = genAI.getGenerativeModel({ model: env.ai.model || "gemini-flash-lite-latest", systemInstruction: SYSTEM_PROMPT });
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: userMessage }] }], generationConfig: { responseMimeType: "application/json" } });
    
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object found in response.');
    return { evaluation: JSON.parse(match[0]), isMock: false };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error('The AI evaluator is temporarily unavailable.');
  }
}

export async function evaluateSpeaking({ promptText, audioFilePath, mimeType }) {
  if (!env.ai.apiKey) return { evaluation: mockSpeakingEvaluation(), isMock: true };
  
  const userMessage = `Speaking Prompt:\n"""\n${promptText}\n"""\n\nPlease evaluate the provided audio file.`;
  
  try {
    const genAI = new GoogleGenerativeAI(env.ai.apiKey);
    const model = genAI.getGenerativeModel({ 
      model: env.ai.model || "gemini-1.5-flash", 
      systemInstruction: SPEAKING_SYSTEM_PROMPT 
    });

    const audioData = fs.readFileSync(audioFilePath).toString("base64");
    const audioPart = {
      inlineData: {
        data: audioData,
        mimeType: (mimeType || "audio/webm").split(';')[0]
      }
    };

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userMessage }, audioPart] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const text = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('The AI evaluator returned an unexpected response.');
    
    let evaluation;
    try {
      evaluation = JSON.parse(match[0]);
    } catch {
      throw new Error('The AI evaluator returned an unexpected response.');
    }
    return { evaluation, isMock: false };
  } catch (error) {
    console.error("Gemini Audio API Error:", error);
    throw new Error('The AI evaluator failed to process the audio.');
  }
}

// ── Reading question generation ──────────────────────────────────────

const READING_QUESTIONS_PROMPT = `You are a certified IELTS examiner and question designer. Given a reading passage, generate high-quality IELTS-style questions.

Respond ONLY with a valid JSON object, no markdown fences, no preamble, using exactly this structure:
{
  "questions": [
    {
      "question_type": "mcq",
      "question_text": "What does the author suggest about...?",
      "options_json": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_answer": "B",
      "explanation": "The passage states in paragraph 2 that...",
      "position": 1
    },
    {
      "question_type": "true_false_ng",
      "question_text": "The population increased by 50% between 2000 and 2010.",
      "options_json": ["True", "False", "Not Given"],
      "correct_answer": "False",
      "explanation": "According to paragraph 3, the increase was only 30%...",
      "position": 2
    },
    {
      "question_type": "fill_blank",
      "question_text": "The researchers found that _______ was the primary cause of the decline.",
      "options_json": null,
      "correct_answer": "deforestation",
      "explanation": "Paragraph 4 explicitly mentions deforestation as the primary cause.",
      "position": 3
    }
  ]
}

Rules:
- Generate exactly the number of questions requested.
- Use a realistic mix of question types: mcq, true_false_ng, fill_blank, and matching.
- For MCQ questions, always provide exactly 4 options labeled A) through D).
- For true_false_ng, set options_json to ["True", "False", "Not Given"].
- For fill_blank, set options_json to null. The correct_answer should be a single word or short phrase from the passage.
- For matching, provide a list of items to match as options_json and the correct pairing as correct_answer.
- Questions must be directly answerable from the passage text.
- Explanations must reference specific parts of the passage.
- Order questions by position (1-based).
- Questions should progress from easier to harder.
- Ensure questions test a variety of reading skills: skimming, scanning, inference, detail, and vocabulary in context.`;

function mockReadingQuestions(count) {
  const types = ['mcq', 'true_false_ng', 'fill_blank', 'mcq'];
  const questions = [];
  for (let i = 1; i <= count; i++) {
    const type = types[(i - 1) % types.length];
    questions.push({
      question_type: type,
      question_text: `[MOCK] Sample ${type} question #${i} — configure GEMINI_API_KEY for real generation.`,
      options_json: type === 'mcq'
        ? ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4']
        : type === 'true_false_ng'
          ? ['True', 'False', 'Not Given']
          : null,
      correct_answer: type === 'mcq' ? 'A' : type === 'true_false_ng' ? 'True' : 'answer',
      explanation: '[MOCK] Add a GEMINI_API_KEY to .env for real question generation.',
      position: i,
    });
  }
  return questions;
}

export async function generateReadingQuestions({ passageTitle, passageBody, count = 10 }) {
  if (!env.ai.apiKey) {
    return { questions: mockReadingQuestions(count), isMock: true };
  }

  const userMessage = `Passage title: ${passageTitle}\n\nPassage text:\n"""\n${passageBody}\n"""\n\nGenerate exactly ${count} IELTS reading questions for this passage.`;

  try {
    const genAI = new GoogleGenerativeAI(env.ai.apiKey);
    const model = genAI.getGenerativeModel({
      model: env.ai.model || 'gemini-2.0-flash',
      systemInstruction: READING_QUESTIONS_PROMPT,
    });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object found in response.');
    const parsed = JSON.parse(match[0]);
    return { questions: parsed.questions || parsed, isMock: false };
  } catch (error) {
    console.error('Gemini Reading Questions Error:', error);
    throw new Error('The AI question generator is temporarily unavailable.');
  }
}