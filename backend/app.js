const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/health.routes');
const errorMiddleware = require('./middleware/error.middleware');
const ApiError = require('./utils/ApiError');

function createApp() {
  const app = express();

  const rawOrigins = (process.env.CORS_ORIGIN || '*').trim();
  const allowAll = rawOrigins === '*';
  const allowList = allowAll ? [] : rawOrigins.split(',').map((s) => s.trim()).filter(Boolean);

  const corsOptions = allowAll
    ? { origin: true, credentials: true }
    : {
        origin: (origin, cb) => {
          // No Origin header = server-to-server / curl / Postman; allow it.
          if (!origin) return cb(null, true);
          if (allowList.includes(origin)) return cb(null, true);
          return cb(new Error(`CORS: origin '${origin}' not allowed`));
        },
        credentials: true,
      };

  app.use(cors(corsOptions));

  if (process.env.NODE_ENV !== 'production' && allowAll) {
    console.warn('[cors] CORS_ORIGIN is "*". Set a real allowlist before deploying.');
  }

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use('/api/health', healthRoutes);

  // Mounted route trees are added by later steps (auth, orders, ...).

  app.use((req, _res, next) => {
    next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
  });

  // Centralized error handler must be the last middleware.
  app.use(errorMiddleware);

  return app;
}

module.exports = createApp;