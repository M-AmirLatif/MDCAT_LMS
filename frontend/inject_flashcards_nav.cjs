const fs = require('fs');
let code = fs.readFileSync('src/lib/platform.js', 'utf8');

code = code.replace(
  "{ key: 'performance', label: 'Performance', path: '/performance', icon: 'performance' },",
  "{ key: 'performance', label: 'Performance', path: '/performance', icon: 'performance' },\n        { key: 'flashcards', label: 'Flashcards', path: '/flashcards', icon: 'flashcards' },"
);

fs.writeFileSync('src/lib/platform.js', code);
