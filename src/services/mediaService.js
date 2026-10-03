import { socketService } from './socketService';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

class MediaService {
  localStream = null;
  screenStream = null;
  peers = new Map();
  remoteStreams = new Map();
  pendingCandidates = new Map();
  watchedTracks = new WeakSet();
  listening = false;
  signalUnsubscribers = [];
  screenShareStopping = false;
  sessionId = 0;
  onRemoteStream = null;
  onPeerLeft = null;
  onLocalMediaChange = null;

  getMediaState() {
    const liveEnabled = (track) => track?.readyState === 'live' && track.enabled;
    const cameraTrack = this.localStream?.getVideoTracks().find((track) => track.readyState === 'live');
    const microphoneTrack = this.localStream?.getAudioTracks().find((track) => track.readyState === 'live');
    const screenTrack = this.screenStream?.getVideoTracks().find((track) => track.readyState === 'live');

    return {
      micOn: liveEnabled(microphoneTrack),
      cameraOn: liveEnabled(cameraTrack),
      screenSharing: Boolean(screenTrack),
      localStream: this.localStream,
      screenStream: this.screenStream,
    };
  }

  async getCamera({ audio = true, video = true } = {}) {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera and microphone access are not supported in this browser.');
    }

    const sessionId = this.sessionId;
    const captured = await navigator.mediaDevices.getUserMedia({ audio, video });
    if (sessionId !== this.sessionId) {
      captured.getTracks().forEach((track) => track.stop());
      throw new Error('The room ended before media access completed.');
    }
    if (!this.localStream) this.localStream = new MediaStream();

    const replacedTracks = [];
    for (const track of captured.getTracks()) {
      const previousTracks = this.localStream.getTracks().filter((current) => current.kind === track.kind);
      for (const previous of previousTracks) {
        this.localStream.removeTrack(previous);
        replacedTracks.push(previous);
      }
      this.localStream.addTrack(track);
      this._watchLocalTrack(track);
      await this._syncPeerTrack(track.kind);
    }

    replacedTracks.forEach((track) => track.stop());
    this.onLocalMediaChange?.(this.getMediaState());
    return this.localStream;
  }

  async getScreenShare() {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error('Screen sharing is not supported in this browser.');
    }
    const sessionId = this.sessionId;
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    if (sessionId !== this.sessionId) {
      stream.getTracks().forEach((track) => track.stop());
      throw new Error('The room ended before screen sharing started.');
    }
    return stream;
  }

  async startScreenShare(stream) {
    const screenTrack = stream?.getVideoTracks()?.[0];
    if (!screenTrack || screenTrack.readyState !== 'live') {
      throw new Error('No active screen-share track is available.');
    }

    this.screenStream = stream;
    this._watchLocalTrack(screenTrack);
    try {
      await this._syncPeerTrack('video');
    } catch (error) {
      this.screenStream = null;
      stream.getTracks().forEach((track) => track.stop());
      try {
        await this._syncPeerTrack('video');
      } catch (restoreError) {
        console.error('Could not restore the previous video track after screen sharing failed:', restoreError);
      }
      throw error;
    }
    this.onLocalMediaChange?.(this.getMediaState());
  }

  async stopScreenShare() {
    if (!this.screenStream || this.screenShareStopping) return;
    this.screenShareStopping = true;
    const stream = this.screenStream;
    this.screenStream = null;

    try {
      await this._syncPeerTrack('video');
    } finally {
      stream.getTracks().forEach((track) => track.stop());
      this.screenShareStopping = false;
      this.onLocalMediaChange?.(this.getMediaState());
    }
  }

  setTrackEnabled(stream, kind, enabled) {
    stream?.getTracks()
      .filter((track) => track.kind === kind && track.readyState === 'live')
      .forEach((track) => { track.enabled = enabled; });
    this.onLocalMediaChange?.(this.getMediaState());
  }

  stopStream(stream) {
    stream?.getTracks().forEach((track) => track.stop());
  }

  _watchLocalTrack(track) {
    if (this.watchedTracks.has(track)) return;
    this.watchedTracks.add(track);
    track.addEventListener('ended', () => {
      if (this.screenStream?.getTracks().includes(track)) {
        void this.stopScreenShare().catch((error) => {
          console.error('Could not restore camera after screen sharing ended:', error);
        });
        return;
      }

      if (this.localStream?.getTracks().includes(track)) {
        this.localStream.removeTrack(track);
        this._syncPeerTrack(track.kind).catch((error) => {
          console.error(`Could not update the ${track.kind} track after it ended:`, error);
        });
      }
      this.onLocalMediaChange?.(this.getMediaState());
    });
  }

  _outgoingTrack(kind) {
    if (kind === 'video') {
      const screenTrack = this.screenStream?.getVideoTracks()
        .find((track) => track.readyState === 'live');
      if (screenTrack) return screenTrack;
    }
    return this.localStream?.getTracks()
      .find((track) => track.kind === kind && track.readyState === 'live') || null;
  }

  _getSender(pc, kind) {
    return pc.getTransceivers()
      .find((transceiver) => transceiver.receiver.track.kind === kind)
      ?.sender || pc.getSenders().find((sender) => sender.track?.kind === kind) || null;
  }

  async _syncPeerTrack(kind) {
    const track = this._outgoingTrack(kind);
    for (const pc of this.peers.values()) {
      if (pc.connectionState === 'closed') continue;
      const sender = this._getSender(pc, kind);
      if (sender) {
        if (sender.track !== track) await sender.replaceTrack(track);
      } else if (track) {
        pc.addTrack(track, kind === 'video' && this.screenStream ? this.screenStream : this.localStream);
      }
    }
  }

  _createPeerConnection(remoteSocketId, meta = {}) {
    const existing = this.peers.get(remoteSocketId);
    if (existing && existing.connectionState !== 'closed') return existing;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc._makingOffer = false;
    pc._ignoreOffer = false;
    pc._polite = String(socketService.socket?.id || '') > String(remoteSocketId);

    const outgoingTracks = [
      this._outgoingTrack('audio'),
      this._outgoingTrack('video'),
    ].filter(Boolean);
    for (const track of outgoingTracks) {
      const stream = track === this.screenStream?.getVideoTracks()[0]
        ? this.screenStream
        : this.localStream;
      pc.addTrack(track, stream);
    }

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socketService.emit('webrtc:ice-candidate', { to: remoteSocketId, candidate });
      }
    };

    pc.onnegotiationneeded = () => {
      void this._negotiate(pc, remoteSocketId);
    };

    pc.ontrack = ({ track }) => {
      let stream = this.remoteStreams.get(remoteSocketId);
      if (!stream) {
        stream = new MediaStream();
        this.remoteStreams.set(remoteSocketId, stream);
      }

      stream.getTracks()
        .filter((current) => current.kind === track.kind && current.id !== track.id)
        .forEach((current) => stream.removeTrack(current));
      if (!stream.getTracks().some((current) => current.id === track.id)) {
        stream.addTrack(track);
      }

      track.addEventListener('ended', () => {
        if (stream.getTracks().includes(track)) stream.removeTrack(track);
        this.onRemoteStream?.(remoteSocketId, stream, meta);
      }, { once: true });
      this.onRemoteStream?.(remoteSocketId, stream, meta);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this._removePeer(remoteSocketId);
      }
    };

    this.peers.set(remoteSocketId, pc);
    return pc;
  }

  async _negotiate(pc, remoteSocketId) {
    const sessionId = this.sessionId;
    if (pc.connectionState === 'closed' || pc.signalingState !== 'stable' || pc._makingOffer) return;
    pc._makingOffer = true;
    try {
      const offer = await pc.createOffer();
      if (sessionId !== this.sessionId || pc.connectionState === 'closed' || pc.signalingState !== 'stable') return;
      await pc.setLocalDescription(offer);
      if (sessionId !== this.sessionId || pc.connectionState === 'closed') return;
      socketService.emit('webrtc:offer', { to: remoteSocketId, sdp: pc.localDescription });
    } catch (error) {
      console.error('Could not negotiate a peer connection:', error);
    } finally {
      pc._makingOffer = false;
    }
  }

  async _flushCandidates(remoteSocketId, pc) {
    const candidates = this.pendingCandidates.get(remoteSocketId) || [];
    this.pendingCandidates.delete(remoteSocketId);
    for (const candidate of candidates) {
      if (pc.connectionState === 'closed') return;
      try {
        await pc.addIceCandidate(candidate);
      } catch (error) {
        if (!pc._ignoreOffer) console.error('Could not add a queued ICE candidate:', error);
      }
    }
  }

  _removePeer(remoteSocketId) {
    const pc = this.peers.get(remoteSocketId);
    const stream = this.remoteStreams.get(remoteSocketId);
    if (!pc && !stream && !this.pendingCandidates.has(remoteSocketId)) return;
    this.peers.delete(remoteSocketId);
    this.pendingCandidates.delete(remoteSocketId);
    this.remoteStreams.delete(remoteSocketId);
    if (pc && pc.connectionState !== 'closed') pc.close();
    stream?.getTracks().forEach((track) => track.stop());
    this.onPeerLeft?.(remoteSocketId);
  }

  _listen(event, handler) {
    this.signalUnsubscribers.push(socketService.on(event, (...args) => {
      Promise.resolve(handler(...args)).catch((error) => {
        console.error(`WebRTC signaling event ${event} failed:`, error);
      });
    }));
  }

  startSignaling() {
    if (this.listening) return;
    this.listening = true;
    const sessionId = this.sessionId;

    this._listen('webrtc:peerJoined', async ({ socketId, userId, username }) => {
      if (!socketId || socketId === socketService.socket?.id) return;
      const pc = this._createPeerConnection(socketId, { userId, username });
      await this._negotiate(pc, socketId);
    });

    this._listen('webrtc:offer', async ({ from, userId, sdp }) => {
      if (!from || !sdp) return;
      const pc = this._createPeerConnection(from, { userId });
      const offerCollision = pc._makingOffer || pc.signalingState !== 'stable';
      pc._ignoreOffer = !pc._polite && offerCollision;
      if (pc._ignoreOffer) return;
      if (offerCollision) await pc.setLocalDescription({ type: 'rollback' });

      await pc.setRemoteDescription(sdp);
      if (sessionId !== this.sessionId || pc.connectionState === 'closed') return;
      await this._flushCandidates(from, pc);
      const answer = await pc.createAnswer();
      if (sessionId !== this.sessionId || pc.connectionState === 'closed') return;
      await pc.setLocalDescription(answer);
      if (sessionId !== this.sessionId || pc.connectionState === 'closed') return;
      socketService.emit('webrtc:answer', { to: from, sdp: pc.localDescription });
    });

    this._listen('webrtc:answer', async ({ from, sdp }) => {
      const pc = this.peers.get(from);
      if (pc && pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(sdp);
        if (sessionId === this.sessionId && pc.connectionState !== 'closed') {
          await this._flushCandidates(from, pc);
        }
      }
    });

    this._listen('webrtc:ice-candidate', async ({ from, candidate }) => {
      if (!from || !candidate) return;
      const pc = this.peers.get(from);
      if (!pc || !pc.remoteDescription) {
        const candidates = this.pendingCandidates.get(from) || [];
        candidates.push(candidate);
        this.pendingCandidates.set(from, candidates);
        return;
      }
      try {
        await pc.addIceCandidate(candidate);
      } catch (error) {
        if (!pc._ignoreOffer) throw error;
      }
    });

    this._listen('webrtc:peerDisconnected', ({ socketId }) => {
      if (socketId) this._removePeer(socketId);
    });

    socketService.emit('webrtc:ready');
  }

  broadcastMediaState({ micOn, cameraOn, screenSharing }) {
    socketService.emit('media:state', { micOn, cameraOn, screenSharing });
  }

  attachSpeakingDetector(stream, onChange, { threshold = 14 } = {}) {
    if (!stream || stream.getAudioTracks().length === 0) return () => {};
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return () => {};

    const context = new AudioCtx();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    let speaking = false;
    let frame;
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const average = data.reduce((sum, value) => sum + value, 0) / data.length;
      const next = average > threshold;
      if (next !== speaking) {
        speaking = next;
        onChange(speaking);
      }
      frame = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      source.disconnect();
      context.close().catch((error) => {
        console.error('Could not close the speaking detector audio context:', error);
      });
    };
  }

  stopAll() {
    this.sessionId += 1;
    this.signalUnsubscribers.splice(0).forEach((unsubscribe) => unsubscribe?.());
    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
    this.remoteStreams.forEach((stream) => stream.getTracks().forEach((track) => track.stop()));
    this.remoteStreams.clear();
    this.pendingCandidates.clear();
    this.stopStream(this.localStream);
    this.stopStream(this.screenStream);
    this.localStream = null;
    this.screenStream = null;
    this.listening = false;
    this.screenShareStopping = false;
    this.onLocalMediaChange?.(this.getMediaState());
  }
}

export const mediaService = new MediaService();
