const fs = require('fs');
let code = fs.readFileSync('src/components/PlatformFlashcards.jsx', 'utf8');

code = code.replace(
  "import MCQRenderer from './layout/MCQRenderer'",
  "import MCQRenderer from './MCQRenderer'"
);

fs.writeFileSync('src/components/PlatformFlashcards.jsx', code);
