/**
 * analyticsRoutes.js
 * Owner Analytics & Business Reporting Routes for Shree Tiffin Service
 * "Ghar Jaisa Khana, Har Din."
 */

import express from 'express';
import {
  getOverview,
  getRevenueTrend,
  getOrderTrend,
  getMealAnalytics,
  getCustomerStats,
  getCancellationStats,
  getPaymentStats,
  getDeliveryStats,
  getPeakTimeStats,
  getCostSettings,
  updateCostSettings,
  exportReport,
} from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Strict Security Enforcement: All analytics routes require authentication & Owner role
router.use(protect);
router.use(authorize('owner'));

// Analytics Endpoints
router.get('/overview', getOverview);
router.get('/revenue-trend', getRevenueTrend);
router.get('/order-trend', getOrderTrend);
router.get('/meals', getMealAnalytics);
router.get('/customers', getCustomerStats);
router.get('/cancellations', getCancellationStats);
router.get('/payments', getPaymentStats);
router.get('/delivery', getDeliveryStats);
router.get('/peak-times', getPeakTimeStats);

// Profit / Cost Settings Endpoints
router.get('/costs', getCostSettings);
router.post('/costs', updateCostSettings);

// CSV Export Endpoints
router.get('/export/:reportType', exportReport);

export default router;
