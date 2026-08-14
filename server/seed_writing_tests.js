import { pool } from './src/config/db.js';

async function seed() {
  await pool.execute('DELETE FROM writing_prompts');

  const tests = [
    {
      category: 'Academic 15 - Test 1',
      task1: {
        prompt: 'The chart below shows the results of a survey about people’s coffee and tea buying and drinking habits in five Australian cities. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
        chart: {
          type: 'bar',
          data: {
            labels: ['Sydney', 'Melbourne', 'Brisbane', 'Adelaide', 'Hobart'],
            datasets: [
              { label: 'Bought fresh coffee in last 4 weeks', data: [44, 43, 34, 39, 38], backgroundColor: '#0d9488' },
              { label: 'Bought instant coffee in last 4 weeks', data: [46, 48, 53, 50, 54], backgroundColor: '#0284c7' },
              { label: 'Went to a cafe for coffee or tea in last 4 weeks', data: [61, 63, 56, 49, 63], backgroundColor: '#eab308' }
            ]
          },
          options: { responsive: true, scales: { y: { beginAtZero: true, max: 70, title: { display: true, text: 'Percentage of city residents (%)' } } } }
        }
      },
      task2: {
        prompt: 'In some countries, owning a home rather than renting one is very important for people. Why might this be the case? Do you think this is a positive or negative situation? Give reasons for your answer and include any relevant examples from your own knowledge or experience.'
      }
    },
    {
      category: 'Academic 15 - Test 2',
      task1: {
        prompt: 'The graph below shows the number of tourists visiting a particular Caribbean island between 2010 and 2017. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
        chart: {
          type: 'line',
          data: {
            labels: ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017'],
            datasets: [
              { label: 'Visitors staying on cruise ships', data: [0.25, 0.5, 0.5, 0.5, 1.0, 1.2, 1.5, 2.0], borderColor: '#0d9488', fill: false },
              { label: 'Visitors staying on island', data: [0.75, 1.0, 1.25, 1.5, 1.5, 1.5, 1.25, 1.5], borderColor: '#0284c7', fill: false },
              { label: 'Total', data: [1.0, 1.5, 1.75, 2.0, 2.5, 2.7, 2.75, 3.5], borderColor: '#eab308', fill: false }
            ]
          },
          options: { responsive: true, scales: { y: { beginAtZero: true, title: { display: true, text: 'Number of tourists (millions)' } } } }
        }
      },
      task2: {
        prompt: 'In the future, nobody will buy printed newspapers or books because they will be able to read everything they want online without paying. To what extent do you agree or disagree with this statement?'
      }
    },
    {
      category: 'Academic 14 - Test 1',
      task1: {
        prompt: 'The charts below show the average percentages in typical meals of three types of nutrients, all of which may be unhealthy if eaten too much. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
        chart: {
          type: 'bar',
          data: {
            labels: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'],
            datasets: [
              { label: 'Sodium', data: [14, 29, 37, 14], backgroundColor: '#f43f5e' },
              { label: 'Saturated fat', data: [16, 26, 37, 21], backgroundColor: '#eab308' },
              { label: 'Added sugar', data: [16, 19, 23, 42], backgroundColor: '#3b82f6' }
            ]
          },
          options: { responsive: true, scales: { y: { max: 50, title: { display: true, text: 'Percentage (%)' } } } }
        }
      },
      task2: {
        prompt: 'Some people believe that it is best to accept a bad situation, such as an unsatisfactory job or shortage of money. Others argue that it is better to try and improve such situations. Discuss both these views and give your own opinion.'
      }
    },
    {
      category: 'Academic 14 - Test 2',
      task1: {
        prompt: 'The chart below shows the value of one country’s exports in various categories during 2015 and 2016. The table shows the percentage change in each category of exports in 2016 compared with 2015. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
        chart: {
          type: 'bar',
          data: {
            labels: ['Petroleum products', 'Engineered goods', 'Gems and jewellery', 'Agricultural products', 'Textiles'],
            datasets: [
              { label: '2015', data: [61, 58, 43, 31, 26], backgroundColor: '#94a3b8' },
              { label: '2016', data: [63, 62, 41, 32, 30], backgroundColor: '#0f172a' }
            ]
          },
          options: { responsive: true, scales: { y: { title: { display: true, text: 'Export value (billions HK$)' } } } }
        }
      },
      task2: {
        prompt: 'Some people say that environmental problems are too big for individuals to solve. Others say that individuals cannot solve environmental problems unless governments take action. Discuss both views and give your opinion.'
      }
    },
    {
      category: 'Academic 13 - Test 1',
      task1: {
        prompt: 'The two maps below show road access to a city hospital in 2007 and in 2010. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
        chart: null
      },
      task2: {
        prompt: 'Living in a country where you have to speak a foreign language can cause serious social problems, as well as practical problems. To what extent do you agree or disagree with this statement?'
      }
    },
    {
      category: 'Academic 13 - Test 2',
      task1: {
        prompt: 'The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
        chart: {
          type: 'line',
          data: {
            labels: ['1918', '1939', '1953', '1961', '1971', '1981', '1991', '2001', '2011'],
            datasets: [
              { label: 'Households in rented accommodation', data: [78, 68, 68, 59, 50, 41, 32, 31, 35], borderColor: '#f43f5e', fill: false },
              { label: 'Households in owned accommodation', data: [22, 32, 32, 41, 50, 59, 68, 69, 65], borderColor: '#10b981', fill: false }
            ]
          },
          options: { responsive: true, scales: { y: { max: 100, title: { display: true, text: 'Percentage of households (%)' } } } }
        }
      },
      task2: {
        prompt: 'Some people believe that nowadays we have too many choices. To what extent do you agree or disagree with this statement?'
      }
    },
    {
      category: 'Academic 12 - Test 1',
      task1: {
        prompt: 'The bar chart below shows the percentage of Australian men and women in different age groups who did regular physical activity in 2010. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
        chart: {
          type: 'bar',
          data: {
            labels: ['15 to 24', '25 to 34', '35 to 44', '45 to 54', '55 to 64', '65 and over'],
            datasets: [
              { label: 'Men', data: [52.8, 42.2, 39.5, 43.1, 45.1, 46.7], backgroundColor: '#3b82f6' },
              { label: 'Women', data: [47.7, 48.9, 52.5, 53.3, 53.0, 47.1], backgroundColor: '#ec4899' }
            ]
          },
          options: { responsive: true, scales: { y: { max: 60, title: { display: true, text: 'Percentage (%)' } } } }
        }
      },
      task2: {
        prompt: 'It is a natural process for animal species to become extinct (e.g. dinosaurs, dodos, etc.). There is no reason why people should try to prevent this from happening. Do you agree or disagree?'
      }
    },
    {
      category: 'Academic 12 - Test 2',
      task1: {
        prompt: 'The chart below shows the results of a survey on the reasons why people travelled to work by bicycle or by car in a particular city. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
        chart: null
      },
      task2: {
        prompt: 'In a number of countries, some people think it is necessary to spend large sums of money on constructing new railway lines for very fast trains between cities. Others believe the money should be spent on improving existing public transport. Discuss both these views and give your own opinion.'
      }
    },
    {
      category: 'Academic 11 - Test 1',
      task1: {
        prompt: 'The charts below show the percentage of water used for different purposes in six areas of the world. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
        chart: null
      },
      task2: {
        prompt: 'Governments should spend money on railways rather than roads. To what extent do you agree or disagree with this statement?'
      }
    },
    {
      category: 'Academic 11 - Test 2',
      task1: {
        prompt: 'The chart below shows the proportions of British students at one university in England who were able to speak other languages in addition to English, in 2000 and 2010. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
        chart: {
          type: 'bar',
          data: {
            labels: ['No other language', 'French only', 'German only', 'Spanish only', 'Another language', 'Two other languages'],
            datasets: [
              { label: '2000', data: [20, 15, 10, 20, 15, 10], backgroundColor: '#94a3b8' },
              { label: '2010', data: [10, 10, 10, 30, 20, 15], backgroundColor: '#0f172a' }
            ]
          },
          options: { responsive: true, scales: { y: { max: 40, title: { display: true, text: 'Percentage (%)' } } } }
        }
      }
      ,
      task2: {
        prompt: 'Some people claim that not enough of the waste from homes is recycled. They say that the only way to increase recycling is for governments to make it a legal requirement. To what extent do you think laws are needed to make people recycle more of their waste?'
      }
    }
  ];

  for (const t of tests) {
    const chart1Str = t.task1.chart ? JSON.stringify(t.task1.chart) : null;
    await pool.execute(
      'INSERT INTO writing_prompts (category, task_type, prompt_text, chart_data) VALUES (?, ?, ?, ?)',
      [t.category, 'task1', t.task1.prompt, chart1Str]
    );

    await pool.execute(
      'INSERT INTO writing_prompts (category, task_type, prompt_text, chart_data) VALUES (?, ?, ?, ?)',
      [t.category, 'task2', t.task2.prompt, null]
    );
  }

  console.log('Seeded 10 writing tests successfully.');
  process.exit(0);
}

seed().catch(console.error);
