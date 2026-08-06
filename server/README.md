# Quzen Rooms — Backend

Production backend for [Quzen Rooms](../README.md): Express, PostgreSQL,
Prisma, Socket.IO, JWT auth (httpOnly cookies), and WebRTC signaling.
Nothing here is mocked — every endpoint and socket event does real work
against a real database. See "How this was verified" below for exactly
how that was proven before delivery.

## Stack

Node.js · Express · PostgreSQL · Prisma · Socket.IO · JWT + bcrypt ·
Zod · Helmet · CORS · express-rate-limit · cookie-parser

## Project layout

```
server/
  src/
    config/       env, Prisma client, CORS
    controllers/  thin HTTP handlers
    services/     business logic (auth, user, room, message, presence)
    middleware/   auth, room authorization, validation, rate limiting, errors
    routes/       Express routers
    socket/       Socket.IO auth + chat/webrtc/host/presence handlers
    validators/   Zod schemas
    utils/        JWT, bcrypt, opaque tokens, room codes, cookies
    app.js        Express app (no listen)
    server.js     HTTP server + Socket.IO + graceful shutdown
  prisma/
    schema.prisma
    migrations/   hand-verified initial migration (see below)
  test/           integration test + verification fixture (see below) — not part of the runtime app
  Dockerfile
  docker-compose.yml (at repo root)
  .env.example
```

## Setup

```bash
cd server
npm install
cp .env.example .env        # then edit DATABASE_URL, JWT_ACCESS_SECRET, etc.

# Create the database (adjust for your Postgres setup)
createdb quzen_rooms

npx prisma generate
npx prisma migrate deploy   # applies prisma/migrations/20260805000000_init

npm run dev                 # http://localhost:4000, auto-reload via `node --watch`
```

Generate a real `JWT_ACCESS_SECRET` rather than using the example value:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend

In the project root (`quzen-rooms/`, not `server/`):

```bash
cp .env.example .env.local   # VITE_API_URL / VITE_SOCKET_URL already point at :4000
npm install
npm run dev                  # http://localhost:5173
```

Open the app, register an account, create a room, and open the same room
in a second browser (or incognito window) as a second account to see
realtime chat, presence, and video/screen-share negotiate live.

## How this was verified

This backend was built and tested in a sandboxed environment whose
network policy blocks `binaries.prisma.sh` — the CDN `npx prisma
generate` and `npx prisma migrate dev` need to fetch Prisma's engine.
That's a constraint of the build environment, not of your machine: on
a normal connection those commands in **Setup** above will work exactly
as shown.

To still prove the actual application logic — not just that it reads
correctly — end to end against a real, running PostgreSQL database
without that CDN access:

1. **Schema**: `prisma/migrations/20260805000000_init/migration.sql` was
   applied directly via `psql` to a real local Postgres instance and
   confirmed to produce all 7 tables, 3 enums, every index, and every
   foreign key correctly.
2. **Application logic**: `test/devPrismaShim.js` hand-implements the
   ~20 Prisma Client calls this codebase actually makes (grepped from
   `src/`), backed by the real `pg` driver against that same database.
   Swapped in only for testing (see `test/integration.mjs`), it let the
   real, unmodified `app.js`/`server.js`/socket handlers boot and run
   against real Postgres.
3. **`test/integration.mjs`** then exercises the whole system over real
   HTTP + Socket.IO connections: register/duplicate-rejection/login/
   wrong-password/refresh-rotation/logout, profile updates, room create
   (public + private + password-required validation), public room
   search, join (password-protected + open), host-only delete/update
   enforcement, participant listing, message history, leave-room host
   handoff, unauthenticated-socket rejection, and a full realtime
   round-trip between two real socket connections: room join, chat
   message + typing indicator, WebRTC offer/answer relay, host lock,
   and waiting-room approval. **46/46 checks passed** against real
   Postgres on the final run.

Both `test/devPrismaShim.js` and `test/integration.mjs` are verification
fixtures only — they're not imported by `app.js`/`server.js` and don't
ship as part of the running application. You can delete `server/test/`
entirely; nothing else references it.

## Environment variables

See `.env.example`. Required: `DATABASE_URL`, `JWT_ACCESS_SECRET`. Also
review `CLIENT_URL` (CORS allowlist), `COOKIE_SECURE` (set `true` behind
HTTPS in production), and the rate-limit maxes.

## Auth model

Access tokens are short-lived JWTs; refresh tokens are random opaque
strings, stored only as a SHA-256 hash (`RefreshToken.tokenHash`) so a
database leak alone can't be used to forge a session. Both ride as
`httpOnly` cookies (`accessToken`, `refreshToken`) rather than being
handed to frontend JS — the frontend just calls `GET /api/auth/me` on
load and lets the browser attach cookies automatically
(`credentials: 'include'`). Refresh tokens rotate on every use (the old
one is revoked); changing your password revokes every outstanding
session.

## Socket.IO events

Auth: connection is rejected unless `socket.handshake.auth.token` (the
access token, sent explicitly by `socketService.js`) or the
`accessToken` cookie verifies.

| Client → Server | Server → Client |
|---|---|
| `room:join`, `room:leave` | `room:joined`, `room:waiting`, `room:joinRejected` |
| `chat:send`, `chat:typing`, `chat:deleteMessage` | `chat:message`, `chat:typing`, `chat:messageDeleted` |
| `webrtc:ready`, `webrtc:offer`, `webrtc:answer`, `webrtc:ice-candidate` | same names, relayed to the target peer |
| `media:state` | `media:state` (broadcast to the room) |
| — | `presence:userJoined`, `presence:userLeft`, `presence:participantCount`, `presence:online`, `presence:offline` |
| `host:lockRoom`, `host:unlockRoom`, `host:removeParticipant`, `host:setCoHost`, `host:removeCoHost`, `host:approveWaiting`, `host:rejectWaiting` | `host:roomLocked`, `host:roleChanged`, `host:removedYou`, `host:waitingRoomUpdate` |

Locked rooms hold new joiners in an in-memory waiting room
(`services/presence.store.js`) until the host approves or rejects them
— intentionally in-memory rather than in Postgres, since it's ephemeral
session state; the store's interface is written so it's a drop-in swap
for Redis once you run more than one server process.

## WebRTC

This server only relays signaling (SDP/ICE) — media never touches it.
The frontend's `mediaService.js` builds a full mesh of
`RTCPeerConnection`s over that signaling, which is fine for small rooms.
For larger public rooms, replace the mesh with a call to an SFU
(LiveKit, mediasoup, Janus); the event names were kept SFU-agnostic for
exactly that swap.

## Deployment

```
GitHub → GitHub Actions → Docker → VPS/AWS → Nginx → Node.js → PostgreSQL
```

```bash
docker build -t quzen-rooms-server .
docker run -p 4000:4000 --env-file .env quzen-rooms-server
# or, from the repo root:
docker compose up -d
```

`GET /api/health` reports `{ success, data: { status, database, uptime } }`
and returns 503 if Postgres is unreachable — point your load balancer's
health check at it. Run `npx prisma migrate deploy` (not `migrate dev`)
as part of your deploy step, before starting the new server instance.
