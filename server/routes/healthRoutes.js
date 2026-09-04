import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * @desc    Check server and API liveness / health status
 * @route   GET /api/health
 * @access  Public
 */
router.get('/', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const memUsage = process.memoryUsage();

  res.status(200).json({
    success: true,
    status: isDbConnected ? 'online' : 'degraded',
    database: dbStatusMap[mongoose.connection.readyState] || 'unknown',
    appName: 'Shree Tiffin Service API',
    tagline: 'Ghar Jaisa Khana, Har Din.',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    requestId: req.id || null,
    memory: {
      rssMb: Math.round(memUsage.rss / (1024 * 1024)),
      heapUsedMb: Math.round(memUsage.heapUsed / (1024 * 1024)),
    },
  });
});

/**
 * @desc    Readiness probe verifying database connectivity for traffic serving
 * @route   GET /api/health/ready
 * @access  Public
 */
router.get('/ready', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  if (!isDbConnected) {
    return res.status(503).json({
      success: false,
      ready: false,
      status: 'not_ready',
      database: 'disconnected',
      message: 'Database connection not ready to serve traffic',
      timestamp: new Date().toISOString(),
      requestId: req.id || null,
    });
  }

  res.status(200).json({
    success: true,
    ready: true,
    status: 'ready',
    database: 'connected',
    message: 'Application is ready to receive and serve production traffic',
    timestamp: new Date().toISOString(),
    requestId: req.id || null,
  });
});

export default router;
