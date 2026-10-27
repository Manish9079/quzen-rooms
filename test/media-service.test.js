import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const vite = await createServer({
  configFile: fileURLToPath(new URL('../vite.config.js', import.meta.url)),
  server: { middlewareMode: true },
  appType: 'custom',
});
const { mediaService } = await vite.ssrLoadModule('/src/services/mediaService.js');

class MockPeerConnection {
  constructor() {
    this.connectionState = 'new';
    this.iceConnectionState = 'new';
    this.signalingState = 'stable';
    this.transceivers = [];
    this.localDescription = null;
    this.offerCount = 0;
  }

  getTransceivers() {
    return this.transceivers;
  }

  getSenders() {
    return this.transceivers.map(({ sender }) => sender);
  }

  addTrack(track) {
    const transceiver = createTransceiver(track.kind, track, 'sendrecv');
    this.transceivers.push(transceiver);
    this.onnegotiationneeded?.();
    return transceiver.sender;
  }

  async createOffer() {
    this.offerCount += 1;
    return { type: 'offer', sdp: `offer-${this.offerCount}` };
  }

  async createAnswer() {
    return { type: 'answer', sdp: 'answer' };
  }

  async setLocalDescription(description) {
    this.localDescription = description;
    this.signalingState = description.type === 'offer' ? 'have-local-offer' : 'stable';
    this.onsignalingstatechange?.();
  }

  async setRemoteDescription(description) {
    this.signalingState = description.type === 'answer' ? 'stable' : 'have-remote-offer';
    this.onsignalingstatechange?.();
  }

  async addIceCandidate() {}

  restartIce() {
    this.restartCount = (this.restartCount || 0) + 1;
  }

  close() {
    this.connectionState = 'closed';
  }
}

function createTransceiver(kind, track = null, direction = 'recvonly') {
  return {
    direction,
    receiver: { track: { kind } },
    sender: {
      track,
      async replaceTrack(nextTrack) {
        this.track = nextTrack;
      },
    },
  };
}

const originalPeerConnection = globalThis.RTCPeerConnection;

afterEach(() => {
  mediaService.stopAll();
  globalThis.RTCPeerConnection = originalPeerConnection;
});

test.after(async () => {
  await vite.close();
});

test('adding audio to a receive-only transceiver enables sending and negotiates once', async () => {
  globalThis.RTCPeerConnection = MockPeerConnection;
  const peer = new MockPeerConnection();
  peer.transceivers.push(createTransceiver('audio'));
  const audioTrack = { kind: 'audio', readyState: 'live', stop() {} };
  mediaService.localStream = { getTracks: () => [audioTrack] };
  mediaService.peers.set('remote-socket', peer);
  peer.onnegotiationneeded = () => {
    void mediaService._negotiate(peer, 'remote-socket');
  };

  await mediaService._syncPeerTrack('audio');

  assert.equal(peer.transceivers[0].sender.track, audioTrack);
  assert.equal(peer.transceivers[0].direction, 'sendrecv');
  assert.equal(peer.offerCount, 1);
});

test('a negotiation requested while busy resumes when signaling returns to stable', async () => {
  globalThis.RTCPeerConnection = MockPeerConnection;
  const peer = mediaService._createPeerConnection('remote-socket');
  peer.signalingState = 'have-local-offer';

  await mediaService._negotiate(peer, 'remote-socket');
  assert.equal(peer.offerCount, 0);

  await peer.setRemoteDescription({ type: 'answer', sdp: 'answer' });
  for (let attempt = 0; attempt < 10 && peer.offerCount === 0; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  assert.equal(peer.offerCount, 1);
  assert.equal(peer.localDescription.type, 'offer');
});

test('mute, unmute, and replacing a microphone keep the existing audio sender', async () => {
  globalThis.RTCPeerConnection = MockPeerConnection;
  const firstTrack = { kind: 'audio', readyState: 'live', enabled: true, stop() {} };
  const replacementTrack = { kind: 'audio', readyState: 'live', enabled: true, stop() {} };
  const peer = new MockPeerConnection();
  const transceiver = createTransceiver('audio', firstTrack, 'sendrecv');
  peer.transceivers.push(transceiver);
  mediaService.localStream = { getTracks: () => [firstTrack] };
  mediaService.peers.set('remote-socket', peer);

  mediaService.setTrackEnabled(mediaService.localStream, 'audio', false);
  assert.equal(firstTrack.enabled, false);
  mediaService.setTrackEnabled(mediaService.localStream, 'audio', true);
  assert.equal(firstTrack.enabled, true);

  mediaService.localStream = { getTracks: () => [replacementTrack] };
  await mediaService._syncPeerTrack('audio');

  assert.equal(transceiver.sender.track, replacementTrack);
  assert.equal(peer.transceivers.length, 1);
  assert.equal(peer.offerCount, 0);
});

test('an ICE failure requests one ICE restart and renegotiation', async () => {
  globalThis.RTCPeerConnection = MockPeerConnection;
  const peer = mediaService._createPeerConnection('remote-socket');

  peer.connectionState = 'failed';
  peer.onconnectionstatechange();
  peer.iceConnectionState = 'failed';
  peer.oniceconnectionstatechange();
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(peer.restartCount, 1);
  assert.equal(peer.offerCount, 1);
});

test('reusing a live peer connection does not add duplicate tracks or handlers', () => {
  globalThis.RTCPeerConnection = MockPeerConnection;
  const audioTrack = { kind: 'audio', readyState: 'live', stop() {} };
  mediaService.localStream = { getTracks: () => [audioTrack] };

  const first = mediaService._createPeerConnection('remote-socket');
  const second = mediaService._createPeerConnection('remote-socket');

  assert.equal(first, second);
  assert.equal(first.transceivers.filter(({ receiver }) => receiver.track.kind === 'audio').length, 1);
});
