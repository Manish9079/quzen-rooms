// Local, deterministic-enough room code generator for V1.
// Format: QZN-XXXXX (uppercase alphanumerics, ambiguous chars removed).
// Replace with a server-issued, collision-checked code once the
// REST API (services/api.js) is live.

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1

export function generateRoomCode() {
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `QZN-${code}`;
}

export function isValidRoomCode(code) {
  return /^QZN-[A-Z0-9]{4,6}$/.test((code || '').trim().toUpperCase());
}

export function normalizeRoomCode(code) {
  return (code || '').trim().toUpperCase();
}
