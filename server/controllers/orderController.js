import mongoose from 'mongoose';
import Order, { ORDER_STATUSES, generateOrderNumber } from '../models/Order.js';
import Cart from '../models/Cart.js';
import Meal from '../models/Meal.js';
import Address from '../models/Address.js';
import BusinessSettings from '../models/BusinessSettings.js';
import notificationService from '../services/notificationService.js';

// Strict status transition mapping
const VALID_STATUS_TRANSITIONS = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Preparing', 'Cancelled'],
  Preparing: ['Out for Delivery'],
  'Out for Delivery': ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

/**
 * @desc    Create new order from authenticated customer's cart
 * @route   POST /api/orders
 * @access  Private (Customer)
 */
export const createOrder = async (req, res, next) => {
  try {
    const { addressId, deliveryInstructions } = req.body;
    const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;

    // 0. Enforce Business Operating Availability
    const settings = await BusinessSettings.getSettings();
    if (!settings.ordering?.isAcceptingOrders) {
      return res.status(400).json({
        success: false,
        message: settings.ordering?.pausedMessage || 'Online ordering is currently unavailable.',
      });
    }

    // 1. Idempotency check to prevent duplicate order submissions
    if (idempotencyKey) {
      const existingOrder = await Order.findOne({
        user: req.user._id,
        idempotencyKey: idempotencyKey.toString(),
      });
      if (existingOrder) {
        return res.status(200).json({
          success: true,
          message: 'Existing order retrieved (idempotent)',
          order: existingOrder,
        });
      }
    }

    // 2. Load customer's cart from MongoDB
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Please add meals before creating an order.',
      });
    }

    // 3. Load & validate delivery address
    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required to place an order',
      });
    }

    let address;
    try {
      address = await Address.findById(addressId);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery address ID format',
      });
    }

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Delivery address not found',
      });
    }

    // Strict customer address ownership check
    if (address.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Selected delivery address does not belong to your account',
      });
    }

    // Coordinate & Delivery Radius Validation (Authoritative 15 KM boundary)
    const addrLat = Number(address.latitude);
    const addrLng = Number(address.longitude);
    if (isNaN(addrLat) || addrLat < -90 || addrLat > 90 || isNaN(addrLng) || addrLng < -180 || addrLng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Selected delivery address does not have valid GPS coordinates on the map.',
      });
    }

    if (typeof settings.checkDeliveryEligibility === 'function') {
      const radiusCheck = settings.checkDeliveryEligibility(addrLat, addrLng);
      if (!radiusCheck.isEligible) {
        return res.status(400).json({
          success: false,
          message: `Delivery address is outside our ${radiusCheck.maxRadiusKm} km delivery area (${radiusCheck.distanceKm} km from our kitchen in Scheme No 78, Vijay Nagar). Please select an address within 15 km.`,
          distanceKm: radiusCheck.distanceKm,
          maxRadiusKm: radiusCheck.maxRadiusKm,
        });
      }
    }

    // 4. Re-fetch every meal from MongoDB to ensure availability and calculate server prices
    let subtotal = 0;
    let totalItems = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const mealId = item.meal ? (item.meal._id ? item.meal._id.toString() : item.meal.toString()) : null;
      let currentMeal = null;

      if (mealId) {
        try {
          currentMeal = await Meal.findById(mealId);
        } catch (err) {
          currentMeal = null;
        }
      }

      if (!currentMeal) {
        return res.status(400).json({
          success: false,
          message: `Meal "${item.nameSnapshot || 'Item'}" was removed from the menu. Please review your cart.`,
        });
      }

      if (!currentMeal.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Meal "${currentMeal.name}" is currently unavailable. Please remove it from your cart.`,
        });
      }

      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const activePrice = Number(currentMeal.price);
      const itemTotal = activePrice * quantity;

      subtotal += itemTotal;
      totalItems += quantity;

      // Immutable meal snapshot
      orderItems.push({
        meal: currentMeal._id,
        nameSnapshot: currentMeal.name,
        imageSnapshot: currentMeal.image,
        priceSnapshot: activePrice,
        quantity,
        itemTotal,
      });
    }

    // 5. Enforce Minimum Order Value
    const minimumOrderValue = Number(settings.delivery?.minimumOrderValue || 0);
    if (minimumOrderValue > 0 && subtotal < minimumOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of ₹${minimumOrderValue} is required to place an order. Your current subtotal is ₹${subtotal}.`,
      });
    }

    // Centralized Delivery Fee Calculation
    const deliveryFee = settings.calculateDeliveryFee
      ? settings.calculateDeliveryFee(subtotal)
      : Number(settings.delivery?.deliveryFee || 0);
    const total = subtotal + deliveryFee;

    // Generate collision-safe human-readable order number
    const orderNumber = await generateOrderNumber();

    // 6. Build immutable snapshots
    const customerSnapshot = {
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
    };

    const deliveryAddressSnapshot = {
      label: address.label || 'Home',
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      landmark: address.landmark || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country || 'India',
      latitude: Number(address.latitude),
      longitude: Number(address.longitude),
      deliveryInstructions: deliveryInstructions
        ? deliveryInstructions.trim().slice(0, 300)
        : address.deliveryInstructions || '',
    };

    // 7. Create Order in MongoDB
    const newOrder = await Order.create({
      orderNumber,
      user: req.user._id,
      idempotencyKey: idempotencyKey || null,
      items: orderItems,
      totalItems,
      subtotal,
      deliveryFee,
      total,
      customerSnapshot,
      deliveryAddressSnapshot,
      orderStatus: 'Pending',
      statusHistory: [
        {
          status: 'Pending',
          changedAt: new Date(),
          changedBy: req.user._id,
          note: 'Order placed by customer',
        },
      ],
      paymentStatus: 'Pending',
      paymentMethod: null,
    });

    // 8. Clear customer's cart in MongoDB upon successful order creation
    cart.items = [];
    cart.subtotal = 0;
    cart.totalItems = 0;
    await cart.save();

    // 9. Dispatch automated notifications to customer and owner
    try {
      await notificationService.createOrderNotification({
        userId: req.user._id,
        orderId: newOrder._id,
        orderNumber: newOrder.orderNumber,
        status: 'Pending',
        total: newOrder.total,
      });
      await notificationService.createOwnerNotification({
        title: `New Order Received #${newOrder.orderNumber}`,
        message: `New order #${newOrder.orderNumber} for ₹${newOrder.total} received from ${req.user.name}.`,
        type: 'ORDER_PLACED',
        metadata: {
          orderId: newOrder._id,
          orderNumber: newOrder.orderNumber,
          total: newOrder.total,
          customerName: req.user.name,
        },
      });
    } catch (notifErr) {
      console.error('[Notification Trigger Error]', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: newOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all orders for the authenticated customer
 * @route   GET /api/orders/my
 * @access  Private (Customer)
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get customer order details by ID
 * @route   GET /api/orders/my/:id
 * @access  Private (Customer)
 */
export const getMyOrderById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Customer isolation check
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view this order',
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel order by customer (Pending status only)
 * @route   PATCH /api/orders/my/:id/cancel
 * @access  Private (Customer)
 */
export const cancelMyOrder = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    const order = await Order.findById(req.params.id);

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
        message: 'Access denied: You cannot cancel another customer\'s order',
      });
    }

    // Customer cancellation rule: only Pending orders
    if (order.orderStatus !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled in "${order.orderStatus}" status. Only pending orders can be cancelled.`,
      });
    }

    const reason = req.body.reason ? req.body.reason.trim() : 'Cancelled by customer';

    order.orderStatus = 'Cancelled';
    order.cancelledAt = new Date();
    order.cancelledBy = req.user._id;
    order.cancellationReason = reason;
    order.statusHistory.push({
      status: 'Cancelled',
      changedAt: new Date(),
      changedBy: req.user._id,
      note: reason,
    });

    await order.save();

    // Dispatch notifications
    try {
      await notificationService.createOrderNotification({
        userId: req.user._id,
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: 'Cancelled',
        total: order.total,
      });
      await notificationService.createOwnerNotification({
        title: `Order Cancelled #${order.orderNumber}`,
        message: `Customer ${req.user.name} cancelled order #${order.orderNumber}. Reason: ${reason}`,
        type: 'ORDER_CANCELLED',
        metadata: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          total: order.total,
          reason,
        },
      });
    } catch (notifErr) {
      console.error('[Notification Trigger Error]', notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all orders with search, filter, date range, payment method/status, sorting, and pagination
 * @route   GET /api/orders
 * @access  Private (Owner only)
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const { search, status, paymentMethod, paymentStatus, dateRange, startDate, endDate, sort } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const query = {};

    // 1. Status Filter
    if (status && ORDER_STATUSES.includes(status)) {
      query.orderStatus = status;
    }

    // 2. Payment Method Filter
    if (paymentMethod && ['COD', 'ONLINE'].includes(paymentMethod.toUpperCase())) {
      query.paymentMethod = paymentMethod.toUpperCase();
    }

    // 3. Payment Status Filter
    if (paymentStatus && ['Pending', 'Paid', 'Failed', 'Refunded'].includes(paymentStatus)) {
      query.paymentStatus = paymentStatus;
    }

    // 4. Search query across orderNumber, customer name, email, phone
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { orderNumber: { $regex: searchRegex } },
        { 'customerSnapshot.name': { $regex: searchRegex } },
        { 'customerSnapshot.email': { $regex: searchRegex } },
        { 'customerSnapshot.phone': { $regex: searchRegex } },
      ];
    }

    // 5. Date filtering
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

    // 6. Sorting
    const sortOption = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const total = await Order.countDocuments(query);
    const totalPages = Math.ceil(total / limit) || 1;
    const orders = await Order.find(query).sort(sortOption).skip(skip).limit(limit);

    // KPI Metrics across all orders
    const allOrdersList = await Order.find({});
    const stats = {
      total: allOrdersList.length,
      pending: allOrdersList.filter((o) => o.orderStatus === 'Pending').length,
      confirmed: allOrdersList.filter((o) => o.orderStatus === 'Confirmed').length,
      preparing: allOrdersList.filter((o) => o.orderStatus === 'Preparing').length,
      outForDelivery: allOrdersList.filter((o) => o.orderStatus === 'Out for Delivery').length,
      delivered: allOrdersList.filter((o) => o.orderStatus === 'Delivered').length,
      cancelled: allOrdersList.filter((o) => o.orderStatus === 'Cancelled').length,
    };

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get real-time operational dashboard KPIs for owner
 * @route   GET /api/orders/dashboard-kpis
 * @access  Private (Owner only)
 */
export const getOwnerDashboardKPIs = async (req, res, next) => {
  try {
    const allOrders = await Order.find({});
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayOrdersList = allOrders.filter((o) => new Date(o.createdAt) >= startOfToday);
    const deliveredTodayList = allOrders.filter((o) => {
      if (o.orderStatus !== 'Delivered') return false;
      const lastUpdated = o.updatedAt || o.createdAt;
      return new Date(lastUpdated) >= startOfToday;
    });

    const pendingOrdersCount = allOrders.filter((o) => o.orderStatus === 'Pending').length;
    const preparingOrdersCount = allOrders.filter((o) => o.orderStatus === 'Preparing').length;
    const outForDeliveryOrdersCount = allOrders.filter((o) => o.orderStatus === 'Out for Delivery').length;

    // Today's revenue: Delivered or Paid orders today
    const todayRevenue = allOrders
      .filter((o) => o.paymentStatus === 'Paid' && new Date(o.updatedAt || o.createdAt) >= startOfToday)
      .reduce((sum, o) => sum + (o.total || 0), 0);

    // Pending COD: orders with COD and paymentStatus Pending (not cancelled)
    const pendingCodOrders = allOrders.filter(
      (o) => (o.paymentMethod || 'COD') === 'COD' && o.paymentStatus === 'Pending' && o.orderStatus !== 'Cancelled'
    );
    const pendingCodAmount = pendingCodOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Online Payments: count and revenue of Paid online orders
    const onlinePaidOrders = allOrders.filter((o) => o.paymentMethod === 'ONLINE' && o.paymentStatus === 'Paid');
    const onlinePaidAmount = onlinePaidOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Unique active customers
    const uniqueCustomerIds = new Set(allOrders.map((o) => o.user?.toString()).filter(Boolean));

    res.status(200).json({
      success: true,
      kpis: {
        todayOrders: todayOrdersList.length,
        pendingOrders: pendingOrdersCount,
        preparingOrders: preparingOrdersCount,
        outForDelivery: outForDeliveryOrdersCount,
        deliveredToday: deliveredTodayList.length,
        todayRevenue: Math.round(todayRevenue),
        pendingCod: Math.round(pendingCodAmount),
        onlinePayments: Math.round(onlinePaidAmount),
        onlinePaidCount: onlinePaidOrders.length,
        activeCustomers: uniqueCustomerIds.size,
        totalOrders: allOrders.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active orders requiring delivery management
 * @route   GET /api/orders/delivery-orders
 * @access  Private (Owner only)
 */
export const getDeliveryOrders = async (req, res, next) => {
  try {
    const activeStatuses = ['Confirmed', 'Preparing', 'Out for Delivery'];
    const orders = await Order.find({
      orderStatus: { $in: activeStatuses },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single order details for owner
 * @route   GET /api/orders/:id
 * @access  Private (Owner only)
 */
export const getOrderById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order status with strict workflow transition validation
 * @route   PATCH /api/orders/:id/status
 * @access  Private (Owner only)
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    const { status: newStatus, note = '', reason = '' } = req.body;

    if (!newStatus || !ORDER_STATUSES.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Supported statuses: ${ORDER_STATUSES.join(', ')}`,
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const currentStatus = order.orderStatus;

    // Strict status transition check
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from "${currentStatus}" to "${newStatus}". Allowed transitions: ${allowedTransitions.join(', ') || 'None'}`,
      });
    }

    order.orderStatus = newStatus;

    if (newStatus === 'Cancelled') {
      order.cancelledAt = new Date();
      order.cancelledBy = req.user._id;
      order.cancellationReason = reason.trim() || note.trim() || 'Cancelled by kitchen manager';
    }

    order.statusHistory.push({
      status: newStatus,
      changedAt: new Date(),
      changedBy: req.user._id,
      note: note.trim() || `Status changed from ${currentStatus} to ${newStatus}`,
    });

    await order.save();

    // Dispatch customer notification on status progression
    try {
      await notificationService.createOrderNotification({
        userId: order.user,
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: newStatus,
        total: order.total,
      });
    } catch (notifErr) {
      console.error('[Notification Trigger Error]', notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to "${newStatus}" successfully`,
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel order by owner
 * @route   PATCH /api/orders/:id/cancel
 * @access  Private (Owner only)
 */
export const cancelOrderByOwner = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (['Delivered', 'Cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already "${order.orderStatus}"`,
      });
    }

    const reason = req.body.reason ? req.body.reason.trim() : 'Cancelled by kitchen manager';

    order.orderStatus = 'Cancelled';
    order.cancelledAt = new Date();
    order.cancelledBy = req.user._id;
    order.cancellationReason = reason;
    order.statusHistory.push({
      status: 'Cancelled',
      changedAt: new Date(),
      changedBy: req.user._id,
      note: reason,
    });

    await order.save();

    // Dispatch customer notification on kitchen cancellation
    try {
      await notificationService.createOrderNotification({
        userId: order.user,
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: 'Cancelled',
        total: order.total,
      });
    } catch (notifErr) {
      console.error('[Notification Trigger Error]', notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error) {
    next(error);
  }
};
