const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');

function startServer() {
  return spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: '3100', NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

test('health endpoint returns ok', async () => {
  const child = startServer();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const response = await fetch('http://127.0.0.1:3100/health');
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, 'ok');

  child.kill();
});
