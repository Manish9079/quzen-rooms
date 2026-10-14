import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

const origin = 'https://qyzen.online';
let server;
let baseUrl;

before(async () => {
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

test('production origin receives credentialed CORS headers on auth preflight and errors', async () => {
  const preflight = await fetch(`${baseUrl}/auth/me`, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
  });

  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), origin);
  assert.equal(preflight.headers.get('access-control-allow-credentials'), 'true');
  assert.match(preflight.headers.get('access-control-allow-methods'), /\bGET\b/);
  assert.match(preflight.headers.get('access-control-allow-headers'), /\bauthorization\b/i);

  const unauthorized = await fetch(`${baseUrl}/auth/me`, {
    headers: { Origin: origin },
  });

  assert.equal(unauthorized.status, 401);
  assert.equal(unauthorized.headers.get('access-control-allow-origin'), origin);
  assert.equal(unauthorized.headers.get('access-control-allow-credentials'), 'true');
});
