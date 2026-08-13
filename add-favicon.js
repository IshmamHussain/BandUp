const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.html')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'client'));
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (!content.includes('rel="icon"')) {
    content = content.replace('<head>', '<head>\n  <link rel="icon" type="image/png" href="/favicon.png">');
    fs.writeFileSync(f, content);
  }
});
console.log('Done!');
