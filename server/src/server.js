import http from 'node:http';
import { createApp } from './app.js';
import { initSocket } from './socket/index.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

const app = createApp();
const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Quzen Rooms API listening on :${env.port} (${env.nodeEnv})`);
});

async function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received. Shutting down...`);
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 8000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
