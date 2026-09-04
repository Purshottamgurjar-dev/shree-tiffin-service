import api from './api';

/**
 * Customer: Place new order from active cart & selected address
 */
export const createOrder = async (orderData, idempotencyKey) => {
  const headers = {};
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  const response = await api.post('/orders', orderData, { headers });
  return response.data;
};

/**
 * Customer: Get customer's orders history
 */
export const getMyOrders = async () => {
  const response = await api.get('/orders/my');
  return response.data;
};

/**
 * Customer: Get single order details
 */
export const getMyOrderById = async (id) => {
  const response = await api.get(`/orders/my/${id}`);
  return response.data;
};

/**
 * Customer: Cancel order (Pending status only)
 */
export const cancelMyOrder = async (id, reason) => {
  const response = await api.patch(`/orders/my/${id}/cancel`, { reason });
  return response.data;
};

/**
 * Owner: Get all orders with search, status filters, date range, pagination
 */
export const getAllOrders = async (params = {}) => {
  const response = await api.get('/orders', { params });
  return response.data;
};

/**
 * Owner: Get single order details by ID
 */
export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

/**
 * Owner: Update order status with strict workflow validation
 */
export const updateOrderStatus = async (id, status, note = '') => {
  const response = await api.patch(`/orders/${id}/status`, { status, note });
  return response.data;
};

/**
 * Owner: Cancel order
 */
export const cancelOrderByOwner = async (id, reason = '') => {
  const response = await api.patch(`/orders/${id}/cancel`, { reason });
  return response.data;
};

/**
 * Owner: Get operational dashboard KPIs
 */
export const getDashboardKPIs = async () => {
  const response = await api.get('/orders/dashboard-kpis');
  return response.data;
};

/**
 * Owner: Get orders requiring delivery management
 */
export const getDeliveryOrders = async () => {
  const response = await api.get('/orders/delivery-orders');
  return response.data;
};

