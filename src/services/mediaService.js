import { socketService } from './socketService';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

/**
 * Real WebRTC: camera/mic/screen-share capture, plus a full-mesh of
 * RTCPeerConnections wired up over the backend's Socket.IO signaling
 * (webrtc:offer/answer/ice-candidate/peerJoined/peerDisconnected — see
 * server/src/socket/webrtc.handler.js). No media ever touches the
 * backend; only SDP/ICE metadata does.
 *
 * Full mesh is fine up to a handful of participants. Past that, swap
 * startSignaling()'s per-peer RTCPeerConnection creation for a single
 * connection to an SFU (see server/src/socket/sfu — not built in V1) —
 * the event names below were kept SFU-agnostic for exactly that reason.
 */
class MediaService {
  localStream = null;
  screenStream = null;
  peers = new Map(); // remote socketId -> RTCPeerConnection
  listening = false;

  // Assign these from the UI layer (MainRoom) to react to remote media.
  onRemoteStream = null;   // (socketId, stream, meta) => void
  onPeerLeft = null;       // (socketId) => void

  async getCamera({ audio = true, video = true } = {}) {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera/microphone access is not supported in this browser.');
    }
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio, video });
    this._attachLocalTracksToPeers();
    return this.localStream;
  }

  async getScreenShare() {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error('Screen sharing is not supported in this browser.');
    }
    this.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    return this.screenStream;
  }

  setTrackEnabled(stream, kind, enabled) {
    stream?.getTracks().filter((t) => t.kind === kind).forEach((t) => { t.enabled = enabled; });
  }

  stopStream(stream) {
    stream?.getTracks().forEach((t) => t.stop());
  }

  _attachLocalTracksToPeers() {
    if (!this.localStream) return;
    for (const pc of this.peers.values()) {
      const existingKinds = new Set(pc.getSenders().map((s) => s.track?.kind).filter(Boolean));
      this.localStream.getTracks().forEach((track) => {
        if (!existingKinds.has(track.kind)) pc.addTrack(track, this.localStream);
      });
    }
  }

  _createPeerConnection(remoteSocketId, meta) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => pc.addTrack(track, this.localStream));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.emit('webrtc:ice-candidate', { to: remoteSocketId, candidate: event.candidate });
      }
    };

    // Fires when tracks are added/removed after the initial handshake
    // (e.g. turning the camera on partway through the call) — without
    // this, later track changes would never reach the remote peer.
    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketService.emit('webrtc:offer', { to: remoteSocketId, sdp: offer });
      } catch { /* benign if signaling state changed mid-negotiation */ }
    };

    pc.ontrack = (event) => {
      this.onRemoteStream?.(remoteSocketId, event.streams[0], meta);
    };

    pc.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
        this.peers.delete(remoteSocketId);
      }
    };

    this.peers.set(remoteSocketId, pc);
    return pc;
  }

  /** Wires up signaling listeners. Call once per room session, after connecting the socket. */
  startSignaling() {
    if (this.listening) return;
    this.listening = true;

    socketService.on('webrtc:peerJoined', async ({ socketId, userId, username }) => {
      const pc = this._createPeerConnection(socketId, { userId, username });
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketService.emit('webrtc:offer', { to: socketId, sdp: offer });
    });

    socketService.on('webrtc:offer', async ({ from, userId, sdp }) => {
      const pc = this.peers.get(from) || this._createPeerConnection(from, { userId });
      await pc.setRemoteDescription(sdp);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketService.emit('webrtc:answer', { to: from, sdp: answer });
    });

    socketService.on('webrtc:answer', async ({ from, sdp }) => {
      const pc = this.peers.get(from);
      if (pc && pc.signalingState !== 'stable') await pc.setRemoteDescription(sdp);
    });

    socketService.on('webrtc:ice-candidate', async ({ from, candidate }) => {
      const pc = this.peers.get(from);
      try { await pc?.addIceCandidate(candidate); } catch { /* candidate arrived after close; ignore */ }
    });

    socketService.on('webrtc:peerDisconnected', ({ socketId }) => {
      this.peers.get(socketId)?.close();
      this.peers.delete(socketId);
      this.onPeerLeft?.(socketId);
    });

    // Tells everyone already in the room "I'm ready to negotiate" —
    // triggers webrtc:peerJoined on their side, which starts the offer.
    socketService.emit('webrtc:ready');
  }

  broadcastMediaState({ micOn, cameraOn, screenSharing }) {
    socketService.emit('media:state', { micOn, cameraOn, screenSharing });
  }

  /**
   * Real (not simulated) speaking indicator: analyses live audio-track
   * volume via the Web Audio API and calls onChange(true/false) whenever
   * the speaking state crosses the threshold. Works for local or remote
   * streams. Returns a cleanup function — call it when the tile unmounts
   * or the stream changes.
   */
  attachSpeakingDetector(stream, onChange, { threshold = 14 } = {}) {
    if (!stream || stream.getAudioTracks().length === 0) return () => {};
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return () => {};

    const ctx = new AudioCtx();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    let speaking = false;
    let raf;
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      const next = avg > threshold;
      if (next !== speaking) { speaking = next; onChange(speaking); }
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      source.disconnect();
      ctx.close().catch(() => {});
    };
  }

  stopAll() {
    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
    this.stopStream(this.localStream);
    this.stopStream(this.screenStream);
    this.localStream = null;
    this.screenStream = null;
    this.listening = false;
  }
}

export const mediaService = new MediaService();
