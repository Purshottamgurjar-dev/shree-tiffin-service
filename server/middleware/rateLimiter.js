/**
 * rateLimiter.js
 * In-memory sliding-window rate limiter for sensitive endpoints
 * Protects auth, password-reset, payments, and order submission from abuse
 */

class MemoryRateLimiter {
  constructor() {
    this.requests = new Map();
    // Periodically clean up stale records every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000).unref();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter((t) => now - t < 15 * 60 * 1000);
      if (valid.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, valid);
      }
    }
  }

  createLimiter({ windowMs = 60 * 1000, max = 30, message = 'Too many requests. Please try again later.' }) {
    return (req, res, next) => {
      // Bypass rate limiting during test runs
      if (process.env.NODE_ENV === 'test') {
        return next();
      }

      // Identify client by IP (or forwarded IP)
      const ip =
        req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.socket.remoteAddress ||
        '127.0.0.1';

      const key = `${req.baseUrl || req.path}:${ip}`;
      const now = Date.now();

      const timestamps = this.requests.get(key) || [];
      const windowStart = now - windowMs;

      // Filter to only timestamps inside current window
      const recentTimestamps = timestamps.filter((t) => t > windowStart);

      if (recentTimestamps.length >= max) {
        res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
        return res.status(429).json({
          success: false,
          message,
          retryAfterSeconds: Math.ceil(windowMs / 1000),
        });
      }

      recentTimestamps.push(now);
      this.requests.set(key, recentTimestamps);

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - recentTimestamps.length));

      next();
    };
  }
}

const memoryLimiter = new MemoryRateLimiter();

// Sensitive authentication limiter: 25 requests per 15 minutes
export const authRateLimiter = memoryLimiter.createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: 'Too many authentication attempts from this IP. Please try again in 15 minutes.',
});

// Sensitive order submission limiter: 30 requests per minute
export const orderRateLimiter = memoryLimiter.createLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Order submission rate limit exceeded. Please wait a moment before trying again.',
});

// Sensitive payment initiation limiter: 30 requests per minute
export const paymentRateLimiter = memoryLimiter.createLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Payment verification rate limit exceeded. Please wait a moment before trying again.',
});

export default memoryLimiter;
