import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

async function generateMockTests() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: env.db.host,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
  });

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

    for (let i = 1; i <= 20; i++) {
      const pData = readingPassages[i % 2];
      const [passageResult] = await connection.execute(
        `INSERT INTO reading_passages (title, body, passage_type, difficulty, time_limit)
         VALUES (?, ?, 'academic', 'medium', 20)`,
        [`Reading Test ${i}: ${pData.title}`, pData.body]
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

    for (let i = 1; i <= 20; i++) {
      const lData = listeningTests[i % 2];
      const [testResult] = await connection.execute(
        `INSERT INTO listening_tests (title, audio_url, transcript, difficulty, time_limit)
         VALUES (?, ?, ?, 'medium', 30)`,
        [`Listening Test ${i}: ${lData.title}`, lData.url, lData.transcript]
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

    const task1Data = [
      { prompt: 'The line chart below shows internet usage by age group in the UK between 2000 and 2020. Summarise the information.', type: 'line', labels: ['2000', '2005', '2010', '2015', '2020'], data: [10, 30, 50, 75, 95] },
      { prompt: 'The bar chart below shows the top 5 countries by electricity consumption in 2023. Summarise the information.', type: 'bar', labels: ['China', 'USA', 'India', 'Russia', 'Japan'], data: [8000, 4000, 1500, 1000, 900] },
      { prompt: 'The pie chart illustrates the preferred modes of transport for commuters in Paris. Summarise the information.', type: 'doughnut', labels: ['Metro', 'Bus', 'Car', 'Bicycle', 'Walking'], data: [45, 20, 15, 12, 8] },
      { prompt: 'The chart details the number of tourists visiting three different destinations over a year. Summarise the information.', type: 'line', labels: ['Jan', 'Apr', 'Jul', 'Oct'], data: [100, 150, 300, 200] },
      { prompt: 'The bar chart compares the average daily hours spent on social media by teenagers in four countries.', type: 'bar', labels: ['USA', 'UK', 'Japan', 'Brazil'], data: [4.5, 3.8, 2.5, 5.2] },
      { prompt: 'The pie chart gives information about the main reasons why people choose to work from home. Summarise the information.', type: 'doughnut', labels: ['No commute', 'Flexibility', 'Family', 'Productivity'], data: [40, 30, 20, 10] },
      { prompt: 'The graph shows changes in the birth rates of China and the USA from 1950 to 2000. Summarise the information.', type: 'line', labels: ['1950', '1960', '1970', '1980', '1990', '2000'], data: [35, 30, 25, 20, 18, 15] },
      { prompt: 'The chart gives information about water usage across three sectors: Agriculture, Industry, and Domestic. Summarise the information.', type: 'doughnut', labels: ['Agriculture', 'Industry', 'Domestic'], data: [70, 20, 10] },
      { prompt: 'The bar chart details the average monthly rainfall in mm for three cities over a year. Summarise the information.', type: 'bar', labels: ['London', 'New York', 'Sydney'], data: [50, 100, 80] },
      { prompt: 'The line graph details the percentage of the population living in cities in three regions. Summarise the information.', type: 'line', labels: ['1990', '2000', '2010', '2020'], data: [40, 50, 60, 70] },
      { prompt: 'The chart illustrates the sources of funding for higher education in the UK. Summarise the information.', type: 'doughnut', labels: ['Government', 'Tuition', 'Grants', 'Other'], data: [45, 40, 10, 5] },
      { prompt: 'The bar chart shows the percentage of households that owned a car, a washing machine, and a computer in 1980 and 2000. Summarise the information.', type: 'bar', labels: ['Car', 'Washing', 'Computer'], data: [60, 80, 40] },
      { prompt: 'The graph shows the fluctuations in the price of gold per ounce from 2010 to 2020. Summarise the information.', type: 'line', labels: ['2010', '2012', '2014', '2016', '2018', '2020'], data: [1200, 1600, 1300, 1250, 1350, 1800] },
      { prompt: 'The pie chart breaks down the total greenhouse gas emissions by economic sector. Summarise the information.', type: 'doughnut', labels: ['Energy', 'Transport', 'Agriculture', 'Industry'], data: [35, 25, 20, 20] },
      { prompt: 'The bar chart compares the number of hours students spend on homework per week in five countries.', type: 'bar', labels: ['Finland', 'South Korea', 'USA', 'Germany', 'China'], data: [3, 15, 6, 5, 14] },
      { prompt: 'The line chart displays the number of electric vehicles sold globally from 2015 to 2023.', type: 'line', labels: ['2015', '2017', '2019', '2021', '2023'], data: [0.5, 1.2, 2.2, 6.6, 14] },
      { prompt: 'The pie chart reveals the most popular university majors chosen by freshmen in 2022.', type: 'doughnut', labels: ['Business', 'Engineering', 'Arts', 'Sciences'], data: [30, 25, 20, 25] },
      { prompt: 'The bar chart details the average lifespan of various dog breeds. Summarise the information.', type: 'bar', labels: ['Chihuahua', 'Beagle', 'Golden Retriever', 'Bulldog'], data: [15, 12, 11, 8] },
      { prompt: 'The graph illustrates the change in daily temperature during a week in summer. Summarise the information.', type: 'line', labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], data: [22, 25, 28, 26, 23] },
      { prompt: 'The chart describes the market share of major smartphone operating systems. Summarise the information.', type: 'doughnut', labels: ['Android', 'iOS', 'Other'], data: [71, 28, 1] }
    ];

    const task2Data = [
      'Some people believe that universities should focus on preparing students for employment, while others think universities should provide knowledge for its own sake. Discuss both views and give your own opinion.',
      'In many countries, the amount of household waste is increasing. What are the causes of this? What can be done to reduce it?',
      'Some argue that governments should invest more in public transport instead of building new roads. To what extent do you agree or disagree?',
      'Many people believe that social media has a negative impact on young people. To what extent do you agree or disagree?',
      'In some countries, an increasing number of people are choosing to live alone. What are the reasons for this? Is this a positive or negative trend?',
      'Some people think that the best way to reduce crime is to give longer prison sentences. Others believe there are better ways to reduce crime. Discuss both views and give your own opinion.',
      'A growing number of people feel that animals should not be exploited by people and that they should have the same rights as humans. To what extent do you agree or disagree?',
      'In many parts of the world, traditional festivals and customs are disappearing. Why is this happening? What can be done to keep them alive?',
      'Some people believe that unpaid community service should be a compulsory part of high school programmes. To what extent do you agree or disagree?',
      'As computers are being used more and more in education, there will be soon no role for teachers in the classroom. To what extent do you agree or disagree?',
      'Many governments think that economic progress is their most important goal. Some people, however, think that other types of progress are equally important for a country. Discuss both these views and give your own opinion.',
      'Some people think that children should begin learning a foreign language as soon as they start school. Others think they should wait until they reach secondary school. Discuss both views and give your own opinion.',
      'In the modern world, it is possible to shop, work and communicate with people via the internet and live without any face-to-face contact with others. Is this a positive or negative development?',
      'Some people believe that climate change is the most pressing problem facing the world today, while others think there are more urgent issues. Discuss both views and give your own opinion.',
      'Many employers now require employees to work in teams rather than individually. What are the advantages and disadvantages of this trend?',
      'The gap between the rich and the poor is growing in many countries. What problems does this cause? What solutions can you suggest?',
      'Some people think that art is an essential subject for children at school, while others think it is a waste of time. Discuss both views and give your own opinion.',
      'More and more people are choosing to eat healthy food and exercise regularly. What are the reasons for this trend?',
      'Some people believe that history has little or nothing to offer us. Others argue that studying the past helps us to understand the present. Discuss both views and give your own opinion.',
      'In many countries, children are becoming overweight and unhealthy. Some people think that the government should have the responsibility to solve this problem. To what extent do you agree or disagree?'
    ];

    console.log('Generating 20 Writing Tests (Task 1 and Task 2)...');
    for (let i = 1; i <= 20; i++) {
      const t1 = task1Data[i - 1];
      // Task 1
      await connection.execute(
        `INSERT INTO writing_prompts (task_type, prompt_text, category, chart_data)
         VALUES ('task1', ?, ?, ?)`,
        [
          t1.prompt,
          `Test ${i}`, // We use "Test i" as the category
          JSON.stringify({
            type: t1.type,
            data: {
              labels: t1.labels,
              datasets: [{ label: `Data Set`, data: t1.data, backgroundColor: "rgba(13, 148, 136, 0.8)", borderColor: "#0d9488" }]
            },
            options: { responsive: true, maintainAspectRatio: false }
          })
        ]
      );

      // Task 2
      await connection.execute(
        `INSERT INTO writing_prompts (task_type, prompt_text, category)
         VALUES ('task2', ?, ?)`,
        [
          task2Data[i - 1],
          `Test ${i}` // We use "Test i" as the category
        ]
      );
    }

    console.log('Successfully generated and inserted 20 tests for Reading, Listening, and Writing.');

  } catch (err) {
    console.error('Error generating tests:', err);
  } finally {
    await connection.end();
  }
}

generateMockTests();
