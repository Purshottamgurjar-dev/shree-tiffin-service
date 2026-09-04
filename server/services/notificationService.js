import Notification from '../models/Notification.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

/**
 * notificationService.js
 * Centralized Notification Service for Shree Tiffin Service
 * "Ghar Jaisa Khana, Har Din."
 */

/**
 * 1. Base notification creator
 */
export const createNotification = async ({
  user,
  type = 'SYSTEM',
  title,
  message,
  order = null,
  metadata = {},
}) => {
  if (!user || !title || !message) {
    return null;
  }

  try {
    const notification = await Notification.create({
      user,
      type,
      title: title.trim(),
      message: message.trim(),
      order: order || null,
      metadata,
    });
    return notification;
  } catch (error) {
    console.error(`[Notification Service] Failed to create notification: ${error.message}`);
    return null;
  }
};

/**
 * 2. Automated Order Lifecycle Notification (Customer)
 * Supports both:
 * - createOrderNotification(orderDoc, eventType, extraData)
 * - createOrderNotification({ userId, orderId, orderNumber, status, total, ... })
 */
export const createOrderNotification = async (orderOrPayload, eventTypeArg, extraData = {}) => {
  if (!orderOrPayload) return null;

  const user = orderOrPayload.user || orderOrPayload.userId;
  if (!user) return null;

  const orderId = orderOrPayload._id || orderOrPayload.orderId;
  const orderNumber =
    orderOrPayload.orderNumber ||
    (orderId ? `STS-${orderId.toString().slice(-6)}` : 'Order');
  const orderStatus = orderOrPayload.orderStatus || orderOrPayload.status || 'Pending';
  const total = orderOrPayload.total;

  let eventType = eventTypeArg || orderOrPayload.type || orderOrPayload.eventType;
  if (!eventType) {
    const statusMap = {
      Pending: 'ORDER_PLACED',
      Confirmed: 'ORDER_CONFIRMED',
      Preparing: 'ORDER_PREPARING',
      'Out for Delivery': 'ORDER_OUT_FOR_DELIVERY',
      Delivered: 'ORDER_DELIVERED',
      Cancelled: 'ORDER_CANCELLED',
    };
    eventType = statusMap[orderStatus] || 'ORDER_PLACED';
  }

  let title = 'Order Update';
  let message = `Update on your order #${orderNumber}`;

  switch (eventType) {
    case 'ORDER_PLACED':
      title = 'Order Placed';
      message = `Your order #${orderNumber} has been placed successfully.`;
      break;
    case 'ORDER_CONFIRMED':
      title = 'Order Confirmed';
      message = `Your Shree Tiffin Service order #${orderNumber} has been confirmed.`;
      break;
    case 'ORDER_PREPARING':
      title = 'Kitchen Preparing';
      message = `Your fresh homestyle meal for order #${orderNumber} is being prepared.`;
      break;
    case 'ORDER_OUT_FOR_DELIVERY':
      title = 'Out for Delivery';
      message = `Your tiffin for order #${orderNumber} is out for delivery.`;
      break;
    case 'ORDER_DELIVERED':
      title = 'Order Delivered';
      message = `Your order #${orderNumber} has been delivered. Enjoy your meal!`;
      break;
    case 'ORDER_CANCELLED':
      title = 'Order Cancelled';
      message = `Your order #${orderNumber} has been cancelled.`;
      break;
    default:
      break;
  }

  return await createNotification({
    user,
    type: eventType,
    title,
    message,
    order: orderId || null,
    metadata: {
      orderId,
      orderNumber,
      orderStatus,
      total,
      ...extraData,
    },
  });
};

/**
 * 3. Payment Notification (Customer)
 * Only called after real verification
 * Supports both:
 * - createPaymentNotification(paymentDoc, orderDoc, eventType)
 * - createPaymentNotification({ userId, orderId, orderNumber, paymentId, amount, status })
 */
export const createPaymentNotification = async (paymentOrPayload, orderArg, eventTypeArg) => {
  if (!paymentOrPayload) return null;

  let user, orderId, orderNumber, paymentId, amount, method, eventType;

  if (paymentOrPayload.userId || (!orderArg && !eventTypeArg)) {
    user = paymentOrPayload.user || paymentOrPayload.userId;
    orderId = paymentOrPayload.order || paymentOrPayload.orderId;
    orderNumber = paymentOrPayload.orderNumber || (orderId ? `STS-${orderId.toString().slice(-6)}` : 'Order');
    paymentId = paymentOrPayload.paymentId;
    amount = paymentOrPayload.amount;
    method = paymentOrPayload.method;

    const statusTypeMap = {
      SUCCESS: 'PAYMENT_SUCCESS',
      PAID: 'PAYMENT_SUCCESS',
      FAILED: 'PAYMENT_FAILED',
      FAILURE: 'PAYMENT_FAILED',
      COD_COLLECTED: 'COD_COLLECTED',
      COD: 'COD_COLLECTED',
    };
    eventType =
      statusTypeMap[paymentOrPayload.status] ||
      paymentOrPayload.type ||
      paymentOrPayload.status ||
      'PAYMENT_SUCCESS';
  } else {
    user = paymentOrPayload.user;
    orderId = orderArg?._id || paymentOrPayload.order;
    orderNumber = orderArg?.orderNumber || (orderId ? `STS-${orderId.toString().slice(-6)}` : 'Order');
    paymentId = paymentOrPayload.paymentId;
    amount = paymentOrPayload.amount;
    method = paymentOrPayload.method;
    eventType = eventTypeArg;
  }

  if (!user) return null;

  let title = 'Payment Update';
  let message = `Update on payment for order #${orderNumber}`;

  switch (eventType) {
    case 'PAYMENT_SUCCESS':
      title = 'Payment Received';
      message = `Payment received successfully for order #${orderNumber}.`;
      break;
    case 'PAYMENT_FAILED':
      title = 'Payment Failed';
      message = `Payment failed for order #${orderNumber}. You can retry the payment.`;
      break;
    case 'COD_COLLECTED':
      title = 'Cash Payment Received';
      message = `Cash payment of ₹${amount || ''} received for order #${orderNumber}.`;
      break;
    default:
      break;
  }

  return await createNotification({
    user,
    type: eventType,
    title,
    message,
    order: orderId || null,
    metadata: {
      orderNumber,
      paymentId,
      amount,
      method,
    },
  });
};

/**
 * 4. Owner Operational Notification
 * Dispatches notification to all users with role 'owner'
 */
export const createOwnerNotification = async ({ type, title, message, order = null, metadata = {} }) => {
  try {
    const owners = await User.find({ role: 'owner' }).select('_id');
    if (!owners || owners.length === 0) return [];

    const createdNotifications = [];
    for (const owner of owners) {
      const notif = await createNotification({
        user: owner._id,
        type,
        title,
        message,
        order,
        metadata: { ...metadata, recipientRole: 'owner' },
      });
      if (notif) createdNotifications.push(notif);
    }
    return createdNotifications;
  } catch (error) {
    console.error(`[Notification Service] Failed to notify owner: ${error.message}`);
    return [];
  }
};

/**
 * 5. Retrieve paginated notifications for a user
 */
export const getUserNotifications = async (userId, { page = 1, limit = 20, isRead = null } = {}) => {
  const query = { user: userId };
  if (isRead !== null && isRead !== undefined) {
    query.isRead = isRead === true || isRead === 'true';
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .populate('order', 'orderNumber orderStatus total totalItems')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Notification.countDocuments(query),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  return {
    notifications,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    unreadCount,
  };
};

/**
 * 6. Get unread notification count
 */
export const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ user: userId, isRead: false });
};

/**
 * 7. Mark single notification as read (with user isolation)
 */
export const markAsRead = async (notificationId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return { success: false, status: 400, message: 'Invalid notification ID format' };
  }

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    return { success: false, status: 404, message: 'Notification not found' };
  }

  // Strict ownership isolation check
  if (notification.user.toString() !== userId.toString()) {
    return { success: false, status: 403, message: 'Access denied: Notification belongs to another account' };
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return { success: true, notification };
};

/**
 * 8. Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return { success: true, modifiedCount: result.modifiedCount };
};

export default {
  createNotification,
  createOrderNotification,
  createPaymentNotification,
  createOwnerNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
