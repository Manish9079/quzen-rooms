# Quzen Rooms — Backend

Production backend for [Quzen Rooms](../README.md): Express, DynamoDB,
Socket.IO, JWT auth (httpOnly cookies), and WebRTC signaling.
Nothing here is mocked — every endpoint and socket event does real work
against a real database. See "How this was verified" below for exactly
how that was proven before delivery.

## Stack

Node.js · Express · DynamoDB · Socket.IO · JWT + bcrypt ·
Zod · Helmet · CORS · express-rate-limit · cookie-parser

## Project layout

```
server/
  src/
    config/       env, DynamoDB adapter, CORS
    controllers/  thin HTTP handlers
    services/     business logic (auth, user, room, message, presence)
    middleware/   auth, room authorization, validation, rate limiting, errors
    routes/       Express routers
    socket/       Socket.IO auth + chat/webrtc/host/presence handlers
    validators/   Zod schemas
    utils/        JWT, bcrypt, opaque tokens, room codes, cookies
    app.js        Express app (no listen)
    server.js     HTTP server + Socket.IO + graceful shutdown
  Dockerfile
  docker-compose.yml (at repo root)
  .env.example
```

## Setup

```bash
cd server
npm install
cp .env.example .env        # then edit AWS table names, JWT_ACCESS_SECRET, etc.

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

## Verification

The production runtime uses the DynamoDB adapter in `src/config/dynamo.js`.
Run HTTP and Socket.IO integration checks against the deployed AWS tables
before production cutover.

## Environment variables

See `.env.example`. Required: `AWS_REGION`, the five DynamoDB table names,
and `JWT_ACCESS_SECRET`. Also
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
— intentionally in-memory rather than in DynamoDB, since it's ephemeral
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
GitHub → GitHub Actions → Docker → ECS Fargate → Application Load Balancer → DynamoDB
```

```bash
docker build -t quzen-rooms-server .
docker run -p 4000:4000 --env-file .env quzen-rooms-server
# or, from the repo root:
docker compose up -d
```

`GET /api/health` reports `{ success, data: { status, database, uptime } }`
and returns 503 if DynamoDB is unreachable. The current adapter uses scans
for compatibility; add GSIs and atomic transactions before scaling beyond
the initial deployment. Cognito session migration and existing-data import
remain follow-up operations documented in `infra/README.md`.
