import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

if (isProd && !process.env.JWT_ACCESS_SECRET) {
  throw new Error('JWT_ACCESS_SECRET is required in production');
}

if (!isProd && !process.env.JWT_ACCESS_SECRET) {
  process.env.JWT_ACCESS_SECRET = 'dev-local-secret-change-me';
}

if (!process.env.AWS_REGION) {
  process.env.AWS_REGION = 'ap-south-1';
}

const requiredDynamoTableKeys = [
  'DYNAMO_USERS_TABLE',
  'DYNAMO_ROOMS_TABLE',
  'DYNAMO_PARTICIPANTS_TABLE',
  'DYNAMO_MESSAGES_TABLE',
  'DYNAMO_REFRESH_TOKENS_TABLE',
];

const missingDynamoTables = isProd
  ? requiredDynamoTableKeys.filter((key) => !process.env[key])
  : [];

if (missingDynamoTables.length > 0) {
  throw new Error(`Missing required production DynamoDB table environment variables: ${missingDynamoTables.join(', ')}`);
}

for (const key of requiredDynamoTableKeys) {
  if (!process.env[key] && !isProd) {
    process.env[key] = `quzen-${key.toLowerCase().replace(/_table$/, '').replace(/_/g, '-')}-dev`;
  }
}

export const env = {
  nodeEnv,
  isProd,
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
