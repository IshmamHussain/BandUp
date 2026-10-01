import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../src/config/env.js';
import { pool } from '../src/config/db.js';

const apiKey = env.ai?.apiKey || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: env.ai?.model || "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json"
  }
});

async function generateTest(topic) {
  console.log(`Generating test about ${topic}...`);
  const prompt = `Generate a complete IELTS Academic Reading Practice Test. The theme is ${topic}.
It MUST contain exactly 3 passages.
The total number of questions across all 3 passages MUST be exactly 40.
Passage 1 should have exactly 13 questions.
Passage 2 should have exactly 13 questions.
Passage 3 should have exactly 14 questions.
Include a variety of question types (MCQ, True/False/Not Given, Matching, Fill in the blanks).
Ensure the body text is academic and detailed.

Return the result as a JSON object matching this exact schema:
{
  "title": "Test Title",
  "passages": [
    {
      "title": "Passage Title",
      "body": "Passage text (at least 600 words)...",
      "questions": [
        {
          "type": "mcq", // or "fill_blank", "matching", "true_false"
          "question_text": "The question...",
          "options_json": ["A", "B", "C", "D"], // leave empty array if not applicable
          "correct_answer": "A",
          "explanation": "Why this is correct"
        }
      ]
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  let rawText = response.text().trim();
  if (rawText.startsWith("```json")) {
    rawText = rawText.replace(/^```json\n/, "").replace(/\n```$/, "");
  } else if (rawText.startsWith("```")) {
    rawText = rawText.replace(/^```\n/, "").replace(/\n```$/, "");
  }
  return JSON.parse(rawText);
}

async function run() {
  console.log("Deleting existing reading tests...");
  await pool.execute('DELETE FROM reading_tests'); // Cascade will delete passages and questions

  const themes = [
    "The History of Renewable Energy",
    "Deep Sea Exploration",
    "The Evolution of Human Language",
    "Artificial Intelligence in Medicine",
    "Ancient Roman Architecture",
    "The Psychology of Decision Making",
    "Biodiversity in the Amazon",
    "The Future of Space Colonization"
  ];

  for (let i = 0; i < themes.length; i++) {
    try {
      const testData = await generateTest(themes[i]);
      
      const [testRes] = await pool.execute(
        'INSERT INTO reading_tests (title) VALUES (?)',
        [testData.title || `Reading Practice Test ${i+1}`]
      );
      const testId = testRes.insertId;

      let globalQIndex = 1;
      for (let pIndex = 0; pIndex < testData.passages.length; pIndex++) {
        const passage = testData.passages[pIndex];
        const [passRes] = await pool.execute(
          'INSERT INTO reading_passages (test_id, title, body, position) VALUES (?, ?, ?, ?)',
          [testId, passage.title, passage.body, pIndex + 1]
        );
        const passageId = passRes.insertId;

        for (const q of passage.questions) {
          const opts = (q.options_json && q.options_json.length > 0) ? JSON.stringify(q.options_json) : null;
          
          let qType = 'mcq';
          const aiType = (q.type || '').toLowerCase();
          if (aiType.includes('true') || aiType.includes('false') || aiType.includes('ng') || aiType.includes('given')) {
            qType = 'true_false_ng';
          } else if (aiType.includes('fill') || aiType.includes('blank')) {
            qType = 'fill_blank';
          } else if (aiType.includes('match')) {
            qType = 'matching';
          }
          
          await pool.execute(
            'INSERT INTO questions (passage_id, module, question_type, question_text, options_json, correct_answer, explanation, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [passageId, 'reading', qType, q.question_text, opts, q.correct_answer, q.explanation, globalQIndex++]
          );
        }
      }
      console.log(`Successfully inserted test ${i+1} with ${globalQIndex - 1} questions.`);
    } catch (e) {
      console.error(`Failed to generate/insert test ${i+1}:`, e);
    }
  }

  console.log("Done generating all 8 tests!");
  process.exit(0);
}

run();
