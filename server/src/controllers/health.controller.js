import { asyncHandler } from '../utils/asyncHandler.js';
import { prisma } from '../config/prisma.js';

export const health = asyncHandler(async (req, res) => {
  let dbStatus = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'unreachable';
  }
  const statusCode = dbStatus === 'ok' ? 200 : 503;
  res.status(statusCode).json({
    success: dbStatus === 'ok',
    data: { status: dbStatus === 'ok' ? 'healthy' : 'degraded', database: dbStatus, uptime: process.uptime() },
  });
});
