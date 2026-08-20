require('dotenv').config();

const createApp = require('./app');
const connectDB = require('./config/db');

function assertRequiredEnv() {
  const required = ['MONGO_URI', 'JWT_SECRET'];
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
}

async function bootstrap() {
  assertRequiredEnv();

  await connectDB();

  const app = createApp();
  const port = Number(process.env.PORT) || 8080;

  const server = app.listen(port, () => {
    console.log(`[server] Listening on http://localhost:${port} (${process.env.NODE_ENV || 'development'})`);
  });

  // SIGTERM is what Render/Railway send on deploy; let in-flight requests finish.
  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down...`);
    server.close(() => {
      console.log('[server] HTTP server closed.');
      process.exit(0);
    });
    // Hard exit if shutdown takes too long.
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