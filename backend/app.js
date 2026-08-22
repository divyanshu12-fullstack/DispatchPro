import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { ApiError } from './utils/ApiError.js';

export function createApp() {
  const app = express();

  app.use(helmet());

  const rawOrigins = (process.env.CORS_ORIGIN || '').trim();
  if (!rawOrigins) {
    // Fail closed: no wildcard, no implicit allow. Set CORS_ORIGIN in .env.
    throw new Error('CORS_ORIGIN is not set. Define it in your .env (see .env.example).');
  }
  const allowList = rawOrigins.split(',').map((s) => s.trim()).filter(Boolean);

  app.use(
    cors({
      origin: (origin, cb) => {
        // No Origin header = server-to-server / curl / Postman; allow it.
        if (!origin) return cb(null, true);
        if (allowList.includes(origin)) return cb(null, true);
        return cb(new Error(`CORS: origin '${origin}' not allowed`));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);

  // Future steps mount here: /api/orders, etc.

  app.use((req, _res, next) => {
    next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
  });

  // Centralized error handler must be the last middleware.
  app.use(errorMiddleware);

  return app;
}