const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  "const PlatformPerformance = lazy(() => import('./components/PlatformPerformance'))",
  "const PlatformPerformance = lazy(() => import('./components/PlatformPerformance'))\nconst PlatformFlashcards = lazy(() => import('./components/PlatformFlashcards'))"
);

code = code.replace(
  "<Route path=\"/performance\" element={<PlatformPerformance />} />",
  "<Route path=\"/performance\" element={<PlatformPerformance />} />\n            <Route path=\"/flashcards\" element={<PlatformFlashcards />} />"
);

fs.writeFileSync('src/App.jsx', code);
