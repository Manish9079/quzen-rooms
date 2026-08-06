import { env } from './env.js';

// Single-origin allowlist for V1 (the Quzen Rooms frontend). Extend this
// array (or read a comma-separated env var) if you add more clients.
const allowedOrigins = [env.clientUrl];

export const corsOptions = {
  origin(origin, callback) {
    // Allow same-origin / server-to-server requests with no Origin header.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

export { allowedOrigins };
