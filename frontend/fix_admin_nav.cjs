const fs = require('fs');
let code = fs.readFileSync('src/lib/platform.js', 'utf8');

// Add to teacher
code = code.replace(
  "{ key: 'students', label: 'Student Attempts', path: '/teacher/students', icon: 'students' },",
  "{ key: 'students', label: 'Student Attempts', path: '/teacher/students', icon: 'students' },\n        { key: 'flashcards', label: 'Flashcards', path: '/flashcards', icon: 'flashcards' },"
);

// Add to admin
code = code.replace(
  "{ key: 'blog', label: 'Blog Manager', path: '/admin/blog', icon: 'courses' },",
  "{ key: 'blog', label: 'Blog Manager', path: '/admin/blog', icon: 'courses' },\n        { key: 'flashcards', label: 'Flashcards', path: '/flashcards', icon: 'flashcards' },"
);

fs.writeFileSync('src/lib/platform.js', code);
