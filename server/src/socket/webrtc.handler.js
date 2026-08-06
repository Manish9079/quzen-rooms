/**
 * WebRTC signaling relay only — no media ever touches this server.
 * Clients exchange SDP offers/answers and ICE candidates addressed to a
 * specific peer's socket id; this module just forwards them and announces
 * peer join/leave and mic/camera/screen-share state changes to the room.
 *
 * For rooms beyond ~6-8 participants, replace this full-mesh signaling
 * with a call to an SFU (see the note in the README) — the event names
 * below are deliberately SFU-agnostic so the frontend doesn't need to
 * change when that happens.
 */
export function registerWebrtcHandlers(io, socket) {
  socket.on('webrtc:ready', () => {
    if (!socket.data.roomId) return;
    // Tell existing peers a new one is ready to negotiate, and tell the
    // new peer who's already there so it can initiate offers to each.
    socket.to(socket.data.roomId).emit('webrtc:peerJoined', {
      socketId: socket.id,
      userId: socket.user.id,
      username: socket.user.username,
    });
  });

  socket.on('webrtc:offer', ({ to, sdp } = {}) => {
    if (!to || !sdp) return;
    io.to(to).emit('webrtc:offer', { from: socket.id, userId: socket.user.id, sdp });
  });

  socket.on('webrtc:answer', ({ to, sdp } = {}) => {
    if (!to || !sdp) return;
    io.to(to).emit('webrtc:answer', { from: socket.id, userId: socket.user.id, sdp });
  });

  socket.on('webrtc:ice-candidate', ({ to, candidate } = {}) => {
    if (!to || !candidate) return;
    io.to(to).emit('webrtc:ice-candidate', { from: socket.id, candidate });
  });

  socket.on('media:state', ({ micOn, cameraOn, screenSharing } = {}) => {
    if (!socket.data.roomId) return;
    socket.to(socket.data.roomId).emit('media:state', {
      userId: socket.user.id,
      socketId: socket.id,
      micOn: Boolean(micOn),
      cameraOn: Boolean(cameraOn),
      screenSharing: Boolean(screenSharing),
    });
  });

  socket.on('disconnect', () => {
    if (socket.data.roomId) {
      socket.to(socket.data.roomId).emit('webrtc:peerDisconnected', { socketId: socket.id, userId: socket.user.id });
    }
  });
}
