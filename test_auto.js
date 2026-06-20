const WebSocket = require('ws');
const http = require('http');

const PORT = 45488;
const PROJECT = encodeURIComponent('C:\\创业项目\\4. SUMERU');

// First get auth token
http.get(`http://127.0.0.1:${PORT}/v2/auto?project=${PROJECT}`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const token = data.trim().replace(/"/g, '');
    console.log('Token:', token);

    // Connect WebSocket
    const ws = new WebSocket(`ws://127.0.0.1:${PORT}/v2/auto?token=${token}`);

    ws.on('open', () => {
      console.log('Connected to automation WebSocket');

      // Send command to get page info
      const cmd = JSON.stringify({
        type: 'warn:redirect',
        command: 'getSystemInfo'
      });
      ws.send(cmd);
    });

    ws.on('message', (data) => {
      console.log('Received:', data.toString());
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
    });

    ws.on('close', () => {
      console.log('WebSocket closed');
    });
  });
}).on('error', (err) => {
  console.error('HTTP error:', err.message);
});
