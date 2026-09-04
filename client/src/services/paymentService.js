import api from './api';

/**
 * Dynamically loads the Razorpay checkout script if not already present
 * @returns {Promise<boolean>}
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.warn('[Payment Service] Failed to load external Razorpay checkout.js script.');
      resolve(false);
    };

    document.body.appendChild(script);
  });
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
  selectCodPayment,
  createOnlineOrder,
  verifyOnlinePayment,
  recordPaymentFailure,
  getMyPayments,
  getAllPayments,
  getPaymentById,
  collectCodPayment,
};
