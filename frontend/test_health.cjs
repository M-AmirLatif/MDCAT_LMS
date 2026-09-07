const https = require('https');
https.get('https://api.acemdcat.com/api/health', (res) => {
  console.log("Health Status Code:", res.statusCode);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      console.log("Instance ID:", parsed.instanceId);
      console.log("Started At:", parsed.startedAt);
    } catch(e) {
      console.log("Body:", body.slice(0, 200));
    }
  });
}).on('error', (e) => {
  console.error("Error:", e.message);
});
