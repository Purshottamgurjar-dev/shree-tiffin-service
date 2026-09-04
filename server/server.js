import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import mealRoutes from './routes/mealRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { securityHeaders } from './middleware/securityMiddleware.js';
import { requestIdMiddleware } from './middleware/requestIdMiddleware.js';
import { seedOwnerUser } from './utils/seedOwner.js';
import { seedMeals } from './utils/seedMeals.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (supports dedicated .env.test during test runs)
const envFile = process.env.DOTENV_CONFIG_PATH || (process.env.NODE_ENV === 'test' ? '.env.test' : '.env');
dotenv.config({ path: envFile });

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. HTTP Security Headers & Request ID Traceability
app.use(securityHeaders);
app.use(requestIdMiddleware);

// 2. Database Connection & Initial Seeds
connectDB().then(async () => {
  try {
    await seedOwnerUser();
    await seedMeals();
  } catch (err) {
    console.error(`[Startup Notice] Seed error: ${err.message}`);
  }
});

// 3. Environment-Aware Production CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile native apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // In production, strictly enforce configured CLIENT_URL (supports multiple comma-separated domains and strips trailing slashes)
      if (process.env.NODE_ENV === 'production') {
        const allowedOrigins = CLIENT_URL.split(',').map((u) => u.trim().replace(/\/$/, ''));
        const normalizedOrigin = origin.replace(/\/$/, '');
        if (allowedOrigins.includes(normalizedOrigin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS policy: Access denied for origin ${origin}`), false);
      }

      // In development / test, allow localhost and private LAN IPs for mobile testing
      const isLocalOrLAN =
        /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(
          origin
        );

      if (origin === CLIENT_URL || isLocalOrLAN) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);

// 4. Body parsing middleware (preserves raw body for webhook HMAC signature verification)
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// 5. HTTP Request Logging in development
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 6. Mount Health & Readiness Routes
app.use('/api/health', healthRoutes);
app.use('/api/ready', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  if (!isDbConnected) {
    return res.status(503).json({
      success: false,
      ready: false,
      status: 'not_ready',
      database: 'disconnected',
    });
  }
  res.status(200).json({
    success: true,
    ready: true,
    status: 'ready',
    database: 'connected',
  });
});

// 7. Mount Core API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);

// 8. Serve Client Static Assets in Production if built (Fullstack deployment mode)
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // SPA fallback for non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // Root welcome route if running API-only mode without static build
  app.get('/', (req, res) => {
    res.json({
      message: 'Welcome to Shree Tiffin Service API',
      tagline: 'Ghar Jaisa Khana, Har Din.',
      healthCheck: '/api/health',
      readinessCheck: '/api/ready',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    });
  });
}

// 9. Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// 10. Start HTTP Server
const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🍲 SHREE TIFFIN SERVICE BACKEND SERVER RUNNING`);
  console.log(`✨ Tagline: Ghar Jaisa Khana, Har Din.`);
  console.log(`🚀 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Port: ${PORT}`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🚥 Readiness: http://localhost:${PORT}/api/ready`);
  console.log('====================================================');
});

// 11. Graceful Shutdown Handlers
const handleShutdown = (signal) => {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
  server.close(async () => {
    console.log('[Server] HTTP server closed.');
    try {
      await mongoose.connection.close(false);
      console.log('[Server] MongoDB connection cleanly closed.');
      process.exit(0);
    } catch (err) {
      console.error('[Server Error] Error closing MongoDB connection:', err.message);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('[Server Error] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default app;
