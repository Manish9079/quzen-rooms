export async function socketAuthMiddleware(socket, next) {
  try {
    // WebRTC signaling-only mode.
    // User identity will be supplied in room:join payload.
    socket.user = {
      id: socket.id,
      username: 'guest',
      displayName: 'Guest',
    };

    next();
  } catch {
    next(new Error('UNAUTHORIZED'));
  }
}