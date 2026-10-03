function canSignalPeer(io, socket, targetSocketId) {
  const roomCode = socket.data.roomCode;
  if (!roomCode || !targetSocketId || targetSocketId === socket.id) return false;
  return io.sockets.adapter.rooms.get(roomCode)?.has(targetSocketId) === true;
}

function sdpAllowed(socket, sdp) {
  const permissions = socket.data.roomMediaPermissions || {};
  const description = sdp.sdp || '';
  if (permissions.videoEnabled === false && /^m=audio\s/m.test(description)) return false;
  if (permissions.videoEnabled === false && permissions.screenShareEnabled === false &&
      /^m=video\s/m.test(description)) return false;
  return true;
}

export function registerWebrtcHandlers(io, socket) {
  socket.on('webrtc:ready', async () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const peers = await io.in(roomCode).fetchSockets();
    for (const peer of peers) {
      if (peer.id === socket.id) continue;
      const state = peer.data.mediaState || {};
      socket.emit('media:state', {
        userId: peer.data.userId,
        socketId: peer.id,
        micOn: Boolean(state.micOn),
        cameraOn: Boolean(state.cameraOn),
        screenSharing: Boolean(state.screenSharing),
      });
    }

    socket.to(roomCode).emit('webrtc:peerJoined', {
      socketId: socket.id,
      userId: socket.user.id,
      username: socket.user.username,
    });
  });

  socket.on('webrtc:offer', ({ to, sdp } = {}) => {
    if (!canSignalPeer(io, socket, to) || !sdp) return;
    if (!sdpAllowed(socket, sdp)) return;
    io.to(to).emit('webrtc:offer', { from: socket.id, userId: socket.user.id, sdp });
  });

  socket.on('webrtc:answer', ({ to, sdp } = {}) => {
    if (!canSignalPeer(io, socket, to) || !sdp) return;
    if (!sdpAllowed(socket, sdp)) return;
    io.to(to).emit('webrtc:answer', { from: socket.id, userId: socket.user.id, sdp });
  });

  socket.on('webrtc:ice-candidate', ({ to, candidate } = {}) => {
    if (!canSignalPeer(io, socket, to) || !candidate) return;
    io.to(to).emit('webrtc:ice-candidate', { from: socket.id, candidate });
  });

  socket.on('media:state', ({ micOn, cameraOn, screenSharing } = {}) => {
    if (!socket.data.roomCode) return;
    const permissions = socket.data.roomMediaPermissions || {};
    socket.data.mediaState = {
      micOn: Boolean(micOn && permissions.videoEnabled !== false),
      cameraOn: Boolean(cameraOn && permissions.videoEnabled !== false),
      screenSharing: Boolean(screenSharing && permissions.screenShareEnabled !== false),
    };
    socket.to(socket.data.roomCode).emit('media:state', {
      userId: socket.user.id,
      socketId: socket.id,
      ...socket.data.mediaState,
    });
  });

  socket.on('disconnect', () => {
    if (socket.data.roomCode) {
      socket.to(socket.data.roomCode).emit('webrtc:peerDisconnected', { socketId: socket.id, userId: socket.user.id });
    }
  });
}
