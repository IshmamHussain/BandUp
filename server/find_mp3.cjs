const https = require('https');
https.get('https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-practice-tests/listening/section-1', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const match = data.match(/https?:\/\/[^\s\"\'\>]+?\.mp3/gi);
    if (match) console.log('Found:', match);
    else console.log('No MP3 found');
  });
}).on('error', console.error);
