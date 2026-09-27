const http = require('http');
const url = process.env.URL || 'http://127.0.0.1:8000';
const path = '/index.html';

http.get(url + path, (res) => {
  if (res.statusCode !== 200) {
    console.error('Unexpected status:', res.statusCode);
    process.exit(2);
  }
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    const checks = [ /<video/, /id="playPause"/, /id="vignetteList"/, /vignettes\.js/, /app\.js/ ];
    const results = checks.map((rx) => rx.test(body));
    console.log('HTTP smoke results:', results);
    if (results.every(Boolean)) process.exit(0);
    else process.exit(3);
  });
}).on('error', (err) => {
  console.error('HTTP check failed:', err.message);
  process.exit(2);
});
