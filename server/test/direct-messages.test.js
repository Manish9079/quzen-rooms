import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { io as createSocketClient } from 'socket.io-client';
import { createApp } from '../src/app.js';
import { initSocket } from '../src/socket/index.js';

let server;
let io;
let baseUrl;
const sockets = new Set();

before(async () => {
  const app = createApp();
  server = createServer(app);
  io = initSocket(server);
  app.set('io', io);
  server.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  for (const socket of sockets) socket.disconnect();
  if (io) await new Promise((resolve) => io.close(resolve));
});

async function connectSocket(cookie) {
  const socket = createSocketClient(baseUrl.replace(/\/api$/, ''), {
    transports: ['websocket'],
    extraHeaders: { Cookie: cookie, Origin: 'https://qyzen.online' },
  });
  sockets.add(socket);
  await new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
  });
  return socket;
}

async function createAccount(username) {
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: `${username}@example.com`,
      username,
      displayName: username,
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
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

test('direct messages persist for friends, enforce access, track reads, and clear per user', async () => {
  const suffix = `dm${Date.now()}`;
  const sender = await createAccount(`${suffix}a`);
  const recipient = await createAccount(`${suffix}b`);
  const stranger = await createAccount(`${suffix}c`);

  const request = await api('/friends/requests', sender.cookie, {
    method: 'POST',
    body: { toUserId: recipient.user.id },
  });
  assert.equal(request.status, 201);
  const { data: { request: friendRequest } } = await request.json();
  const accept = await api(`/friends/requests/${friendRequest.id}/accept`, recipient.cookie, {
    method: 'POST',
  });
  assert.equal(accept.status, 200);

  const senderSocket = await connectSocket(sender.cookie);
  const recipientSocket = await connectSocket(recipient.cookie);
  const createdEvent = new Promise((resolve) => recipientSocket.once('directMessage:created', resolve));
  const send = await api(`/direct-messages/conversations/${recipient.user.id}/messages`, sender.cookie, {
    method: 'POST',
    body: { body: 'Hello from the backend.' },
  });
  assert.equal(send.status, 201);
  const { data: { message } } = await send.json();
  assert.equal(message.body, 'Hello from the backend.');
  assert.equal(message.senderId, sender.user.id);
  assert.equal(message.receiverId, recipient.user.id);
  assert.equal((await createdEvent).id, message.id);

  const recipientHistory = await api(
    `/direct-messages/conversations/${sender.user.id}/messages`,
    recipient.cookie,
  );
  assert.equal(recipientHistory.status, 200);
  assert.equal((await recipientHistory.json()).data.messages[0].id, message.id);

  const strangerHistory = await api(
    `/direct-messages/conversations/${sender.user.id}/messages`,
    stranger.cookie,
  );
  assert.equal(strangerHistory.status, 403);

  const unread = await api('/direct-messages/unread', recipient.cookie);
  assert.equal((await unread.json()).data.count, 1);

  const updatedEvent = new Promise((resolve) => senderSocket.once('directMessage:updated', resolve));
  const markRead = await api(
    `/direct-messages/conversations/${sender.user.id}/read`,
    recipient.cookie,
    { method: 'POST' },
  );
  assert.equal(markRead.status, 200);
  assert.equal((await markRead.json()).data.count, 1);
  assert.equal((await updatedEvent).isRead, true);

  const senderHistory = await api(
    `/direct-messages/conversations/${recipient.user.id}/messages`,
    sender.cookie,
  );
  assert.equal((await senderHistory.json()).data.messages[0].isRead, true);

  const reply = await api(`/direct-messages/conversations/${sender.user.id}/messages`, recipient.cookie, {
    method: 'POST',
    body: { body: 'Reply.' },
  });
  assert.equal(reply.status, 201);
  const { data: { message: replyMessage } } = await reply.json();

  const cannotDeleteAnotherUsersMessage = await api(
    `/direct-messages/messages/${replyMessage.id}`,
    sender.cookie,
    { method: 'DELETE' },
  );
  assert.equal(cannotDeleteAnotherUsersMessage.status, 403);

  const deletedEvent = new Promise((resolve) => senderSocket.once('directMessage:deleted', resolve));
  const deleteReply = await api(
    `/direct-messages/messages/${replyMessage.id}`,
    recipient.cookie,
    { method: 'DELETE' },
  );
  assert.equal(deleteReply.status, 200);
  assert.equal((await deletedEvent).id, replyMessage.id);

  const finalReply = await api(`/direct-messages/conversations/${sender.user.id}/messages`, recipient.cookie, {
    method: 'POST',
    body: { body: 'One final reply.' },
  });
  assert.equal(finalReply.status, 201);

  const clearedEvent = new Promise((resolve) => senderSocket.once('directMessage:cleared', resolve));
  const clear = await api(
    `/direct-messages/conversations/${recipient.user.id}`,
    sender.cookie,
    { method: 'DELETE' },
  );
  assert.equal(clear.status, 200);
  assert.equal((await clearedEvent).userId, sender.user.id);
  assert.deepEqual((await (await api(
    `/direct-messages/conversations/${recipient.user.id}/messages`,
    sender.cookie,
  )).json()).data.messages, []);
  const recipientHistoryAfterClear = await (await api(
    `/direct-messages/conversations/${sender.user.id}/messages`,
    recipient.cookie,
  )).json();
  assert.equal(recipientHistoryAfterClear.data.messages.length, 2);
});
