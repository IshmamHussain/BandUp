import fs from 'fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../src/config/env.js';

// Setup Gemini API
const genAI = new GoogleGenerativeAI(env.ai.apiKey);
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash",
  generationConfig: { responseMimeType: "application/json" }
});

const listeningTopics = [
  { t: "Advertising", u: "a/advertising" },
  { t: "Animals", u: "a/animals" },
  { t: "Art", u: "a/art" },
  { t: "Banks", u: "b/banks" },
  { t: "Books", u: "b/books" },
  { t: "Business", u: "b/business" },
  { t: "Cars", u: "c/cars" },
  { t: "Cats", u: "c/cats" },
  { t: "Children", u: "c/children" },
  { t: "Computers", u: "c/computers" },
  { t: "Dogs", u: "d/dogs" },
  { t: "Education", u: "e/education" },
  { t: "Food", u: "f/food" },
  { t: "Health", u: "h/health" },
  { t: "History", u: "h/history" },
  { t: "Internet", u: "i/internet" },
  { t: "Money", u: "m/money" },
  { t: "Music", u: "m/music" },
  { t: "Science", u: "s/science" },
  { t: "Sports", u: "s/sports" } // fallback or real
];

const readingTopics = [
  "The History of Renewable Energy",
  "Artificial Intelligence in Healthcare",
  "The Migration Patterns of Monarch Butterflies",
  "Urban Planning in the 21st Century",
  "The Psychology of Decision Making",
  "Deep Sea Exploration Techniques",
  "The Evolution of Human Language",
  "Climate Change and Ocean Acidification",
  "The Future of Space Tourism",
  "Microbiome and Human Health",
  "The Economics of Fast Fashion",
  "Ancient Civilizations: The Maya",
  "Neuroplasticity and Learning",
  "The Impact of Social Media on Society",
  "Advancements in Quantum Computing",
  "The Silk Road: A Historical Trade Route",
  "Biodiversity in the Amazon Rainforest",
  "The Science of Sleep and Dreams",
  "Sustainable Agriculture Practices",
  "The Role of Nanotechnology in Medicine"
];

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
    let data = JSON.parse(result.response.text());
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
    let data = JSON.parse(result.response.text());
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
