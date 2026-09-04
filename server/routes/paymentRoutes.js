import express from 'express';
import {
  selectCodPayment,
  createOnlineOrder,
  verifyOnlinePayment,
  handlePaymentFailure,
  handleWebhook,
  getMyPayments,
  getMyPaymentById,
  getAllPayments,
  getPaymentById,
  collectCodPayment,
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { paymentRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// ----------------------------------------------------
// Public Webhook (Secured via Razorpay HMAC signature)
// ----------------------------------------------------
router.post('/webhook', handleWebhook);

// ----------------------------------------------------
// Customer Protected Routes
// ----------------------------------------------------
router.post('/cod', protect, paymentRateLimiter, selectCodPayment);
router.post('/create-order', protect, paymentRateLimiter, createOnlineOrder);
router.post('/verify', protect, paymentRateLimiter, verifyOnlinePayment);
router.post('/failure', protect, paymentRateLimiter, handlePaymentFailure);
router.get('/my', protect, getMyPayments);
router.get('/my/:id', protect, getMyPaymentById);

// ----------------------------------------------------
// Owner / Admin Protected Routes
// ----------------------------------------------------
router.get('/', protect, authorize('owner'), getAllPayments);
router.get('/:id', protect, authorize('owner'), getPaymentById);
router.patch('/:id/cod-collect', protect, authorize('owner'), collectCodPayment);

export default router;
