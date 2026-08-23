import 'dotenv/config';

import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { startAssignmentSweep, stopAssignmentSweep } from './services/dispatch.service.js';

function assertRequiredEnv() {
  const required = ['MONGO_URI', 'JWT_SECRET', 'CORS_ORIGIN'];
  const missing = required.filter((k) => !process.env[k] || !String(process.env[k]).trim());
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'See backend/.env.example.'
    );
  }
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.JWT_SECRET.length < 32
  ) {
    throw new Error('JWT_SECRET must be at least 32 characters in production.');
  }

  // Email: real sending requires RESEND_API_KEY + EMAIL_FROM. If EMAIL_STUB=true,
  // the email service logs to console instead of calling Resend — useful in dev.
  const stubbed = process.env.EMAIL_STUB === 'true';
  if (!stubbed) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set. Set it in .env, or EMAIL_STUB=true to log instead.');
    }
    if (!process.env.EMAIL_FROM) {
      throw new Error('EMAIL_FROM is not set. Set it in .env (e.g. "App <no-reply@yourdomain.com>").');
    }
  }
}

async function bootstrap() {
  assertRequiredEnv();

  await connectDB();

  const app = createApp();
  const port = Number(process.env.PORT) || 8080;

  const server = app.listen(port, () => {
    console.log(`[server] Listening on http://localhost:${port} (${process.env.NODE_ENV || 'development'})`);
  });

  startAssignmentSweep();

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down...`);
    stopAssignmentSweep();
    server.close(() => {
      console.log('[server] HTTP server closed.');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Last-resort nets — asyncHandler should prevent these under normal request flow.
process.on('unhandledRejection', (reason) => {
  console.error('[fatal] Unhandled Promise Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[fatal] Uncaught Exception:', err);
  process.exit(1);
});

bootstrap().catch((err) => {
  console.error('[boot] Failed to start server:', err);
  process.exit(1);
});