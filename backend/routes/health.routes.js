import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      uptime: process.uptime(),
      // 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
      db: { readyState: mongoose.connection.readyState },
    },
    message: 'ok',
    env: process.env.NODE_ENV || 'development',
  });
});

export default router;