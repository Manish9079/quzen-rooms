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
  const { data: { request: sentRequest } } = await send.json();

  const senderCannotAcceptOwnRequest = await api(
    `/friends/requests/${sentRequest.id}/accept`,
    first.cookie,
    { method: 'POST' },
  );
  assert.equal(senderCannotAcceptOwnRequest.status, 404);

  const duplicateSend = await api('/friends/requests', first.cookie, {
    method: 'POST',
    body: { toUserId: second.user.id },
  });
  assert.equal(duplicateSend.status, 409);

  const selfSend = await api('/friends/requests', first.cookie, {
    method: 'POST',
    body: { toUserId: first.user.id },
  });
  assert.equal(selfSend.status, 400);

  const outgoing = await api('/friends/requests/sent', first.cookie);
  assert.equal(outgoing.status, 200);
  const { data: { requests: sentRequests } } = await outgoing.json();
  assert.equal(sentRequests.length, 1);
  assert.equal(sentRequests[0].toUserId, second.user.id);

  const incoming = await api('/friends/requests', second.cookie);
  assert.equal(incoming.status, 200);
  const { data: { requests } } = await incoming.json();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].fromUserId, first.user.id);

  const accept = await api(`/friends/requests/${requests[0].id}/accept`, second.cookie, { method: 'POST' });
  assert.equal(accept.status, 200);

  const [friends, secondFriends, incomingAfterAccept, outgoingAfterAccept] = await Promise.all([
    api('/friends', first.cookie),
    api('/friends', second.cookie),
    api('/friends/requests', second.cookie),
    api('/friends/requests/sent', first.cookie),
  ]);
  const { data: { friends: friendList } } = await friends.json();
  assert.equal(friendList.length, 1);
  assert.equal(friendList[0].id, second.user.id);
  assert.equal((await secondFriends.json()).data.friends[0].id, first.user.id);
  assert.deepEqual((await incomingAfterAccept.json()).data.requests, []);
  assert.deepEqual((await outgoingAfterAccept.json()).data.requests, []);

  const remove = await api(`/friends/${friendList[0].friendshipId}`, first.cookie, { method: 'DELETE' });
  assert.equal(remove.status, 200);
  const afterRemove = await api('/friends', second.cookie);
  assert.deepEqual((await afterRemove.json()).data.friends, []);
});

test('a request recipient can reject a request but other users cannot', async () => {
  const suffix = `reject${Date.now()}`;
  const sender = await createAccount(`${suffix}a`);
  const recipient = await createAccount(`${suffix}b`);
  const otherUser = await createAccount(`${suffix}c`);

  const send = await api('/friends/requests', sender.cookie, {
    method: 'POST',
    body: { toUserId: recipient.user.id },
  });
  assert.equal(send.status, 201);
  const { data: { request } } = await send.json();

  const otherUserReject = await api(
    `/friends/requests/${request.id}/reject`,
    otherUser.cookie,
    { method: 'POST' },
  );
  assert.equal(otherUserReject.status, 404);

  const reject = await api(
    `/friends/requests/${request.id}/reject`,
    recipient.cookie,
    { method: 'POST' },
  );
  assert.equal(reject.status, 200);

  const [incoming, outgoing, friends] = await Promise.all([
    api('/friends/requests', recipient.cookie),
    api('/friends/requests/sent', sender.cookie),
    api('/friends', sender.cookie),
  ]);
  assert.deepEqual((await incoming.json()).data.requests, []);
  assert.deepEqual((await outgoing.json()).data.requests, []);
  assert.deepEqual((await friends.json()).data.friends, []);
});