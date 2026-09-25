import { asyncHandler } from '../utils/asyncHandler.js';
import { db } from '../config/dynamo.js';

export const health = asyncHandler(async (req, res) => {
  let dbStatus = 'ok';
  try {
    await db.$queryRaw();
  } catch {
    dbStatus = 'unreachable';
  }
  const statusCode = dbStatus === 'ok' ? 200 : 503;
  res.status(statusCode).json({
    success: dbStatus === 'ok',
    data: { status: dbStatus === 'ok' ? 'healthy' : 'degraded', database: dbStatus, uptime: process.uptime() },
  });
});
