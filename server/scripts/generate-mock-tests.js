import { pool } from '../src/config/db.js';

async function generateMockTests() {
  console.log('Connecting to database...');
  const connection = pool;

  try {
    console.log('Generating 20 Reading Tests...');
    const readingPassages = [
      {
        title: 'The History of Renewable Energy',
        body: 'Renewable energy has a long and complex history, dating back to ancient times when civilizations harnessed the power of wind and water. In the modern era, the development of solar panels and wind turbines has revolutionized the way we generate electricity. However, the transition from fossil fuels to renewable energy sources remains a significant challenge due to economic and infrastructural constraints. The future of energy depends heavily on continued innovation and global cooperation.',
        questions: [
          { q: 'What is a major challenge in transitioning to renewable energy?', o: ['Economic constraints', 'Lack of wind', 'Too much sun', 'No technology'], a: 'Economic constraints', exp: 'The text mentions economic and infrastructural constraints as significant challenges.' },
          { q: 'Which energy sources are mentioned as being harnessed in ancient times?', o: ['Wind and water', 'Solar and nuclear', 'Coal and oil', 'Geothermal and biomass'], a: 'Wind and water', exp: 'The text states ancient civilizations harnessed the power of wind and water.' }
        ]
      },
      {
        title: 'Artificial Intelligence in Healthcare',
        body: 'Artificial intelligence is rapidly transforming the healthcare industry. From predicting patient outcomes to assisting in complex surgeries, AI algorithms are becoming indispensable tools for medical professionals. Machine learning models can analyze vast amounts of medical data to identify patterns that may be invisible to the human eye. Despite these advancements, ethical concerns regarding data privacy and the potential for algorithmic bias must be carefully addressed.',
        questions: [
          { q: 'What is one ethical concern mentioned regarding AI in healthcare?', o: ['Data privacy', 'Cost of algorithms', 'Lack of doctors', 'Slow processing speed'], a: 'Data privacy', exp: 'The text explicitly mentions ethical concerns regarding data privacy.' },
          { q: 'How do machine learning models assist medical professionals?', o: ['By analyzing vast amounts of data', 'By replacing nurses', 'By printing prescriptions', 'By cleaning hospitals'], a: 'By analyzing vast amounts of data', exp: 'The text states they analyze vast amounts of medical data to identify patterns.' }
        ]
      }
    ];
    for (let i = 0; i < readingPassages.length; i++) {
      const pData = readingPassages[i];
      
      const [testResult] = await connection.execute(
        `INSERT INTO reading_tests (title, difficulty, time_limit)
         VALUES (?, 'medium', 20)`,
        [`Reading Test ${i + 1}: ${pData.title}`]
      );
      const newTestId = testResult.insertId;

      const [passageResult] = await connection.execute(
        `INSERT INTO reading_passages (test_id, title, body, passage_type, difficulty, time_limit)
         VALUES (?, ?, ?, 'academic', 'medium', 20)`,
        [newTestId, `Reading Test ${i + 1}: ${pData.title}`, pData.body]
      );
      const passageId = passageResult.insertId;

      for (let q = 0; q < pData.questions.length; q++) {
        const question = pData.questions[q];
        await connection.execute(
          `INSERT INTO questions (passage_id, module, question_type, question_text, options_json, correct_answer, explanation, position)
           VALUES (?, 'reading', 'mcq', ?, ?, ?, ?, ?)`,
          [passageId, question.q, JSON.stringify(question.o), question.a, question.exp, q + 1]
        );
      }
    }

    console.log('Generating 20 Listening Tests...');
    const listeningTests = [
      {
        title: 'Animals',
        url: 'https://listenaminute.com/a/animals.mp3',
        transcript: 'Animals are wonderful. I really don\'t understand how some people can be cruel to them. I have always loved animals and have had pets ever since I can remember. I think having a pet is very important for children. It teaches them to be responsible and caring. There are so many amazing animals in the world. I love watching nature documentaries to see how they live in the wild.',
        questions: [
          { q: 'What does the speaker think having a pet teaches children?', o: ['Responsibility and caring', 'Math and science', 'How to run fast', 'How to cook'], a: 'Responsibility and caring', exp: 'The speaker states it teaches them to be responsible and caring.' },
          { q: 'What does the speaker love watching?', o: ['Nature documentaries', 'Action movies', 'Sports games', 'News broadcasts'], a: 'Nature documentaries', exp: 'The speaker mentions loving watching nature documentaries.' }
        ]
      },
      {
        title: 'Books',
        url: 'https://listenaminute.com/b/books.mp3',
        transcript: 'I love books. I have hundreds of them in my house. I don\'t have a Kindle or an e-reader because I like the feel of real paper. I love going to bookstores and spending hours looking at all the different titles. I usually read fiction, mostly thrillers and science fiction. I try to read at least one book every week. It\'s a great way to relax before going to sleep.',
        questions: [
          { q: 'Why does the speaker prefer real books?', o: ['They like the feel of real paper', 'They are cheaper', 'They are lighter', 'They have better pictures'], a: 'They like the feel of real paper', exp: 'The speaker explicitly says they like the feel of real paper.' },
          { q: 'What genres does the speaker usually read?', o: ['Thrillers and science fiction', 'Romance and comedy', 'History and biographies', 'Poetry and drama'], a: 'Thrillers and science fiction', exp: 'The speaker states they usually read fiction, mostly thrillers and science fiction.' }
        ]
      }
    ];

    for (let i = 0; i < listeningTests.length; i++) {
      const lData = listeningTests[i];
      const [testResult] = await connection.execute(
        `INSERT INTO listening_tests (title, audio_url, transcript, difficulty, time_limit)
         VALUES (?, ?, ?, 'medium', 30)`,
        [`Listening Test ${i + 1}: ${lData.title}`, lData.url, lData.transcript]
      );
      const testId = testResult.insertId;

      for (let q = 0; q < lData.questions.length; q++) {
        const question = lData.questions[q];
        await connection.execute(
          `INSERT INTO questions (listening_test_id, module, question_type, question_text, options_json, correct_answer, explanation, position)
           VALUES (?, 'listening', 'mcq', ?, ?, ?, ?, ?)`,
          [testId, question.q, JSON.stringify(question.o), question.a, question.exp, q + 1]
        );
      }
    }

    console.log('Successfully generated mock data for Reading and Listening.');
    process.exit(0);
  } catch (err) {
    console.error('Error generating mock tests:', err);
    process.exit(1);
  }
}

generateMockTests();
