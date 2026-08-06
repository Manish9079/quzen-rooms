// TEST-ONLY script — exercises the real Express + Socket.IO app (via the
// devPrismaShim, see that file's header) against a real local Postgres.
// Not part of the shipped project.
import { io as ioClient } from 'socket.io-client';

const BASE = 'http://localhost:4000';
let pass = 0, fail = 0;

function check(label, cond, extra) {
  if (cond) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label}` + (extra ? ` -> ${JSON.stringify(extra)}` : '')); }
}

function extractCookie(setCookieArr, name) {
  if (!setCookieArr) return null;
  for (const c of setCookieArr) {
    const m = c.match(new RegExp(`^${name}=([^;]+)`));
    if (m) return m[1];
  }
  return null;
}

async function main() {
  console.log('\n--- HEALTH ---');
  let res = await fetch(`${BASE}/api/health`);
  let body = await res.json();
  check('GET /api/health -> 200', res.status === 200, body);
  check('health.database === ok', body.data?.database === 'ok', body);

  console.log('\n--- AUTH: REGISTER ---');
  res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'priya', displayName: 'Priya Sharma', email: 'priya@example.com', password: 'password123' }),
  });
  body = await res.json();
  check('register -> 201', res.status === 201, body);
  check('register returns user + accessToken', body.data?.user?.username === 'priya' && !!body.data?.accessToken, body);
  const setCookies1 = res.headers.getSetCookie?.() || [];
  let accessToken = extractCookie(setCookies1, 'accessToken');
  let refreshToken = extractCookie(setCookies1, 'refreshToken');
  check('register sets accessToken + refreshToken cookies', !!accessToken && !!refreshToken);

  console.log('\n--- AUTH: DUPLICATE REGISTER REJECTED ---');
  res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'priya', displayName: 'Priya 2', email: 'priya@example.com', password: 'password123' }),
  });
  body = await res.json();
  check('duplicate email -> 409', res.status === 409, body);

  console.log('\n--- AUTH: WEAK PASSWORD REJECTED ---');
  res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'shorty', displayName: 'Shorty', email: 'shorty@example.com', password: '123' }),
  });
  body = await res.json();
  check('weak password -> 400 validation error', res.status === 400 && body.message === 'Validation failed', body);

  console.log('\n--- AUTH: LOGIN WRONG PASSWORD ---');
  res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'priya', password: 'wrongpassword' }),
  });
  body = await res.json();
  check('wrong password -> 401', res.status === 401, body);

  console.log('\n--- AUTH: LOGIN CORRECT ---');
  res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'priya@example.com', password: 'password123' }),
  });
  body = await res.json();
  check('login -> 200', res.status === 200, body);
  const setCookies2 = res.headers.getSetCookie?.() || [];
  accessToken = extractCookie(setCookies2, 'accessToken');
  refreshToken = extractCookie(setCookies2, 'refreshToken');

  console.log('\n--- AUTH: GET /me ---');
  res = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: `accessToken=${accessToken}` } });
  body = await res.json();
  check('me -> 200 with correct user', res.status === 200 && body.data.user.email === 'priya@example.com', body);
  const userId = body.data.user.id;

  console.log('\n--- AUTH: GET /me WITHOUT TOKEN REJECTED ---');
  res = await fetch(`${BASE}/api/auth/me`);
  body = await res.json();
  check('me without auth -> 401', res.status === 401, body);

  console.log('\n--- AUTH: REFRESH TOKEN ROTATION ---');
  res = await fetch(`${BASE}/api/auth/refresh`, { method: 'POST', headers: { Cookie: `refreshToken=${refreshToken}` } });
  body = await res.json();
  check('refresh -> 200 new accessToken', res.status === 200 && !!body.data.accessToken, body);
  const setCookies3 = res.headers.getSetCookie?.() || [];
  const newAccessToken = extractCookie(setCookies3, 'accessToken');
  const newRefreshToken = extractCookie(setCookies3, 'refreshToken');
  accessToken = newAccessToken;

  res = await fetch(`${BASE}/api/auth/refresh`, { method: 'POST', headers: { Cookie: `refreshToken=${refreshToken}` } });
  body = await res.json();
  check('reusing a rotated (revoked) refresh token -> 401', res.status === 401, body);
  refreshToken = newRefreshToken;

  console.log('\n--- USER: PROFILE UPDATE ---');
  res = await fetch(`${BASE}/api/users/me`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: `accessToken=${accessToken}` },
    body: JSON.stringify({ bio: 'Hosting chill rooms since 2026 ✨' }),
  });
  body = await res.json();
  check('profile update -> 200', res.status === 200 && body.data.user.bio.includes('chill'), body);

  console.log('\n--- USER: GET BY USERNAME (PUBLIC) ---');
  res = await fetch(`${BASE}/api/users/priya`);
  body = await res.json();
  check('get user by username -> 200, no passwordHash leaked', res.status === 200 && !body.data.user.passwordHash, body);

  console.log('\n--- REGISTER SECOND USER (for room join/host tests) ---');
  res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'dhruv', displayName: 'Dhruv', email: 'dhruv@example.com', password: 'password123' }),
  });
  body = await res.json();
  const setCookiesD = res.headers.getSetCookie?.() || [];
  const dhruvAccessToken = extractCookie(setCookiesD, 'accessToken');
  const dhruvId = body.data.user.id;
  check('second user registered', res.status === 201, body);

  console.log('\n--- ROOMS: CREATE (public) ---');
  res = await fetch(`${BASE}/api/rooms`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: `accessToken=${accessToken}` },
    body: JSON.stringify({ name: 'Late Night Chai & Chill', category: 'CHILL', isPrivate: false, maxParticipants: 10 }),
  });
  body = await res.json();
  check('create public room -> 201', res.status === 201, body);
  check('room code looks like QZN-XXXXX', /^QZN-[A-Z0-9]{5}$/.test(body.data.room.code), body);
  const roomCode = body.data.room.code;

  console.log('\n--- ROOMS: CREATE (private, no password -> rejected) ---');
  res = await fetch(`${BASE}/api/rooms`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: `accessToken=${accessToken}` },
    body: JSON.stringify({ name: 'Secret Room', category: 'STUDY', isPrivate: true }),
  });
  body = await res.json();
  check('private room without password -> 400', res.status === 400, body);

  console.log('\n--- ROOMS: CREATE (private, with password) ---');
  res = await fetch(`${BASE}/api/rooms`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: `accessToken=${accessToken}` },
    body: JSON.stringify({ name: 'Private Study Hall', category: 'STUDY', isPrivate: true, password: 'letmein', maxParticipants: 5 }),
  });
  body = await res.json();
  check('private room with password -> 201', res.status === 201, body);
  const privateRoomCode = body.data.room.code;

  console.log('\n--- ROOMS: PUBLIC EXPLORER ---');
  res = await fetch(`${BASE}/api/rooms/public?category=CHILL`);
  body = await res.json();
  check('public rooms list includes our room, excludes private', res.status === 200 &&
    body.data.rooms.some((r) => r.code === roomCode) && !body.data.rooms.some((r) => r.code === privateRoomCode), body);

  console.log('\n--- ROOMS: GET BY CODE ---');
  res = await fetch(`${BASE}/api/rooms/${roomCode}`);
  body = await res.json();
  check('get room by code -> 200, host present, 1 participant', res.status === 200 &&
    body.data.room.host.username === 'priya' && body.data.room.participantCount === 1, body);

  console.log('\n--- ROOMS: JOIN (wrong password on private room) ---');
  res = await fetch(`${BASE}/api/rooms/${privateRoomCode}/join`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: `accessToken=${dhruvAccessToken}` },
    body: JSON.stringify({ password: 'nope' }),
  });
  body = await res.json();
  check('wrong room password -> 401', res.status === 401, body);

  console.log('\n--- ROOMS: JOIN (correct password) ---');
  res = await fetch(`${BASE}/api/rooms/${privateRoomCode}/join`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: `accessToken=${dhruvAccessToken}` },
    body: JSON.stringify({ password: 'letmein' }),
  });
  body = await res.json();
  check('correct password join -> 200, participantCount 2', res.status === 200 && body.data.room.participantCount === 2, body);

  console.log('\n--- ROOMS: JOIN (public room, no password needed) ---');
  res = await fetch(`${BASE}/api/rooms/${roomCode}/join`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: `accessToken=${dhruvAccessToken}` },
    body: JSON.stringify({}),
  });
  body = await res.json();
  check('join public room -> 200', res.status === 200 && body.data.room.participantCount === 2, body);

  console.log('\n--- ROOMS: NON-HOST CANNOT DELETE ---');
  res = await fetch(`${BASE}/api/rooms/${roomCode}`, { method: 'DELETE', headers: { Cookie: `accessToken=${dhruvAccessToken}` } });
  body = await res.json();
  check('non-host delete -> 403', res.status === 403, body);

  console.log('\n--- ROOMS: HOST CAN UPDATE ---');
  res = await fetch(`${BASE}/api/rooms/${roomCode}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: `accessToken=${accessToken}` },
    body: JSON.stringify({ description: 'Bring your own chai.' }),
  });
  body = await res.json();
  check('host update -> 200', res.status === 200 && body.data.room.description === 'Bring your own chai.', body);

  console.log('\n--- ROOMS: PARTICIPANTS LIST ---');
  res = await fetch(`${BASE}/api/rooms/${roomCode}/participants`);
  body = await res.json();
  check('participants list has 2, host role correct', res.status === 200 &&
    body.data.participants.length === 2 && body.data.participants.find((p) => p.user.username === 'priya').role === 'HOST', body);

  console.log('\n--- MESSAGES: EMPTY HISTORY ---');
  res = await fetch(`${BASE}/api/rooms/${roomCode}/messages`, { headers: { Cookie: `accessToken=${accessToken}` } });
  body = await res.json();
  check('message history -> 200 empty array', res.status === 200 && Array.isArray(body.data.messages) && body.data.messages.length === 0, body);

  console.log('\n--- ROOMS: LEAVE ---');
  res = await fetch(`${BASE}/api/rooms/${roomCode}/leave`, { method: 'POST', headers: { Cookie: `accessToken=${dhruvAccessToken}` } });
  body = await res.json();
  check('leave room -> 200', res.status === 200, body);

  console.log('\n--- AUTH: LOGOUT ---');
  res = await fetch(`${BASE}/api/auth/logout`, { method: 'POST', headers: { Cookie: `accessToken=${accessToken}; refreshToken=${refreshToken}` } });
  body = await res.json();
  check('logout -> 200', res.status === 200, body);

  // ============ SOCKET.IO ============
  console.log('\n--- SOCKET.IO: REJECTS UNAUTHENTICATED ---');
  await new Promise((resolve) => {
    const badSocket = ioClient(BASE, { auth: {}, transports: ['websocket'] });
    badSocket.on('connect_error', (err) => {
      check('unauthenticated socket -> connect_error', err.message === 'UNAUTHORIZED', err.message);
      badSocket.close();
      resolve();
    });
    badSocket.on('connect', () => { check('unauthenticated socket should not connect', false); badSocket.close(); resolve(); });
    setTimeout(resolve, 3000);
  });

  console.log('\n--- SOCKET.IO: LOGIN FRESH FOR SOCKET TEST ---');
  res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'priya', password: 'password123' }),
  });
  body = await res.json();
  const priyaToken = body.data.accessToken;

  res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'dhruv', password: 'password123' }),
  });
  body = await res.json();
  const dhruvToken = body.data.accessToken;

  console.log('\n--- SOCKET.IO: JOIN, CHAT, TYPING, PRESENCE, WEBRTC RELAY ---');
  await new Promise((resolve) => {
    const host = ioClient(BASE, { auth: { token: priyaToken }, transports: ['websocket'] });
    const guest = ioClient(BASE, { auth: { token: dhruvToken }, transports: ['websocket'] });
    let guestSawJoin = false, guestSawMessage = false, guestSawTyping = false, hostSawOffer = false, guestSawAnswer = false;

    host.on('connect', () => {
      host.emit('room:join', { code: roomCode }, (ack) => {
        check('host room:join ack ok', ack.ok === true, ack);

        guest.emit('room:join', { code: roomCode }, (ack2) => {
          check('guest room:join ack ok', ack2.ok === true, ack2);
        });
      });
    });

    host.on('presence:userJoined', (p) => { guestSawJoin = true; check('host sees presence:userJoined for guest', p.participant.user.username === 'dhruv', p); });

    guest.on('room:joined', () => {
      guest.emit('chat:send', { body: 'hey! excited for this room' }, (ack) => {
        check('guest chat:send ack ok', ack.ok === true, ack);
      });
      guest.emit('chat:typing', { isTyping: true });
    });

    host.on('chat:message', (msg) => { guestSawMessage = true; check('host received chat:message from guest', msg.body.includes('excited'), msg); });
    host.on('chat:typing', (t) => { guestSawTyping = true; check('host received chat:typing from guest', t.isTyping === true, t); });

    host.on('webrtc:peerJoined', (p) => {
      hostSawOffer = true;
      host.emit('webrtc:offer', { to: p.socketId, sdp: { type: 'offer', sdp: 'v=0...fake-sdp' } });
    });
    guest.on('webrtc:offer', (offer) => {
      guest.emit('webrtc:answer', { to: offer.from, sdp: { type: 'answer', sdp: 'v=0...fake-answer' } });
    });
    host.on('webrtc:answer', (answer) => {
      guestSawAnswer = true;
      check('host received webrtc:answer relay from guest', answer.sdp.type === 'answer', answer);
    });

    guest.on('room:joined', () => guest.emit('webrtc:ready'));

    setTimeout(() => {
      check('full realtime flow completed (join/message/typing/webrtc)', guestSawJoin && guestSawMessage && guestSawTyping && hostSawOffer && guestSawAnswer);
      host.close(); guest.close();
      resolve();
    }, 2500);
  });

  console.log('\n--- SOCKET.IO: HOST LOCK ROOM + WAITING ROOM APPROVAL ---');
  res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'priya', password: 'password123' }),
  });
  body = await res.json();
  const priyaToken2 = body.data.accessToken;

  res = await fetch(`${BASE}/api/rooms`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: `accessToken=${priyaToken2}` },
    body: JSON.stringify({ name: 'Lock Test Room', category: 'CHILL', isPrivate: false, maxParticipants: 10 }),
  });
  body = await res.json();
  const lockRoomCode = body.data.room.code;
  check('fresh room created for lock/waiting-room test', res.status === 201, body);

  res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'zoya', displayName: 'Zoya', email: 'zoya@example.com', password: 'password123' }),
  });
  body = await res.json();
  const zoyaToken = body.data.accessToken;

  await new Promise((resolve) => {
    const host = ioClient(BASE, { auth: { token: priyaToken2 }, transports: ['websocket'] });
    const waiter = ioClient(BASE, { auth: { token: zoyaToken }, transports: ['websocket'] });
    let sawWaiting = false, sawHostNotified = false, sawApprovedJoin = false;

    host.on('connect', () => {
      host.emit('room:join', { code: lockRoomCode }, (joinAck) => {
        check('host room:join (lock test) ack ok', joinAck.ok === true, joinAck);
        host.emit('host:lockRoom', {}, (ack) => check('host:lockRoom ack ok', ack.ok === true, ack));

        setTimeout(() => {
          waiter.emit('room:join', { code: lockRoomCode }, (ack) => {
            check('waiter join on locked room -> waiting:true', ack.waiting === true, ack);
          });
        }, 200);
      });
    });

    waiter.on('room:waiting', () => { sawWaiting = true; });
    host.on('host:waitingRoomUpdate', ({ waiting }) => {
      if (waiting.some((w) => w.username === 'zoya')) {
        sawHostNotified = true;
        host.emit('host:approveWaiting', { userId: waiting.find((w) => w.username === 'zoya').userId }, (ack) => {
          check('host:approveWaiting ack ok', ack.ok === true, ack);
        });
      }
    });
    waiter.on('room:joined', () => { sawApprovedJoin = true; });

    setTimeout(() => {
      check('waiting-room approval flow completed', sawWaiting && sawHostNotified && sawApprovedJoin);
      host.close(); waiter.close();
      resolve();
    }, 2000);
  });

  console.log(`\n=== RESULTS: ${pass} passed, ${fail} failed ===\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => { console.error('FATAL', err); process.exit(1); });
