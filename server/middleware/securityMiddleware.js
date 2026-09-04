/**
 * securityMiddleware.js
 * Production HTTP security headers for Shree Tiffin Service
 * Configured specifically to maintain 100% compatibility with Razorpay Gateway & Leaflet Maps
 */

export const securityHeaders = (req, res, next) => {
  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Mitigate clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Cross-Site Scripting filter protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Protect referrer leakage
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy compatible with Razorpay and Leaflet OpenStreetMap
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; frame-src https://api.razorpay.com https://checkout.razorpay.com; img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.razorpay.com; connect-src 'self' https://lumberjack.razorpay.com https://api.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;"
  );

  // Disable browser caching for sensitive API responses
  if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/payments')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

export default securityHeaders;
