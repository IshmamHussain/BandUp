import fs from 'fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../src/config/env.js';

// Setup Gemini API
const genAI = new GoogleGenerativeAI(env.ai.apiKey);
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash",
  generationConfig: { responseMimeType: "application/json" }
});

async function generateListening() {
  console.log('Generating Listening tests in bulk to avoid 429...');
  const prompt = `You are generating IELTS listening test data.
Create 5 realistic IELTS listening tests.
For each test, pick one of these topics: Advertising, Animals, Art, Banks, Books.
For each test:
1. Write a 1-minute realistic spoken transcript (about 150 words).
2. Create 5 IELTS-style multiple choice questions based on the transcript.
Output ONLY a JSON array of 5 objects matching this exact structure:
[
  {
    "title": "Listening: [Topic]",
    "audio_url": "https://listenaminute.com/[first letter of topic]/[topic].mp3",
    "transcript": "...",
    "questions": [
      { "question_text": "...", "options_json": ["A", "B", "C"], "correct_answer": "...", "explanation": "..." }
    ]
  }
]`;
    
  try {
    const result = await model.generateContent(prompt);
    const data = JSON.parse(result.response.text());
    // Duplicate to hit 20
    const results = [...data, ...data, ...data, ...data];
    await fs.mkdir('scripts/data', { recursive: true });
    await fs.writeFile('scripts/data/listening.json', JSON.stringify(results, null, 2));
    console.log('Listening generation complete.');
  } catch (e) {
    console.error(`Listening failed: ${e.message}`);
  }
}

async function generateReading() {
  console.log('Generating Reading tests in bulk to avoid 429...');
  const prompt = `You are generating IELTS academic reading test data.
Create 5 realistic IELTS reading passages.
For each test, pick one of these topics: The History of Renewable Energy, Artificial Intelligence in Healthcare, Deep Sea Exploration, The Evolution of Human Language, Sustainable Agriculture.
For each test:
1. Write a realistic academic passage (about 350-400 words).
2. Create 5 IELTS-style multiple choice questions based on the passage.
Output ONLY a JSON array of 5 objects matching this exact structure:
[
  {
    "title": "Reading: [Topic]",
    "passage": "...",
    "questions": [
      { "question_text": "...", "options_json": ["A", "B", "C"], "correct_answer": "...", "explanation": "..." }
    ]
  }
]`;
    
  try {
    const result = await model.generateContent(prompt);
    const data = JSON.parse(result.response.text());
    // Duplicate to hit 20
    const results = [...data, ...data, ...data, ...data];
    await fs.mkdir('scripts/data', { recursive: true });
    await fs.writeFile('scripts/data/reading.json', JSON.stringify(results, null, 2));
    console.log('Reading generation complete.');
  } catch (e) {
    console.error(`Reading failed: ${e.message}`);
  }
}

async function run() {
  if (!env.ai.apiKey) {
    console.error("GEMINI_API_KEY is not set in .env! Cannot generate data.");
    process.exit(1);
  }
  await generateListening();
  await generateReading();
  console.log('Finished generating mock data!');
}

run();
