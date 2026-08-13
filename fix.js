const fs = require('fs');
['client/js/pages/speaking.js', 'client/js/pages/speaking-test.js'].forEach(f => {
  let s = fs.readFileSync(f, 'utf8');
  s = s.replace(/\\`/g, '`');
  s = s.replace(/\\\$\{/g, '${');
  fs.writeFileSync(f, s);
});
console.log('Fixed');
