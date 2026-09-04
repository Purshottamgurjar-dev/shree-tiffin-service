import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Address from '../models/Address.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get all registered customers with search, pagination, and lifetime order statistics
// @route   GET /api/users
// @access  Private/Owner
router.get('/', protect, authorize('owner'), async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { phone: { $regex: searchRegex } },
      ];
    }

    // Role filter: default to showing customers
    if (req.query.role) {
      query.role = req.query.role;
    }

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum) || 1;
    const rawUsers = await User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limitNum);

    // Fetch order metrics for each user
    const userIds = rawUsers.map((u) => u._id.toString());
    const allUserOrders = await Order.find({ user: { $in: userIds } });

    const usersWithStats = rawUsers.map((user) => {
      const userObj = user.toObject ? user.toObject() : { ...user };
      delete userObj.password;

      const uOrders = allUserOrders.filter(
        (o) => (o.user?._id ? o.user._id.toString() : o.user?.toString()) === user._id.toString()
      );

      // Sort user's orders by date
      uOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const totalOrders = uOrders.length;
      const completedOrders = uOrders.filter((o) => o.orderStatus === 'Delivered').length;
      const cancelledOrders = uOrders.filter((o) => o.orderStatus === 'Cancelled').length;
      const totalSpent = uOrders
        .filter((o) => o.orderStatus === 'Delivered' || o.paymentStatus === 'Paid')
        .reduce((sum, o) => sum + (o.total || 0), 0);

      const lastOrder = uOrders[0]
        ? {
            orderId: uOrders[0]._id,
            orderNumber: uOrders[0].orderNumber,
            date: uOrders[0].createdAt,
            total: uOrders[0].total,
            status: uOrders[0].orderStatus,
          }
        : null;

      return {
        ...userObj,
        stats: {
          totalOrders,
          completedOrders,
          cancelledOrders,
          totalSpent: Math.round(totalSpent),
          lastOrder,
        },
        accountStatus: 'Active',
      };
    });

    res.status(200).json({
      success: true,
      count: usersWithStats.length,
      users: usersWithStats,
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
});

// @desc    Get single user by ID with addresses and recent orders
// @route   GET /api/users/:id
// @access  Private (Owner or Self)
router.get('/:id', protect, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    // Only allow owner or the user themselves
    if (req.user.role !== 'owner' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to view this profile.',
      });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;

    // Fetch user's addresses and recent orders
    const [addresses, recentOrders] = await Promise.all([
      Address.find({ user: user._id }),
      Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(10),
    ]);

    const totalOrders = recentOrders.length;
    const totalSpent = recentOrders
      .filter((o) => o.orderStatus === 'Delivered' || o.paymentStatus === 'Paid')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    res.status(200).json({
      success: true,
      user: {
        ...userObj,
        addresses: addresses || [],
        recentOrders: recentOrders || [],
        stats: {
          totalOrders,
          totalSpent: Math.round(totalSpent),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
