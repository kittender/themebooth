const { spawn } = require('child_process');

const server = spawn('node', ['dist/bin/themebooth.js', 'preview']);
let output = '';

server.stdout.on('data', (data) => {
  output += data.toString();
  process.stdout.write(data);
});

server.stderr.on('data', (data) => {
  process.stdout.write(data);
});

// Send SIGINT after server starts
setTimeout(() => {
  console.log('\n[TEST] Sending SIGINT (Ctrl+C)...');
  server.kill('SIGINT');
}, 3000);

server.on('exit', (code, signal) => {
  console.log(`\n[TEST] ✓ Server exited with signal ${signal}, code ${code}`);
  process.exit(0);
});

setTimeout(() => {
  console.error('\n[TEST] ✗ Timeout');
  server.kill(9);
  process.exit(1);
}, 8000);
