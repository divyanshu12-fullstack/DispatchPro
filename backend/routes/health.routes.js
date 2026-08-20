const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'ok',
    uptime: process.uptime(),
    // 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
    db: { readyState: mongoose.connection.readyState },
    env: process.env.NODE_ENV || 'development',
  });
});

module.exports = router;