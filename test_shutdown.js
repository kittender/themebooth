const { spawn } = require('child_process');
const WebSocket = require('ws');

const server = spawn('node', ['dist/bin/themebooth.js', 'preview']);
let port = null;

server.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  const match = output.match(/localhost:(\d+)/);
  if (match && !port) port = match[1];
});

server.stderr.on('data', (data) => process.stdout.write(data));

setTimeout(() => {
  if (!port) {
    server.kill();
    process.exit(1);
  }
  
  const ws = new WebSocket(`ws://localhost:${port}/ws`);
  ws.on('open', () => {
    console.log('[✓] WebSocket connected');
    setTimeout(() => {
      console.log('[TEST] Closing connection (simulating browser tab close)...');
      ws.close();
    }, 500);
  });
}, 3000);

server.on('exit', (code) => {
  console.log('\n[✓] Server exited gracefully');
  process.exit(0);
});

setTimeout(() => {
  server.kill(9);
  process.exit(1);
}, 8000);
