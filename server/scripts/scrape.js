import fs from 'fs/promises';

async function scrape() {
  const topics = [
    'a/advertising', 'a/animals', 'a/apples', 'a/art', 'b/banks', 
    'b/books', 'b/business', 'c/cars', 'c/cats', 'c/children', 
    'c/computers', 'd/dogs', 'e/education', 'f/food', 'h/health', 
    'h/history', 'i/internet', 'm/money', 'm/music', 's/science'
  ];

  const results = [];
  for (const t of topics) {
    try {
      const res = await fetch(`https://listenaminute.com/${t}.html`);
      const html = await res.text();
      
      const match = html.match(/<strong>THE READING \/ TAPESCRIPT<\/strong>([\s\S]*?)<div/);
      if (match) {
        let transcript = match[1].replace(/<[^>]+>/g, '').trim();
        transcript = transcript.replace(/\n+/g, ' ');
        // capitalize topic
        let topicName = t.split('/')[1];
        topicName = topicName.charAt(0).toUpperCase() + topicName.slice(1);
        
        results.push({
          title: `Listening: ${topicName}`,
          url: `https://listenaminute.com/${t}.mp3`,
          transcript,
          category: topicName
        });
        console.log(`Successfully scraped ${t}`);
      } else {
        console.log(`Failed to find transcript for ${t}`);
      }
    } catch(err) {
      console.error(err.message);
    }
  }
  
  await fs.writeFile('scraped-listening.json', JSON.stringify(results, null, 2));
}

scrape();
