import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';

import { env } from './config/env.js';
import { corsOptions } from './config/cors.js';
import routes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';
import { generalLimiter } from './middleware/rateLimit.middleware.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1); // needed for correct req.ip / rate-limit behind Nginx

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(morgan(env.isProd ? 'combined' : 'dev'));
  app.use(generalLimiter);

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
