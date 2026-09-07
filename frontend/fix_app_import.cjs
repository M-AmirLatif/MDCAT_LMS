const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  "import PlatformPerformance from './pages/PlatformPerformance'",
  "import PlatformPerformance from './pages/PlatformPerformance'\nimport PlatformFlashcards from './components/PlatformFlashcards'"
);

fs.writeFileSync('src/App.jsx', code);
