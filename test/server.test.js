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

test('admin login succeeds with valid credentials', async () => {
  const child = startServer();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const response = await fetch('http://127.0.0.1:3100/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Admin@123' })
  });

  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.user.role, 'admin');

  child.kill();
});
