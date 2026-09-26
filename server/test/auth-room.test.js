import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

let server;
let baseUrl;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

test('signup establishes a session, creates a room, and refreshes an expired access cookie', async () => {
  const register = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: 'new-user@example.com',
      username: 'newuser',
      displayName: 'New User',
      password: 'Correct#Password123',
    }),
  });
  assert.equal(register.status, 201);
  const { data: { user } } = await register.json();
  assert.equal(user.email, 'new-user@example.com');
  const cookies = register.headers.getSetCookie().map((header) => header.split(';')[0]);
  const accessCookie = cookies.find((cookie) => cookie.startsWith('accessToken='));
  const refreshCookie = cookies.find((cookie) => cookie.startsWith('refreshToken='));
  assert.ok(accessCookie);
  assert.ok(refreshCookie);

  const createRoom = await fetch(`${baseUrl}/rooms`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: accessCookie },
    body: JSON.stringify({ name: 'Test room', category: 'CHILL', isPrivate: false }),
  });
  assert.equal(createRoom.status, 201, await createRoom.text());

  const expired = await fetch(`${baseUrl}/auth/me`);
  assert.equal(expired.status, 401);
  const refresh = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { cookie: refreshCookie },
  });
  assert.equal(refresh.status, 200);
  const renewedCookie = refresh.headers.getSetCookie()
    .map((header) => header.split(';')[0])
    .find((cookie) => cookie.startsWith('accessToken='));
  assert.ok(renewedCookie);
  const me = await fetch(`${baseUrl}/auth/me`, { headers: { cookie: renewedCookie } });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).data.user.id, user.id);
});
