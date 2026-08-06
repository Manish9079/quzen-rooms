// Simulated participants for the Main Room, standing in for a real
// SFU/WebRTC roster (see services/webrtc.js + services/sfu.js).

export const AVATAR_HUES = ['#16A374', '#34A99B', '#3FBE8B', '#0E8862', '#2FBE8F', '#7DD6AC'];

export function buildMockParticipants(hostName) {
  const bots = [
    { name: 'Ishaan', muted: false, cameraOn: true, speaking: false },
    { name: 'Fatima', muted: true, cameraOn: false, speaking: false },
    { name: 'Arjun', muted: false, cameraOn: true, speaking: true },
    { name: 'Zoya', muted: false, cameraOn: false, speaking: false },
  ];
  return [
    { id: 'me', name: hostName || 'You', isHost: true, isMe: true, muted: false, cameraOn: false, speaking: false },
    ...bots.map((b, i) => ({ id: `bot-${i}`, isHost: false, isMe: false, ...b })),
  ];
}
