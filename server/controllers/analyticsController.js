/**
 * analyticsController.js
 * Owner-Authorized Controller Handlers for Shree Tiffin Service Analytics
 * "Ghar Jaisa Khana, Har Din."
 */

import {
  parseDateRange,
  getOverviewKPIs,
  getRevenueTrends,
  getOrderTrends,
  getMealPerformance,
  getCustomerAnalytics,
  getCancellationAnalytics,
  getPaymentAnalytics,
  getDeliveryPerformance,
  getPeakTimes,
  getBusinessCosts,
  updateBusinessCosts,
  generateCSVReport,
} from '../services/analyticsService.js';

/**
 * @desc    Get High-Level Consolidated Dashboard KPIs with optional Comparison Mode
 * @route   GET /api/analytics/overview
 * @access  Private (Owner only)
 */
export const getOverview = async (req, res, next) => {
  try {
    const { startDate, endDate, preset, compare } = req.query;
    const includeComparison = compare === 'true' || compare === true;

    const { start, end, previousStart, previousEnd } = parseDateRange(startDate, endDate, preset);
    const kpis = await getOverviewKPIs(start, end, includeComparison, previousStart, previousEnd);

    res.status(200).json({
      success: true,
      data: kpis,
    });
  } catch (error) {
    if (error.message.includes('Invalid date') || error.message.includes('cannot be after') || error.message.includes('exceed')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * @desc    Get Realized Revenue Trends (Daily, Weekly, Monthly)
 * @route   GET /api/analytics/revenue-trend
 * @access  Private (Owner only)
 */
export const getRevenueTrend = async (req, res, next) => {
  try {
    const { startDate, endDate, preset, groupBy = 'daily' } = req.query;
    if (!['daily', 'weekly', 'monthly'].includes(groupBy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid groupBy parameter. Allowed values: daily, weekly, monthly',
      });
    }

    const { start, end } = parseDateRange(startDate, endDate, preset);
    const trend = await getRevenueTrends(start, end, groupBy);

    res.status(200).json({
      success: true,
      data: {
        groupBy,
        dateRange: { start: start.toISOString(), end: end.toISOString() },
        trend,
      },
    });
  } catch (error) {
    if (error.message.includes('Invalid date') || error.message.includes('cannot be after')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * @desc    Get Order Volume & Status Trends
 * @route   GET /api/analytics/order-trend
 * @access  Private (Owner only)
 */
export const getOrderTrend = async (req, res, next) => {
  try {
    const { startDate, endDate, preset, groupBy = 'daily' } = req.query;
    if (!['daily', 'weekly', 'monthly'].includes(groupBy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid groupBy parameter. Allowed values: daily, weekly, monthly',
      });
    }

    const { start, end } = parseDateRange(startDate, endDate, preset);
    const trend = await getOrderTrends(start, end, groupBy);

    res.status(200).json({
      success: true,
      data: {
        groupBy,
        dateRange: { start: start.toISOString(), end: end.toISOString() },
        trend,
      },
    });
  } catch (error) {
    if (error.message.includes('Invalid date') || error.message.includes('cannot be after')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * @desc    Get Meal Performance from Immutable Order Snapshots
 * @route   GET /api/analytics/meals
 * @access  Private (Owner only)
 */
export const getMealAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, preset, limit = 5 } = req.query;
    const { start, end } = parseDateRange(startDate, endDate, preset);
    const parsedLimit = Math.max(1, Math.min(50, Number(limit) || 5));

    const mealData = await getMealPerformance(start, end, parsedLimit);

    res.status(200).json({
      success: true,
      data: {
        dateRange: { start: start.toISOString(), end: end.toISOString() },
        ...mealData,
      },
    });
  } catch (error) {
    if (error.message.includes('Invalid date') || error.message.includes('cannot be after')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * @desc    Get Customer Retention, Segmentation & Top Spenders
 * @route   GET /api/analytics/customers
 * @access  Private (Owner only)
 */
export const getCustomerStats = async (req, res, next) => {
  try {
    const { startDate, endDate, preset } = req.query;
    const { start, end } = parseDateRange(startDate, endDate, preset);

    const customerData = await getCustomerAnalytics(start, end);

    res.status(200).json({
      success: true,
      data: {
        dateRange: { start: start.toISOString(), end: end.toISOString() },
        ...customerData,
      },
    });
  } catch (error) {
    if (error.message.includes('Invalid date') || error.message.includes('cannot be after')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * @desc    Get Detailed Cancellation Analytics & Reasons
 * @route   GET /api/analytics/cancellations
 * @access  Private (Owner only)
 */
export const getCancellationStats = async (req, res, next) => {
  try {
    const { startDate, endDate, preset } = req.query;
    const { start, end } = parseDateRange(startDate, endDate, preset);

    const data = await getCancellationAnalytics(start, end);

    res.status(200).json({
      success: true,
      data: {
        dateRange: { start: start.toISOString(), end: end.toISOString() },
        ...data,
      },
    });
  } catch (error) {
    if (error.message.includes('Invalid date') || error.message.includes('cannot be after')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * @desc    Get Payment Analytics (Online vs COD, Failed & Refunded)
 * @route   GET /api/analytics/payments
 * @access  Private (Owner only)
 */
export const getPaymentStats = async (req, res, next) => {
  try {
    const { startDate, endDate, preset } = req.query;
    const { start, end } = parseDateRange(startDate, endDate, preset);

    const data = await getPaymentAnalytics(start, end);

    res.status(200).json({
      success: true,
      data: {
        dateRange: { start: start.toISOString(), end: end.toISOString() },
        ...data,
      },
    });
  } catch (error) {
    if (error.message.includes('Invalid date') || error.message.includes('cannot be after')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * @desc    Get Operational Delivery Performance
 * @route   GET /api/analytics/delivery
 * @access  Private (Owner only)
 */
export const getDeliveryStats = async (req, res, next) => {
  try {
    const { startDate, endDate, preset } = req.query;
    const { start, end } = parseDateRange(startDate, endDate, preset);

    const data = await getDeliveryPerformance(start, end);

    res.status(200).json({
      success: true,
      data: {
        dateRange: { start: start.toISOString(), end: end.toISOString() },
        ...data,
      },
    });
  } catch (error) {
    if (error.message.includes('Invalid date') || error.message.includes('cannot be after')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * @desc    Get Peak Ordering Hours & Weekdays
 * @route   GET /api/analytics/peak-times
 * @access  Private (Owner only)
 */
export const getPeakTimeStats = async (req, res, next) => {
  try {
    const { startDate, endDate, preset } = req.query;
    const { start, end } = parseDateRange(startDate, endDate, preset);

    const data = await getPeakTimes(start, end);

    res.status(200).json({
      success: true,
      data: {
        dateRange: { start: start.toISOString(), end: end.toISOString() },
        ...data,
      },
    });
  } catch (error) {
    if (error.message.includes('Invalid date') || error.message.includes('cannot be after')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * @desc    Get Configured Business Costs for Estimated Profit
 * @route   GET /api/analytics/costs
 * @access  Private (Owner only)
 */
export const getCostSettings = async (req, res) => {
  const costs = getBusinessCosts();
  res.status(200).json({
    success: true,
    data: costs,
  });
};

/**
 * @desc    Update Configured Business Costs
 * @route   POST /api/analytics/costs
 * @access  Private (Owner only)
 */
export const updateCostSettings = async (req, res) => {
  const updated = updateBusinessCosts(req.body);
  res.status(200).json({
    success: true,
    message: 'Business cost configuration updated successfully',
    data: updated,
  });
};

/**
 * @desc    Export Reports as CSV (Sales, Payments, Customers, Meals)
 * @route   GET /api/analytics/export/:reportType
 * @access  Private (Owner only)
 */
export const exportReport = async (req, res, next) => {
  try {
    const { reportType } = req.params;
    const { startDate, endDate, preset } = req.query;

    const validTypes = ['sales', 'payments', 'customers', 'meals'];
    if (!validTypes.includes(reportType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid reportType: ${reportType}. Allowed: ${validTypes.join(', ')}`,
      });
    }

    const { start, end } = parseDateRange(startDate, endDate, preset);
    const csvData = await generateCSVReport(reportType, start, end);

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `shree-tiffin-${reportType}-report-${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
  } catch (error) {
    if (error.message.includes('Invalid date') || error.message.includes('cannot be after')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};
