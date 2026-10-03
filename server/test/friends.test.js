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

async function createAccount(suffix) {
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: `${suffix}@example.com`,
      username: suffix,
      displayName: `Friend ${suffix}`,
      password: 'Correct#Password123',
    }),
  });
  assert.equal(response.status, 201);
  const { data: { user } } = await response.json();
  const cookie = response.headers.getSetCookie()
    .map((header) => header.split(';')[0])
    .find((value) => value.startsWith('accessToken='));
  return { user, cookie };
}

async function api(path, cookie, { method = 'GET', body } = {}) {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      cookie,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

test('friends can find each other, accept a request, and remove the friendship', async () => {
  const suffix = `friend${Date.now()}`;
  const first = await createAccount(`${suffix}a`);
  const second = await createAccount(`${suffix}b`);

  const search = await api(`/friends/users?q=${suffix}b`, first.cookie);
  assert.equal(search.status, 200);
  const { data: { users } } = await search.json();
  assert.equal(users.length, 1);
  assert.equal(users[0].id, second.user.id);

  const send = await api('/friends/requests', first.cookie, {
    method: 'POST',
    body: { toUserId: second.user.id },
  });
  assert.equal(send.status, 201);

  const incoming = await api('/friends/requests', second.cookie);
  assert.equal(incoming.status, 200);
  const { data: { requests } } = await incoming.json();
  assert.equal(requests.length, 1);

  const accept = await api(`/friends/requests/${requests[0].id}/accept`, second.cookie, { method: 'POST' });
  assert.equal(accept.status, 200);

  const friends = await api('/friends', first.cookie);
  const { data: { friends: friendList } } = await friends.json();
  assert.equal(friendList.length, 1);
  assert.equal(friendList[0].id, second.user.id);

  const remove = await api(`/friends/${friendList[0].friendshipId}`, first.cookie, { method: 'DELETE' });
  assert.equal(remove.status, 200);
  const afterRemove = await api('/friends', second.cookie);
  assert.deepEqual((await afterRemove.json()).data.friends, []);
});