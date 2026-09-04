import express from 'express';
import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrderByOwner,
  getOwnerDashboardKPIs,
  getDeliveryOrders,
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { orderRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All order routes require authenticated user
router.use(protect);

// ----------------------------------------------------
// Customer Routes
// ----------------------------------------------------
router.post('/', orderRateLimiter, createOrder);
router.get('/my', getMyOrders);
router.get('/my/:id', getMyOrderById);
router.patch('/my/:id/cancel', cancelMyOrder);

// ----------------------------------------------------
// Owner / Admin Routes
// ----------------------------------------------------
router.get('/', authorize('owner'), getAllOrders);
router.get('/dashboard-kpis', authorize('owner'), getOwnerDashboardKPIs);
router.get('/delivery-orders', authorize('owner'), getDeliveryOrders);
router.get('/:id', authorize('owner'), getOrderById);
router.patch('/:id/status', authorize('owner'), updateOrderStatus);
router.patch('/:id/cancel', authorize('owner'), cancelOrderByOwner);

export default router;
