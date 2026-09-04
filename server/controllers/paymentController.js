import mongoose from 'mongoose';
import Payment, {
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  generatePaymentId,
} from '../models/Payment.js';
import Order from '../models/Order.js';
import paymentService from '../services/paymentService.js';
import notificationService from '../services/notificationService.js';

/**
 * @desc    Select Cash on Delivery for an existing order
 * @route   POST /api/payments/cod
 * @access  Private (Customer)
 */
export const selectCodPayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'orderId is required to select Cash on Delivery',
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Ownership check
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot modify another customer\'s order payment',
      });
    }

    // Status check
    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot select payment for a cancelled order',
      });
    }

    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'This order has already been paid',
      });
    }

    const amountInPaise = Math.round(order.total * 100);

    // Find existing pending payment or create new one
    let payment = await Payment.findOne({ order: order._id, user: req.user._id });

    if (payment) {
      payment.method = 'COD';
      payment.gateway = 'COD';
      payment.status = 'Pending';
      payment.amount = order.total;
      payment.amountInPaise = amountInPaise;
      payment.failureReason = '';
      await payment.save();
    } else {
      const paymentId = await generatePaymentId();
      payment = await Payment.create({
        paymentId,
        order: order._id,
        user: req.user._id,
        gateway: 'COD',
        method: 'COD',
        amount: order.total,
        amountInPaise,
        currency: 'INR',
        status: 'Pending',
      });
    }

    // Update order with COD method
    order.paymentMethod = 'COD';
    order.paymentStatus = 'Pending';
    order.payment = payment._id;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Cash on Delivery confirmed. Pay cash when your hot tiffin arrives.',
      payment,
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create Razorpay gateway order for online payment
 * @route   POST /api/payments/create-order
 * @access  Private (Customer)
 */
export const createOnlineOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'orderId is required to create a payment order',
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Ownership check
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot pay for another customer\'s order',
      });
    }

    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot make payment for a cancelled order',
      });
    }

    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'This order is already paid in full',
      });
    }

    // Security: Read amount strictly from DB order total (tamper-proof)
    const amountInPaise = Math.round(order.total * 100);

    // Call Razorpay / sandbox service
    const gatewayOrder = await paymentService.createGatewayOrder({
      orderNumber: order.orderNumber,
      amountInPaise,
      currency: 'INR',
      notes: {
        customerId: req.user._id.toString(),
        orderId: order._id.toString(),
      },
    });

    // Create or update Payment record
    const paymentId = await generatePaymentId();
    const payment = await Payment.create({
      paymentId,
      order: order._id,
      user: req.user._id,
      gateway: 'RAZORPAY',
      method: 'ONLINE',
      gatewayOrderId: gatewayOrder.gatewayOrderId,
      amount: order.total,
      amountInPaise,
      currency: 'INR',
      status: 'Pending',
    });

    order.paymentMethod = 'ONLINE';
    order.payment = payment._id;
    await order.save();

    const publicConfig = paymentService.getPublicPaymentConfig();

    res.status(200).json({
      success: true,
      payment: {
        paymentId: payment.paymentId,
        gatewayOrderId: gatewayOrder.gatewayOrderId,
        amount: amountInPaise,
        currency: 'INR',
        keyId: publicConfig.keyId,
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: req.user.name,
        customerEmail: req.user.email,
        customerPhone: req.user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Server-Side verification of Razorpay cryptographic signature
 * @route   POST /api/payments/verify
 * @access  Private (Customer)
 */
export const verifyOnlinePayment = async (req, res, next) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification parameters (orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature)',
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Ownership check
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot verify payment for another user\'s order',
      });
    }

    // Find candidate payment record
    const payment = await Payment.findOne({
      order: order._id,
      gatewayOrderId: razorpay_order_id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'No matching payment order found for this gateway transaction',
      });
    }

    // Idempotency / Replay protection
    if (payment.status === 'Paid' && payment.gatewayPaymentId === razorpay_payment_id) {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified (idempotent)',
        payment,
        order,
      });
    }

    // 1. Cryptographic HMAC Signature Verification
    const isSignatureValid = paymentService.verifyPaymentSignature({
      gatewayOrderId: razorpay_order_id,
      gatewayPaymentId: razorpay_payment_id,
      gatewaySignature: razorpay_signature,
    });

    if (!isSignatureValid) {
      payment.status = 'Failed';
      payment.failureReason = 'Cryptographic signature mismatch. Transaction untrusted.';
      await payment.save();

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Transaction verification failed.',
      });
    }

    // 2. Strict Amount Validation against Order Total
    const expectedPaise = Math.round(order.total * 100);
    if (payment.amountInPaise !== expectedPaise) {
      payment.status = 'Failed';
      payment.failureReason = `Amount mismatch: expected ₹${order.total}, but gateway order had ₹${payment.amount}`;
      await payment.save();

      return res.status(400).json({
        success: false,
        message: 'Payment amount mismatch detected. Order not marked as paid.',
      });
    }

    // 3. Mark Payment & Order as Paid
    payment.status = 'Paid';
    payment.verifiedAt = new Date();
    payment.gatewayPaymentId = razorpay_payment_id;
    payment.gatewaySignature = razorpay_signature;
    payment.failureReason = '';
    await payment.save();

    order.paymentStatus = 'Paid';
    order.paymentMethod = 'ONLINE';
    order.payment = payment._id;
    await order.save();

    // Dispatch automated payment notifications
    try {
      await notificationService.createPaymentNotification({
        userId: order.user,
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentId: payment.paymentId,
        amount: payment.amount,
        status: 'SUCCESS',
      });
      await notificationService.createOwnerNotification({
        title: `Online Payment Verified #${order.orderNumber}`,
        message: `Online payment of ₹${payment.amount} verified for order #${order.orderNumber} (TXN: ${payment.paymentId}).`,
        type: 'PAYMENT_SUCCESS',
        metadata: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          paymentId: payment.paymentId,
          amount: payment.amount,
        },
      });
    } catch (notifErr) {
      console.error('[Notification Trigger Error]', notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and successfully confirmed!',
      payment,
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record client-side payment failure (allows order retry)
 * @route   POST /api/payments/failure
 * @access  Private (Customer)
 */
export const handlePaymentFailure = async (req, res, next) => {
  try {
    const { orderId, gatewayOrderId, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'orderId is required',
      });
    }

    const order = await Order.findById(orderId);
    if (!order || order.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or unauthorized',
      });
    }

    if (gatewayOrderId) {
      const payment = await Payment.findOne({
        order: order._id,
        gatewayOrderId,
      });
      if (payment && payment.status !== 'Paid') {
        payment.status = 'Failed';
        payment.failureReason = reason ? String(reason).slice(0, 300) : 'Payment failed or cancelled by user';
        await payment.save();
      }
    }

    // Dispatch payment failure notification to customer
    try {
      await notificationService.createPaymentNotification({
        userId: order.user,
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentId: gatewayOrderId || 'ONLINE',
        amount: order.total,
        status: 'FAILED',
      });
    } catch (notifErr) {
      console.error('[Notification Trigger Error]', notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Payment failure recorded. You may retry payment or switch to Cash on Delivery.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Razorpay Webhook receiver with raw-body signature verification
 * @route   POST /api/payments/webhook
 * @access  Public (Authenticated via HMAC header)
 */
export const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing x-razorpay-signature header',
      });
    }

    // Verify raw body
    const isValid = paymentService.verifyWebhookSignature({
      rawBody: req.rawBody,
      signature,
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature',
      });
    }

    const event = req.body?.event;
    const payload = req.body?.payload;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payment?.entity;
      const gatewayOrderId = paymentEntity?.order_id;
      const gatewayPaymentId = paymentEntity?.id;

      if (gatewayOrderId) {
        const payment = await Payment.findOne({ gatewayOrderId });
        if (payment && payment.status !== 'Paid') {
          payment.status = 'Paid';
          payment.verifiedAt = new Date();
          payment.gatewayPaymentId = gatewayPaymentId || payment.gatewayPaymentId;
          payment.metadata = { webhookEvent: event, capturedAt: new Date() };
          await payment.save();

          const order = await Order.findById(payment.order);
          if (order) {
            order.paymentStatus = 'Paid';
            order.paymentMethod = 'ONLINE';
            await order.save();
          }
        }
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload?.payment?.entity;
      const gatewayOrderId = paymentEntity?.order_id;
      if (gatewayOrderId) {
        const payment = await Payment.findOne({ gatewayOrderId });
        if (payment && payment.status !== 'Paid') {
          payment.status = 'Failed';
          payment.failureReason = paymentEntity?.error_description || 'Payment failed via webhook notification';
          await payment.save();
        }
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get customer payment history
 * @route   GET /api/payments/my
 * @access  Private (Customer)
 */
export const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single customer payment details
 * @route   GET /api/payments/my/:id
 * @access  Private (Customer)
 */
export const getMyPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view this payment',
      });
    }

    res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all payments with search, method/status filters, pagination, and KPI metrics
 * @route   GET /api/payments
 * @access  Private (Owner only)
 */
export const getAllPayments = async (req, res, next) => {
  try {
    const { search, method, status, dateRange, startDate, endDate, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (method && PAYMENT_METHODS.includes(method.toUpperCase())) {
      query.method = method.toUpperCase();
    }

    if (status && PAYMENT_STATUSES.includes(status)) {
      query.status = status;
    }

    // Date filtering
    if (dateRange === 'today') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: startOfToday };
    } else if (dateRange === 'last7days') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 7);
      query.createdAt = { $gte: past7 };
    } else if (dateRange === 'last30days') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      query.createdAt = { $gte: past30 };
    } else if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { paymentId: { $regex: searchRegex } },
        { gatewayOrderId: { $regex: searchRegex } },
        { gatewayPaymentId: { $regex: searchRegex } },
      ];
    }

    const total = await Payment.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;
    const payments = await Payment.find(query)
      .populate('order', 'orderNumber total orderStatus customerSnapshot deliveryAddressSnapshot')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // KPI Summary Metrics across all payments
    const allPaymentsList = await Payment.find({});
    const stats = {
      totalTransactions: allPaymentsList.length,
      totalRevenue: allPaymentsList
        .filter((p) => p.status === 'Paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      onlineRevenue: allPaymentsList
        .filter((p) => p.method === 'ONLINE' && p.status === 'Paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      codCollectedRevenue: allPaymentsList
        .filter((p) => p.method === 'COD' && p.status === 'Paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      codPendingAmount: allPaymentsList
        .filter((p) => p.method === 'COD' && p.status === 'Pending')
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      paidCount: allPaymentsList.filter((p) => p.status === 'Paid').length,
      pendingCount: allPaymentsList.filter((p) => p.status === 'Pending').length,
      failedCount: allPaymentsList.filter((p) => p.status === 'Failed').length,
    };

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
      stats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single payment details for owner
 * @route   GET /api/payments/:id
 * @access  Private (Owner only)
 */
export const getPaymentById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID format',
      });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    const order = await Order.findById(payment.order);

    res.status(200).json({
      success: true,
      payment,
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark Cash on Delivery as collected (Owner only)
 * @route   PATCH /api/payments/:id/cod-collect
 * @access  Private (Owner only)
 */
export const collectCodPayment = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID format',
      });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    if (payment.method !== 'COD') {
      return res.status(400).json({
        success: false,
        message: `Only Cash on Delivery payments can be collected. This payment method is "${payment.method}".`,
      });
    }

    if (payment.status === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'This Cash on Delivery payment has already been marked as collected',
      });
    }

    const order = await Order.findById(payment.order);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Associated order not found',
      });
    }

    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot collect payment for a cancelled order',
      });
    }

    // Mark payment as Paid
    payment.status = 'Paid';
    payment.codCollectedAt = new Date();
    payment.codCollectedBy = req.user._id;

    if (!Array.isArray(payment.auditHistory)) {
      payment.auditHistory = [];
    }
    payment.auditHistory.push({
      action: 'COD_COLLECTED',
      performedBy: req.user._id,
      timestamp: new Date(),
      note: `Cash on Delivery collected by kitchen owner (${req.user.name || req.user.email})`,
    });

    await payment.save();

    // Update order payment status and history
    order.paymentStatus = 'Paid';
    order.paymentMethod = 'COD';
    if (!Array.isArray(order.statusHistory)) {
      order.statusHistory = [];
    }
    order.statusHistory.push({
      status: order.orderStatus,
      changedAt: new Date(),
      changedBy: req.user._id,
      note: `Cash on Delivery (₹${payment.amount}) collected by owner`,
    });
    await order.save();

    // Dispatch COD collection notifications
    try {
      await notificationService.createPaymentNotification({
        userId: order.user,
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentId: payment.paymentId,
        amount: payment.amount,
        status: 'COD_COLLECTED',
      });
      await notificationService.createOwnerNotification({
        title: `COD Collected #${order.orderNumber}`,
        message: `Cash on Delivery payment of ₹${payment.amount} collected for order #${order.orderNumber}.`,
        type: 'COD_COLLECTED',
        metadata: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          paymentId: payment.paymentId,
          amount: payment.amount,
        },
      });
    } catch (notifErr) {
      console.error('[Notification Trigger Error]', notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Cash on Delivery payment of ₹${payment.amount} marked as collected successfully`,
      payment,
      order,
    });
  } catch (error) {
    next(error);
  }
};
