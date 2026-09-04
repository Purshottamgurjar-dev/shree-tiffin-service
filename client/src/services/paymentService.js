import api from './api';

/**
 * Dynamically loads the Razorpay checkout script with timeout safeguard
 * @param {number} timeoutMs - Timeout in milliseconds (default: 8000ms)
 * @returns {Promise<boolean>}
 */
export const loadRazorpayScript = (timeoutMs = 8000) => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }

    let resolved = false;
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn('[Payment Service] Razorpay script loading timed out.');
        resolve(false);
      }
    }, timeoutMs);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve(true);
      }
    };
    script.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        console.warn('[Payment Service] Failed to load external Razorpay checkout.js script.');
        resolve(false);
      }
    };

    document.body.appendChild(script);
  });
};

/**
 * Standardized Razorpay Checkout options builder with mobile UPI Intent priority
 */
export const buildRazorpayOptions = ({
  keyId,
  amountInPaise,
  currency = 'INR',
  gatewayOrderId,
  orderId,
  orderNumber,
  customerName = '',
  customerEmail = '',
  customerPhone = '',
  deliveryAddress = '',
  onSuccess,
  onDismiss,
}) => {
  const cleanPhone = (customerPhone || '').replace(/\D/g, '').slice(-10);

  return {
    key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || '',
    amount: amountInPaise,
    currency: currency || 'INR',
    name: 'Shree Tiffin Service',
    description: `Homestyle Tiffin Order #${orderNumber || ''}`,
    order_id: gatewayOrderId,
    prefill: {
      name: customerName || '',
      email: customerEmail || '',
      contact: cleanPhone,
      method: 'upi', // Pre-selects UPI for instant mobile app surfacing
    },
    config: {
      display: {
        blocks: {
          upi: {
            name: 'Pay via UPI (PhonePe, Google Pay, Paytm)',
            instruments: [
              { method: 'upi' },
            ],
          },
          other: {
            name: 'Cards, Netbanking & Wallets',
            instruments: [
              { method: 'card' },
              { method: 'netbanking' },
              { method: 'wallet' },
            ],
          },
        },
        sequence: ['block.upi', 'block.other'],
        preferences: {
          show_default_blocks: true,
        },
      },
    },
    notes: {
      orderId: String(orderId || ''),
      orderNumber: String(orderNumber || ''),
      deliveryAddress: String(deliveryAddress || '').slice(0, 100),
      appName: 'Shree Tiffin Service',
    },
    theme: {
      color: '#c2410c',
      backdrop_color: 'rgba(0, 0, 0, 0.65)',
    },
    modal: {
      confirm_close: true,
      escape: false,
      handleback: true,
      animation: true,
      ondismiss: typeof onDismiss === 'function' ? onDismiss : () => {},
    },
    retry: {
      enabled: true,
      max_count: 3,
    },
    send_sms_hash: true,
    timeout: 900, // 15 minutes timeout for mobile app switching & authorization
    handler: typeof onSuccess === 'function' ? onSuccess : () => {},
  };
};


/**
 * Select Cash on Delivery (COD) for an order
 */
export const selectCodPayment = async (orderId) => {
  const response = await api.post('/payments/cod', { orderId });
  return response.data;
};

/**
 * Create a gateway order for online payment
 */
export const createOnlineOrder = async (orderId) => {
  const response = await api.post('/payments/create-order', { orderId });
  return response.data;
};

/**
 * Send candidate gateway response to server for cryptographic HMAC verification
 */
export const verifyOnlinePayment = async ({
  orderId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  const response = await api.post('/payments/verify', {
    orderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });
  return response.data;
};

/**
 * Record a payment failure
 */
export const recordPaymentFailure = async ({ orderId, gatewayOrderId, reason }) => {
  const response = await api.post('/payments/failure', {
    orderId,
    gatewayOrderId,
    reason,
  });
  return response.data;
};

/**
 * Customer: Get personal payment history
 */
export const getMyPayments = async () => {
  const response = await api.get('/payments/my');
  return response.data;
};

/**
 * Owner: Get all payments with filtering, search, pagination, and KPI revenue metrics
 */
export const getAllPayments = async (params = {}) => {
  const response = await api.get('/payments', { params });
  return response.data;
};

/**
 * Owner: Get single payment details
 */
export const getPaymentById = async (id) => {
  const response = await api.get(`/payments/${id}`);
  return response.data;
};

/**
 * Owner: Mark Cash on Delivery as collected
 */
export const collectCodPayment = async (paymentId) => {
  const response = await api.patch(`/payments/${paymentId}/cod-collect`);
  return response.data;
};

export default {
  loadRazorpayScript,
  buildRazorpayOptions,
  selectCodPayment,
  createOnlineOrder,
  verifyOnlinePayment,
  recordPaymentFailure,
  getMyPayments,
  getAllPayments,
  getPaymentById,
  collectCodPayment,
};
