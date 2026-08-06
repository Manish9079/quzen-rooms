# Quzen Rooms

**Your Space. Your People. Your Room.**

Quzen Rooms is a virtual hangout platform — create or join a room, then
text chat, talk, video call, and share your screen with the people you
invite. This repo is the full stack for **quzen.online**: a React + Vite
frontend and a real Node/Express/PostgreSQL/Socket.IO backend. Nothing
is mocked — accounts, rooms, chat, and WebRTC signaling all run against
a real database and real realtime connections.

```
quzen-rooms/
  src/            React + Vite frontend (this README)
  server/         Express + Prisma + Socket.IO backend — see server/README.md
```

## What works today

- **Accounts**: sign up, log in, log out, refresh sessions, edit your
  profile, change your password — real JWT auth over httpOnly cookies
- **Rooms**: create (public or password-protected private), join by
  `QZN-XXXXX` code, browse/search/filter the public Room Explorer,
  leave, host-only delete/update
- **Main room**: responsive video grid, mic/camera/screen-share over
  real WebRTC (peer-to-peer, browser-native `getUserMedia`/
  `getDisplayMedia`, always behind an explicit button press), realtime
  chat with typing indicators, participants panel with a real
  audio-level speaking indicator, host controls (lock/unlock, co-host,
  remove participant, waiting-room approve/reject), copy invite link
- Fully responsive, mobile → desktop

## Quickstart (both servers)

```bash
# 1. Backend — see server/README.md for full details
cd server
npm install
cp .env.example .env        # edit DATABASE_URL / JWT_ACCESS_SECRET
npx prisma generate
npx prisma migrate deploy
npm run dev                 # http://localhost:4000

# 2. Frontend — in a second terminal, from the repo root
cd ..
npm install
cp .env.example .env.local  # defaults already point at localhost:4000
npm run dev                 # http://localhost:5173
```

Open http://localhost:5173, register an account, and create a room.
Open the room link in a second browser (or an incognito window) as a
different account to see realtime chat, presence, and video negotiate
between two real connections.

## Tech stack

- **React 19 + Vite** (rolldown-powered build), React Router, Lucide
  React icons, plain modern CSS with a token system — no CSS framework
- **Backend**: Node.js, Express, PostgreSQL, Prisma, Socket.IO, JWT +
  bcrypt, Zod, Helmet, CORS, express-rate-limit — see `server/README.md`

## Frontend service layer

```
src/services/
  apiClient.js      fetch wrapper — credentials: 'include', consistent error shape
  authService.js     register/login/logout/refresh/me, profile, password
  roomService.js      create/join/leave/delete/update rooms, public explorer, messages history
  socketService.js    shared Socket.IO connection (auth rides the same cookies)
  chatService.js      message send/typing/delete, built on socketService + roomService
  mediaService.js      getUserMedia/getDisplayMedia + a full RTCPeerConnection mesh
                        wired to the backend's Socket.IO signaling, plus a real
                        (non-simulated) speaking indicator via Web Audio analysis
```

`VITE_API_URL` / `VITE_SOCKET_URL` (see `.env.example`) point these at
your running backend. For rooms beyond a handful of participants,
`mediaService.js`'s full mesh is the piece to swap for an SFU client —
the backend's signaling event names were kept SFU-agnostic for exactly
that reason (see `server/README.md`).

## Design system

Palette: white, mint, emerald, a touch of teal, soft warm-gray
neutrals — defined as CSS custom properties in `src/styles/tokens.css`.
Neomorphism for cards/buttons/inputs; glassmorphism used deliberately
and sparingly for overlays (navbar, modals, in-room chat/participants
panels). A signature **"Liquid Orb"** — a morphing gradient sphere —
appears as the hero visual, loading motif, and empty/error states.
Typography: Sora (display), Plus Jakarta Sans (body), JetBrains Mono
(room codes and other data-like text).

## Deployment

```
GitHub → GitHub Actions → Docker/VPS → Nginx → quzen.online
```

- `.github/workflows/ci-cd.yml` lints/builds the frontend, and lints,
  migrates, and integration-tests the backend against a real Postgres
  service container, on every push/PR — then on `main` builds and
  pushes both Docker images and deploys over SSH.
- `docker-compose.yml` (repo root) runs the full stack — Postgres,
  backend, frontend/Nginx — with one command:
  ```bash
  JWT_ACCESS_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))") \
    docker compose up -d
  ```
- `deploy/nginx.conf` — SPA fallback routing, gzip, asset caching,
  security headers, and a `Permissions-Policy` scoping camera/mic/
  display-capture to same-origin.

## Notes

- Camera, microphone, and screen share are **never** requested
  automatically — every access happens from a direct button press, and
  permission errors surface in the UI rather than failing silently.
- Auth tokens live in `httpOnly` cookies, never in `localStorage` —
  `localStorage` is used only for non-sensitive device preferences
  (join-with-mic-on, chat sounds, recent rooms).
- See `server/README.md` for exactly how the backend was verified
  end-to-end against a real PostgreSQL database and real Socket.IO
  connections before delivery, including a note on one sandbox-specific
  network constraint encountered while building it (not present on a
  normal machine or in CI).
