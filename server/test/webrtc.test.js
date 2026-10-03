import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerWebrtcHandlers } from '../src/socket/webrtc.handler.js';

function createHarness({ roomPermissions = {}, peers = [] } = {}) {
  const handlers = new Map();
  const sentToClient = [];
  const sentToPeers = [];
  const relayed = [];
  const socket = {
    id: 'local-socket',
    user: { id: 'local-user', username: 'local' },
    data: {
      roomCode: 'QZN-ABCDE',
      roomMediaPermissions: roomPermissions,
      mediaState: { micOn: false, cameraOn: false, screenSharing: false },
    },
    on: (event, handler) => handlers.set(event, handler),
    emit: (event, payload) => sentToClient.push({ event, payload }),
    to: () => ({ emit: (event, payload) => sentToPeers.push({ event, payload }) }),
  };
  const io = {
    sockets: {
      adapter: {
        rooms: new Map([['QZN-ABCDE', new Set(['local-socket', ...peers.map((peer) => peer.id)])]]),
      },
    },
    in: () => ({ fetchSockets: async () => peers }),
    to: (socketId) => ({
      emit: (event, payload) => relayed.push({ socketId, event, payload }),
    }),
  };

  registerWebrtcHandlers(io, socket);
  return { handlers, io, socket, sentToClient, sentToPeers, relayed };
}

test('new peers receive current media state for existing room members', async () => {
  const peer = {
    id: 'existing-socket',
    data: {
      userId: 'existing-user',
      mediaState: { micOn: true, cameraOn: true, screenSharing: true },
    },
  };
  const harness = createHarness({ peers: [peer] });

  await harness.handlers.get('webrtc:ready')();

  assert.deepEqual(harness.sentToClient[0], {
    event: 'media:state',
    payload: {
      userId: 'existing-user',
      socketId: 'existing-socket',
      micOn: true,
      cameraOn: true,
      screenSharing: true,
    },
  });
  assert.equal(harness.sentToPeers[0].event, 'webrtc:peerJoined');
});

test('media state is constrained by stored room permissions', () => {
  const harness = createHarness({
    roomPermissions: { videoEnabled: false, screenShareEnabled: false },
  });

  harness.handlers.get('media:state')({
    micOn: true,
    cameraOn: true,
    screenSharing: true,
  });

  assert.deepEqual(harness.socket.data.mediaState, {
    micOn: false,
    cameraOn: false,
    screenSharing: false,
  });
  assert.equal(harness.sentToPeers[0].payload.micOn, false);
  assert.equal(harness.sentToPeers[0].payload.cameraOn, false);
  assert.equal(harness.sentToPeers[0].payload.screenSharing, false);
});

test('signaling is limited to room peers and video is rejected when disabled', () => {
  const harness = createHarness({
    roomPermissions: { videoEnabled: false, screenShareEnabled: false },
    peers: [{ id: 'room-peer', data: {} }],
  });
  const sdp = { type: 'offer', sdp: 'v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\n' };

  harness.handlers.get('webrtc:offer')({ to: 'outside-peer', sdp });
  harness.handlers.get('webrtc:offer')({ to: 'room-peer', sdp });

  harness.handlers.get('webrtc:offer')({
    to: 'room-peer',
    sdp: { type: 'offer', sdp: 'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n' },
  });
  assert.equal(harness.relayed.length, 0);
});

test('screen sharing remains available when camera and microphone are disabled', () => {
  const harness = createHarness({
    roomPermissions: { videoEnabled: false, screenShareEnabled: true },
    peers: [{ id: 'room-peer', data: {} }],
  });

  harness.handlers.get('webrtc:offer')({
    to: 'room-peer',
    sdp: { type: 'offer', sdp: 'v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\n' },
  });
  harness.handlers.get('webrtc:offer')({
    to: 'room-peer',
    sdp: { type: 'offer', sdp: 'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n' },
  });
  assert.equal(harness.relayed.length, 1);

  harness.handlers.get('media:state')({
    micOn: true,
    cameraOn: true,
    screenSharing: true,
  });
  assert.deepEqual(harness.socket.data.mediaState, {
    micOn: false,
    cameraOn: false,
    screenSharing: true,
  });
});
