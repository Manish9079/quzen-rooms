// Mirrors the frontend's local generator (src/utils/roomCode.js) so codes
// look identical whether minted client- or server-side. The backend is the
// source of truth now: it checks the database for collisions before
// returning a code (see services/room.service.js).

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1

export function generateRoomCode() {
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `QZN-${code}`;
}

export function normalizeRoomCode(code) {
  return (code || '').trim().toUpperCase();
}
