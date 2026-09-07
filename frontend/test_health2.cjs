const https = require('https');
https.get('https://api.acemdcat.com/api/health', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log("Full body:", body));
}).on('error', e => console.error(e.message));
