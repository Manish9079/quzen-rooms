// Local, deterministic-enough room code generator for V1.
// Format: QZN-XXXXX (uppercase alphanumerics, ambiguous chars removed).
// Room codes are issued when rooms are created and stored with the room record.

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
