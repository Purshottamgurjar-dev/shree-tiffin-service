/**
 * logger.js
 * Lightweight, structured, production-safe logger for Shree Tiffin Service
 * Automatically sanitizes sensitive credentials (passwords, tokens, HMAC secrets, CVVs)
 */

const SENSITIVE_KEYS = [
  'password',
  'newpassword',
  'token',
  'jwt',
  'authorization',
  'secret',
  'razorpay_signature',
  'razorpay_payment_id',
  'key_secret',
  'cvv',
];

/**
 * Recursively sanitize objects to avoid logging sensitive data
 */
export const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeData);

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

const formatMessage = (level, message, meta = null) => {
  const timestamp = new Date().toISOString();
  let logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (meta) {
    try {
      const sanitizedMeta = sanitizeData(meta);
      logLine += ` | Data: ${JSON.stringify(sanitizedMeta)}`;
    } catch {
      logLine += ` | Data: [Unserializable]`;
    }
  }
  return logLine;
};

export const logger = {
  info: (message, meta = null) => {
    console.log(formatMessage('INFO', message, meta));
  },
  warn: (message, meta = null) => {
    console.warn(formatMessage('WARN', message, meta));
  },
  error: (message, meta = null) => {
    console.error(formatMessage('ERROR', message, meta));
  },
};

export default logger;
