import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    // Fail fast and loudly rather than booting with a half-broken config.
    // eslint-disable-next-line no-console
    console.error(`[env] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 4000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshTokenExpiresInDays: Number(process.env.JWT_REFRESH_EXPIRES_IN_DAYS) || 30,

  cookieDomain: process.env.COOKIE_DOMAIN || 'localhost',
  cookieSecure: process.env.COOKIE_SECURE === 'true',

  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  generalRateLimitMax: Number(process.env.GENERAL_RATE_LIMIT_MAX) || 300,
};
