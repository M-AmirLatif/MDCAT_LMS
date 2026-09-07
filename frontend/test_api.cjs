const https = require('https');
https.get('https://api.acemdcat.com/api/flashcards/stats', (res) => {
  console.log("Status Code:", res.statusCode);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log("Body:", body));
}).on('error', (e) => {
  console.error("Error:", e.message);
});
