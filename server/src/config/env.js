import 'dotenv/config';

const required = ['JWT_ACCESS_SECRET', 'AWS_REGION', 'DYNAMO_USERS_TABLE', 'DYNAMO_ROOMS_TABLE', 'DYNAMO_PARTICIPANTS_TABLE', 'DYNAMO_MESSAGES_TABLE', 'DYNAMO_REFRESH_TOKENS_TABLE'];

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
  awsRegion: process.env.AWS_REGION,
  dynamoEndpoint: process.env.DYNAMO_ENDPOINT || undefined,
  dynamoTables: {
    users: process.env.DYNAMO_USERS_TABLE,
    rooms: process.env.DYNAMO_ROOMS_TABLE,
    participants: process.env.DYNAMO_PARTICIPANTS_TABLE,
    messages: process.env.DYNAMO_MESSAGES_TABLE,
    refreshTokens: process.env.DYNAMO_REFRESH_TOKENS_TABLE,
  },

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshTokenExpiresInDays: Number(process.env.JWT_REFRESH_EXPIRES_IN_DAYS) || 30,

  cookieDomain: process.env.COOKIE_DOMAIN || 'localhost',
  cookieSecure: process.env.COOKIE_SECURE === 'true',

  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  generalRateLimitMax: Number(process.env.GENERAL_RATE_LIMIT_MAX) || 300,
};
