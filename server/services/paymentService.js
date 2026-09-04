import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

const cleanEnvValue = (val) => {
  if (!val) return '';
  return String(val).trim().replace(/^['"]|['"]$/g, '');
};

const getKeyId = () => cleanEnvValue(process.env.RAZORPAY_KEY_ID);
const getKeySecret = () => cleanEnvValue(process.env.RAZORPAY_KEY_SECRET);
const getWebhookSecret = () => cleanEnvValue(process.env.RAZORPAY_WEBHOOK_SECRET);

/**
 * Returns whether Razorpay has non-empty credentials configured.
 * Safely ignores obvious dummy/placeholder values.
 */
export const isRazorpayConfigured = () => {
  const keyId = getKeyId();
  const keySecret = getKeySecret();
  if (!keyId || !keySecret) return false;
  if (keyId.includes('placeholder') || keySecret.includes('placeholder')) return false;
  return keyId.startsWith('rzp_test_') || keyId.startsWith('rzp_live_');
};

/**
 * Returns safe key prefix without exposing full key or secret
 */
export const getSafeKeyPrefix = () => {
  const keyId = getKeyId();
  if (keyId.startsWith('rzp_test_')) return 'rzp_test_';
  if (keyId.startsWith('rzp_live_')) return 'rzp_live_';
  return null;
};

/**
 * Validates that an order ID is a genuine Razorpay order format.
 * Genuine IDs start with 'order_' followed by alphanumeric characters.
 * Fake test/sandbox IDs (e.g., order_test_, fake_, sandbox_) are rejected.
 */
export const isGenuineRazorpayOrderId = (orderId) => {
  if (typeof orderId !== 'string') return false;
  if (
    orderId.startsWith('order_test_') ||
    orderId.startsWith('fake_') ||
    orderId.startsWith('sandbox_')
  ) {
    return false;
  }
  return /^order_[a-zA-Z0-9]{10,35}$/.test(orderId);
};

/**
 * Lazy initialization of Razorpay SDK instance
 */
let razorpayInstance = null;

export const getRazorpayInstance = () => {
  const key_id = getKeyId();
  const key_secret = getKeySecret();

  if (!key_id || !key_secret) {
    return null;
  }

  if (!razorpayInstance) {
    try {
      razorpayInstance = new Razorpay({
        key_id,
        key_secret,
      });
    } catch (err) {
      console.warn(`[Payment Service] Could not instantiate Razorpay SDK: ${err.message}`);
      return null;
    }
  }

  return razorpayInstance;
};

/**
 * Create a gateway order with Razorpay
 * In production: NEVER generates fake or offline order IDs.
 * If credentials fail or gateway is unavailable, throws ONLINE_PAYMENT_UNAVAILABLE.
 *
 * @param {Object} params - { orderNumber, amountInPaise, currency, notes }
 * @returns {Promise<Object>} { gatewayOrderId, amount, currency, status }
 */
export const createGatewayOrder = async ({
  orderNumber,
  amountInPaise,
  currency = 'INR',
  notes = {},
}) => {
  if (!amountInPaise || amountInPaise < 100) {
    throw new Error('Invalid payment amount. Minimum payable amount is ₹1 (100 paise).');
  }

  const isProd = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';
  const razorpay = getRazorpayInstance();

  // 1. Attempt genuine Razorpay order creation if SDK is initialized
  if (razorpay && !getKeyId().includes('placeholder')) {
    try {
      const options = {
        amount: Math.round(amountInPaise),
        currency: currency.toUpperCase(),
        receipt: (orderNumber || 'STS-ORDER').slice(0, 40),
        notes: {
          orderNumber: orderNumber || '',
          appName: 'Shree Tiffin Service',
          ...notes,
        },
      };

      const gatewayOrder = await razorpay.orders.create(options);

      // Verify returned ID is genuine
      if (!gatewayOrder || !gatewayOrder.id || !isGenuineRazorpayOrderId(gatewayOrder.id)) {
        throw new Error('Payment gateway returned an invalid or malformed order ID.');
      }

      return {
        gatewayOrderId: gatewayOrder.id,
        amount: gatewayOrder.amount,
        currency: gatewayOrder.currency,
        status: gatewayOrder.status,
      };
    } catch (err) {
      const isAuthError = err.statusCode === 401;
      const safeErrMsg = isAuthError
        ? 'Authentication failed (check RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET credentials)'
        : (err.error?.description || err.message);

      console.error(`[Razorpay Gateway Call Failed] Status: ${err.statusCode || 'Unknown'} — ${safeErrMsg}`);

      // In production or when online payment cannot be authenticated:
      // NEVER generate a fake order ID!
      if (isProd || !isTest) {
        const paymentError = new Error(
          'Online payment gateway is temporarily unavailable. Please pay via Cash on Delivery or try again shortly.'
        );
        paymentError.code = 'ONLINE_PAYMENT_UNAVAILABLE';
        paymentError.statusCode = 503;
        paymentError.isGatewayError = true;
        throw paymentError;
      }
    }
  }

  // 2. Production Safety Guard: If in production and Razorpay is not configured or failed
  if (isProd) {
    const paymentError = new Error(
      'Online payment gateway is not configured. Please select Cash on Delivery.'
    );
    paymentError.code = 'ONLINE_PAYMENT_UNAVAILABLE';
    paymentError.statusCode = 503;
    throw paymentError;
  }

  // 3. Automated Local Test Isolation ONLY:
  // Allow deterministic mock order generation strictly for local automated tests (NODE_ENV === 'test')
  if (isTest) {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const mockOrderId = `order_test_${timestamp}_${randomSuffix}`;

    return {
      gatewayOrderId: mockOrderId,
      amount: Math.round(amountInPaise),
      currency: currency.toUpperCase(),
      status: 'created',
      isMock: true,
    };
  }

  // In development without valid credentials: clean failure to alert developer
  const devError = new Error(
    'Online payment gateway credentials missing or unverified. Please configure valid RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in server/.env or select Cash on Delivery.'
  );
  devError.code = 'ONLINE_PAYMENT_UNAVAILABLE';
  devError.statusCode = 503;
  throw devError;
};

/**
 * Server-Side HMAC SHA256 Signature Verification
 * @param {Object} params - { gatewayOrderId, gatewayPaymentId, gatewaySignature }
 * @returns {boolean} true if signature matches
 */
export const verifyPaymentSignature = ({
  gatewayOrderId,
  gatewayPaymentId,
  gatewaySignature,
}) => {
  if (!gatewayOrderId || !gatewayPaymentId || !gatewaySignature) {
    return false;
  }

  // Production Safety: Reject fake order IDs in production
  if (
    process.env.NODE_ENV === 'production' &&
    (gatewayOrderId.startsWith('order_test_') ||
      gatewayOrderId.startsWith('fake_') ||
      gatewayOrderId.startsWith('sandbox_'))
  ) {
    console.error('[Payment Service] Rejecting fake order ID verification attempt in production environment.');
    return false;
  }

  const secret = getKeySecret();
  if (!secret) {
    console.error('[Payment Service] RAZORPAY_KEY_SECRET is not configured on server.');
    return false;
  }

  try {
    const payload = `${gatewayOrderId}|${gatewayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const actualBuffer = Buffer.from(gatewaySignature, 'utf8');

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch (err) {
    console.error(`[Payment Service] Error verifying signature: ${err.message}`);
    return false;
  }
};

/**
 * Helper to generate a valid test signature (useful for automated test suites)
 */
export const generateTestSignature = ({ gatewayOrderId, gatewayPaymentId, customSecret = null }) => {
  const secret = customSecret || getKeySecret();
  const payload = `${gatewayOrderId}|${gatewayPaymentId}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};

/**
 * Webhook HMAC SHA256 Signature Verification
 * @param {Object} params - { rawBody, signature }
 * @returns {boolean}
 */
export const verifyWebhookSignature = ({ rawBody, signature }) => {
  if (!rawBody || !signature) {
    return false;
  }

  const secret = getWebhookSecret();
  if (!secret) {
    console.error('[Payment Service] RAZORPAY_WEBHOOK_SECRET is not configured on server.');
    return false;
  }

  try {
    const rawString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawString)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const actualBuffer = Buffer.from(signature, 'utf8');

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch (err) {
    console.error(`[Payment Service] Webhook signature verification error: ${err.message}`);
    return false;
  }
};

/**
 * Safe diagnostic to verify genuine Razorpay Test Mode gateway connectivity.
 * Calls razorpay.orders.create with harmless ₹1 (100 paise).
 * NEVER exposes secrets or full credentials.
 */
export const testRealGatewayOrderCreation = async () => {
  const keyId = getKeyId();
  const keySecret = getKeySecret();

  if (!keyId || !keySecret) {
    return {
      success: false,
      configured: false,
      statusCode: 400,
      orderIdPrefix: null,
      message: 'Razorpay credentials not configured (RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing)',
    };
  }

  const razorpay = getRazorpayInstance();
  if (!razorpay) {
    return {
      success: false,
      configured: false,
      statusCode: 500,
      orderIdPrefix: null,
      message: 'Failed to initialize Razorpay SDK instance',
    };
  }

  try {
    const testReceipt = `diag_${Date.now().toString(36).slice(-8)}`;
    const gatewayOrder = await razorpay.orders.create({
      amount: 100, // ₹1 test amount
      currency: 'INR',
      receipt: testReceipt,
      notes: { purpose: 'diagnostic_gateway_verification', app: 'Shree Tiffin Service' },
    });

    const isGenuine = isGenuineRazorpayOrderId(gatewayOrder.id);

    return {
      success: true,
      configured: true,
      statusCode: 200,
      orderIdPrefix: gatewayOrder.id.slice(0, 10),
      currency: gatewayOrder.currency,
      amount: gatewayOrder.amount,
      isGenuineId: isGenuine,
      message: 'Genuine Razorpay Test Mode order successfully created via API',
    };
  } catch (err) {
    const statusCode = err.statusCode || (err.error?.code === 'BAD_REQUEST_ERROR' ? 400 : 500);
    const description = err.error?.description || err.message;

    return {
      success: false,
      configured: true,
      statusCode,
      orderIdPrefix: null,
      message: description,
      isAuthError: statusCode === 401,
    };
  }
};

/**
 * Public configuration safe to return to client
 */
export const getPublicPaymentConfig = () => {
  const keyId = getKeyId();
  const configured = isRazorpayConfigured();
  return {
    keyId: configured ? keyId : '',
    currency: 'INR',
    isConfigured: configured,
    isTestMode: keyId.startsWith('rzp_test_'),
    keyPrefix: getSafeKeyPrefix(),
  };
};

export default {
  isRazorpayConfigured,
  getSafeKeyPrefix,
  isGenuineRazorpayOrderId,
  getRazorpayInstance,
  createGatewayOrder,
  verifyPaymentSignature,
  generateTestSignature,
  verifyWebhookSignature,
  testRealGatewayOrderCreation,
  getPublicPaymentConfig,
};
