import crypto from 'node:crypto';

/**
 * requestIdMiddleware.js
 * Lightweight production request ID middleware for Shree Tiffin Service
 * "Ghar Jaisa Khana, Har Din."
 * 
 * Extracts incoming X-Request-Id or generates a cryptographically random UUID v4.
 * Attaches req.id and sets X-Request-Id header on response for end-to-end traceability.
 */
export const requestIdMiddleware = (req, res, next) => {
  const incomingId = req.headers['x-request-id'];
  const requestId = typeof incomingId === 'string' && incomingId.trim()
    ? incomingId.trim()
    : crypto.randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};

export default requestIdMiddleware;
