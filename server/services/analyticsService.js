/**
 * analyticsService.js
 * Advanced Owner Analytics & Business Reporting Engine for Shree Tiffin Service
 * "Ghar Jaisa Khana, Har Din."
 *
 * Realized Revenue Rules:
 * - Only orders with paymentStatus === 'Paid' (Online verified or COD collected) are counted toward realized revenue.
 * - Cancelled orders and pending COD are tracked separately and never inflate realized revenue.
 * - Historical meal metrics use immutable snapshot data (nameSnapshot, priceSnapshot, itemTotal).
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Order, { MongooseOrder } from '../models/Order.js';
import DualModePayment, { MongoosePayment } from '../models/Payment.js';
import User, { MongooseUser } from '../models/User.js';
import Meal, { MongooseMeal } from '../models/Meal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COSTS_FILE = path.join(__dirname, '../data/businessCosts.json');

// Default Business Costs Configuration
const DEFAULT_BUSINESS_COSTS = {
  ingredientCostPercentage: 0,
  packagingCostPerOrder: 0,
  deliveryCostPerOrder: 0,
  operatingCostMonthly: 0,
  updatedAt: new Date().toISOString(),
};

/**
 * Load Business Costs from persistent disk store
 */
export const getBusinessCosts = () => {
  try {
    if (fs.existsSync(COSTS_FILE)) {
      const data = fs.readFileSync(COSTS_FILE, 'utf8');
      return { ...DEFAULT_BUSINESS_COSTS, ...JSON.parse(data) };
    }
  } catch (err) {
    console.warn(`[Analytics Service] Could not load business costs: ${err.message}`);
  }
  return { ...DEFAULT_BUSINESS_COSTS };
};

/**
 * Update Business Costs
 */
export const updateBusinessCosts = (newCosts = {}) => {
  const current = getBusinessCosts();
  const updated = {
    ingredientCostPercentage: Math.max(0, Math.min(100, Number(newCosts.ingredientCostPercentage ?? current.ingredientCostPercentage))),
    packagingCostPerOrder: Math.max(0, Number(newCosts.packagingCostPerOrder ?? current.packagingCostPerOrder)),
    deliveryCostPerOrder: Math.max(0, Number(newCosts.deliveryCostPerOrder ?? current.deliveryCostPerOrder)),
    operatingCostMonthly: Math.max(0, Number(newCosts.operatingCostMonthly ?? current.operatingCostMonthly)),
    updatedAt: new Date().toISOString(),
  };

  try {
    const dir = path.dirname(COSTS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(COSTS_FILE, JSON.stringify(updated, null, 2), 'utf8');
  } catch (err) {
    console.warn(`[Analytics Service] Could not save business costs: ${err.message}`);
  }

  return updated;
};

/**
 * Helper: Parse and validate date ranges with preset support
 */
export const parseDateRange = (startDate, endDate, preset = 'last30days') => {
  const now = new Date();
  let start;
  let end;

  const normalizedPreset = (preset || '').toLowerCase().trim();

  if (normalizedPreset === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (normalizedPreset === 'yesterday') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
  } else if (normalizedPreset === 'last7days' || normalizedPreset === '7d') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (normalizedPreset === 'last30days' || normalizedPreset === '30d') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (normalizedPreset === 'thismonth') {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (normalizedPreset === 'lastmonth') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (normalizedPreset === 'thisyear') {
    start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (startDate || endDate) {
    if (!startDate || !endDate) {
      throw new Error('Both startDate and endDate are required for custom date range');
    }
    start = new Date(startDate);
    end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format. Use ISO format (YYYY-MM-DD)');
    }
    if (start > end) {
      throw new Error('startDate cannot be after endDate');
    }

    // Set full day boundaries
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Limit maximum range to 5 years to protect server resources
    const maxRangeMs = 5 * 365.25 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > maxRangeMs) {
      throw new Error('Date range cannot exceed 5 years');
    }
  } else {
    // Default: Last 30 Days
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  }

  // Previous comparison period calculation (same duration immediately preceding start)
  const durationMs = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - durationMs);

  return {
    start,
    end,
    preset: normalizedPreset || 'custom',
    previousStart,
    previousEnd,
  };
};

/**
 * Calculate growth percentage safely
 */
export const calculateGrowth = (current, previous) => {
  const c = Number(current || 0);
  const p = Number(previous || 0);
  if (p === 0) {
    return c > 0 ? 100.0 : 0.0;
  }
  const growth = ((c - p) / p) * 100;
  return Number(growth.toFixed(2));
};

/**
 * Calculate estimated profit based on realized revenue and recorded costs
 */
export const calculateEstimatedProfit = (realizedRevenue, paidOrderCount, daysInRange = 30) => {
  const costs = getBusinessCosts();
  const revenue = Number(realizedRevenue || 0);
  const orders = Number(paidOrderCount || 0);

  const ingredientCost = (revenue * costs.ingredientCostPercentage) / 100;
  const packagingCost = orders * costs.packagingCostPerOrder;
  const deliveryCost = orders * costs.deliveryCostPerOrder;
  const proratedOperatingCost = (costs.operatingCostMonthly / 30) * Math.max(1, daysInRange);

  const totalRecordedCosts = Math.round(ingredientCost + packagingCost + deliveryCost + proratedOperatingCost);
  const estimatedProfit = Math.round(revenue - totalRecordedCosts);

  return {
    realizedRevenue: Math.round(revenue),
    totalRecordedCosts,
    estimatedProfit,
    costsBreakdown: {
      ingredientCost: Math.round(ingredientCost),
      packagingCost: Math.round(packagingCost),
      deliveryCost: Math.round(deliveryCost),
      operatingCost: Math.round(proratedOperatingCost),
    },
    hasConfiguredCosts: costs.ingredientCostPercentage > 0 || costs.packagingCostPerOrder > 0 || costs.deliveryCostPerOrder > 0 || costs.operatingCostMonthly > 0,
  };
};

/**
 * Get Consolidated High-Level Dashboard KPIs
 */
export const getOverviewKPIs = async (start, end, includeComparison = false, previousStart = null, previousEnd = null) => {
  const isMongo = mongoose.connection.readyState === 1;

  // 1. Fetch Orders in range (or all if calculating historical snapshots)
  const ordersQuery = {
    createdAt: { $gte: start, $lte: end },
  };

  let ordersInRange = [];
  let allHistoricalOrders = [];

  if (isMongo) {
    ordersInRange = await MongooseOrder.find(ordersQuery).lean();
    allHistoricalOrders = await MongooseOrder.find({}).lean();
  } else {
    ordersInRange = await Order.find(ordersQuery);
    allHistoricalOrders = await Order.find({});
  }

  // Helper for realized revenue: paymentStatus === 'Paid'
  const filterRealizedRevenue = (orderList) => {
    return orderList
      .filter((o) => o.paymentStatus === 'Paid' && o.orderStatus !== 'Cancelled')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  };

  // Helper for paid orders count
  const filterPaidOrders = (orderList) => {
    return orderList.filter((o) => o.paymentStatus === 'Paid' && o.orderStatus !== 'Cancelled');
  };

  // 2. Realized Revenue in current filter range
  const realizedRevenue = filterRealizedRevenue(ordersInRange);
  const paidOrders = filterPaidOrders(ordersInRange);
  const paidOrderCount = paidOrders.length;

  // 3. Period-specific Revenue (Today, Yesterday, Week, Month, Previous Month)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
  const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);

  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7), 0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const todayRevenue = filterRealizedRevenue(
    allHistoricalOrders.filter((o) => new Date(o.createdAt) >= startOfToday && new Date(o.createdAt) <= endOfToday)
  );
  const yesterdayRevenue = filterRealizedRevenue(
    allHistoricalOrders.filter((o) => new Date(o.createdAt) >= startOfYesterday && new Date(o.createdAt) <= endOfYesterday)
  );
  const weekRevenue = filterRealizedRevenue(
    allHistoricalOrders.filter((o) => new Date(o.createdAt) >= startOfWeek && new Date(o.createdAt) <= endOfToday)
  );
  const monthRevenue = filterRealizedRevenue(
    allHistoricalOrders.filter((o) => new Date(o.createdAt) >= startOfMonth && new Date(o.createdAt) <= endOfToday)
  );
  const prevMonthRevenue = filterRealizedRevenue(
    allHistoricalOrders.filter((o) => new Date(o.createdAt) >= startOfPrevMonth && new Date(o.createdAt) <= endOfPrevMonth)
  );

  // 4. Orders Breakdown
  const totalOrders = ordersInRange.length;
  const pendingOrders = ordersInRange.filter((o) => o.orderStatus === 'Pending').length;
  const confirmedOrders = ordersInRange.filter((o) => o.orderStatus === 'Confirmed').length;
  const preparingOrders = ordersInRange.filter((o) => o.orderStatus === 'Preparing').length;
  const outForDeliveryOrders = ordersInRange.filter((o) => o.orderStatus === 'Out for Delivery').length;
  const deliveredOrders = ordersInRange.filter((o) => o.orderStatus === 'Delivered').length;
  const cancelledOrders = ordersInRange.filter((o) => o.orderStatus === 'Cancelled').length;

  // 5. Payment Breakdown
  const onlineOrders = ordersInRange.filter((o) => o.paymentMethod === 'ONLINE');
  const onlinePaidOrders = onlineOrders.filter((o) => o.paymentStatus === 'Paid');
  const onlineRevenue = onlinePaidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const codOrders = ordersInRange.filter((o) => (o.paymentMethod || 'COD') === 'COD');
  const codPaidOrders = codOrders.filter((o) => o.paymentStatus === 'Paid');
  const codCollectedRevenue = codPaidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const pendingCodOrders = codOrders.filter((o) => o.paymentStatus === 'Pending' && o.orderStatus !== 'Cancelled');
  const pendingCodAmount = pendingCodOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const failedOrders = ordersInRange.filter((o) => o.paymentStatus === 'Failed');
  const failedAmount = failedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const refundedOrders = ordersInRange.filter((o) => o.paymentStatus === 'Refunded');
  const refundedAmount = refundedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // 6. Customers Breakdown
  let allCustomers = [];
  if (isMongo) {
    allCustomers = await MongooseUser.find({ role: 'customer' }).lean();
  } else {
    allCustomers = await User.find({ role: 'customer' });
  }

  const totalCustomers = allCustomers.length;
  const newCustomers = allCustomers.filter((c) => new Date(c.createdAt) >= start && new Date(c.createdAt) <= end).length;

  // Definition 9: Active Customer = customer who placed at least 1 valid (non-cancelled) order in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const activeCustomerIds30d = new Set(
    allHistoricalOrders
      .filter((o) => new Date(o.createdAt) >= thirtyDaysAgo && o.orderStatus !== 'Cancelled')
      .map((o) => o.user?.toString())
      .filter(Boolean)
  );
  const orderingUserIdsInRange = new Set(ordersInRange.map((o) => o.user?.toString()).filter(Boolean));
  const activeCustomers = activeCustomerIds30d.size;
  const activeInPeriod = orderingUserIdsInRange.size;

  // Returning customers: ordered in range AND also had at least one order before start
  const priorUserIds = new Set(
    allHistoricalOrders
      .filter((o) => new Date(o.createdAt) < start)
      .map((o) => o.user?.toString())
      .filter(Boolean)
  );
  let returningCustomersCount = 0;
  for (const uid of orderingUserIdsInRange) {
    if (priorUserIds.has(uid)) {
      returningCustomersCount++;
    }
  }

  // Repeat customer rate across entire customer base with completed/qualifying orders
  const customerOrderCounts = new Map();
  allHistoricalOrders.forEach((o) => {
    if (o.user) {
      const uid = o.user.toString();
      customerOrderCounts.set(uid, (customerOrderCounts.get(uid) || 0) + 1);
    }
  });

  let customersWith2Plus = 0;
  let customersWith5Plus = 0;
  customerOrderCounts.forEach((cnt) => {
    if (cnt >= 2) customersWith2Plus++;
    if (cnt >= 5) customersWith5Plus++;
  });

  const totalOrderingCustomers = customerOrderCounts.size;
  const repeatOrderRate = totalOrderingCustomers > 0
    ? Number(((customersWith2Plus / totalOrderingCustomers) * 100).toFixed(2))
    : 0.0;

  // 7. Average Order Value (AOV)
  const aov = paidOrderCount > 0 ? Math.round(realizedRevenue / paidOrderCount) : 0;

  // Today's AOV, Weekly AOV, Monthly AOV
  const todayPaid = filterPaidOrders(allHistoricalOrders.filter((o) => new Date(o.createdAt) >= startOfToday && new Date(o.createdAt) <= endOfToday));
  const weekPaid = filterPaidOrders(allHistoricalOrders.filter((o) => new Date(o.createdAt) >= startOfWeek && new Date(o.createdAt) <= endOfToday));
  const monthPaid = filterPaidOrders(allHistoricalOrders.filter((o) => new Date(o.createdAt) >= startOfMonth && new Date(o.createdAt) <= endOfToday));

  const todayAov = todayPaid.length > 0 ? Math.round(todayRevenue / todayPaid.length) : 0;
  const weekAov = weekPaid.length > 0 ? Math.round(weekRevenue / weekPaid.length) : 0;
  const monthAov = monthPaid.length > 0 ? Math.round(monthRevenue / monthPaid.length) : 0;

  // 8. Cancellation Analytics Summary
  const cancellationRate = totalOrders > 0 ? Number(((cancelledOrders / totalOrders) * 100).toFixed(2)) : 0.0;
  const cancellationAmount = ordersInRange
    .filter((o) => o.orderStatus === 'Cancelled')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // 9. Delivery Performance Summary
  const activeDeliveries = pendingOrders + confirmedOrders + preparingOrders + outForDeliveryOrders;
  const deliveryCompletionRate = totalOrders > 0
    ? Number(((deliveredOrders / totalOrders) * 100).toFixed(2))
    : 0.0;

  // Estimated Delivery Time calculation
  let deliveryTimesMinutes = [];
  ordersInRange.forEach((o) => {
    if (o.orderStatus === 'Delivered' && Array.isArray(o.statusHistory) && o.statusHistory.length > 0) {
      const deliveredEntry = o.statusHistory.find((h) => h.status === 'Delivered');
      const startEntry = o.statusHistory.find((h) => h.status === 'Out for Delivery' || h.status === 'Confirmed' || h.status === 'Preparing');
      const startTime = startEntry ? new Date(startEntry.changedAt) : new Date(o.createdAt);
      if (deliveredEntry && startTime) {
        const diffMins = Math.round((new Date(deliveredEntry.changedAt).getTime() - startTime.getTime()) / (60 * 1000));
        if (diffMins > 0 && diffMins < 600) {
          deliveryTimesMinutes.push(diffMins);
        }
      }
    }
  });

  const avgDeliveryTime = deliveryTimesMinutes.length > 0
    ? `${Math.round(deliveryTimesMinutes.reduce((a, b) => a + b, 0) / deliveryTimesMinutes.length)} mins`
    : 'Insufficient data';

  // 10. Estimated Profit Calculation
  const daysDiff = Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
  const profitData = calculateEstimatedProfit(realizedRevenue, paidOrderCount, daysDiff);

  // 11. Comparison Mode (if requested)
  let comparison = null;
  if (includeComparison && previousStart && previousEnd) {
    let prevOrders = [];
    if (isMongo) {
      prevOrders = await MongooseOrder.find({ createdAt: { $gte: previousStart, $lte: previousEnd } }).lean();
    } else {
      prevOrders = await Order.find({ createdAt: { $gte: previousStart, $lte: previousEnd } });
    }

    const prevRealizedRevenue = filterRealizedRevenue(prevOrders);
    const prevPaidOrders = filterPaidOrders(prevOrders);
    const prevPaidCount = prevPaidOrders.length;
    const prevTotalOrders = prevOrders.length;
    const prevAov = prevPaidCount > 0 ? Math.round(prevRealizedRevenue / prevPaidCount) : 0;
    const prevOrderingCustomers = new Set(prevOrders.map((o) => o.user?.toString()).filter(Boolean)).size;

    comparison = {
      previousPeriod: {
        startDate: previousStart.toISOString(),
        endDate: previousEnd.toISOString(),
        revenue: prevRealizedRevenue,
        totalOrders: prevTotalOrders,
        activeCustomers: prevOrderingCustomers,
        aov: prevAov,
      },
      growth: {
        revenueGrowth: calculateGrowth(realizedRevenue, prevRealizedRevenue),
        orderGrowth: calculateGrowth(totalOrders, prevTotalOrders),
        customerGrowth: calculateGrowth(activeCustomers, prevOrderingCustomers),
        aovGrowth: calculateGrowth(aov, prevAov),
      },
    };
  }

  return {
    revenue: {
      realizedRevenue: Math.round(realizedRevenue),
      today: Math.round(todayRevenue),
      yesterday: Math.round(yesterdayRevenue),
      thisWeek: Math.round(weekRevenue),
      thisMonth: Math.round(monthRevenue),
      previousMonth: Math.round(prevMonthRevenue),
      aov,
      todayAov,
      weekAov,
      monthAov,
    },
    orders: {
      total: totalOrders,
      pending: pendingOrders,
      confirmed: confirmedOrders,
      preparing: preparingOrders,
      outForDelivery: outForDeliveryOrders,
      delivered: deliveredOrders,
      cancelled: cancelledOrders,
      paidCount: paidOrderCount,
      activeDeliveries,
    },
    customers: {
      total: totalCustomers,
      active: activeCustomers,
      newCustomers,
      returning: returningCustomersCount,
      repeatOrderRate,
      customersWith2Plus,
      customersWith5Plus,
    },
    payments: {
      totalPaidRevenue: Math.round(realizedRevenue),
      onlineRevenue: Math.round(onlineRevenue),
      onlineCount: onlinePaidOrders.length,
      codCollected: Math.round(codCollectedRevenue),
      codCount: codPaidOrders.length,
      pendingCod: Math.round(pendingCodAmount),
      pendingCodCount: pendingCodOrders.length,
      failedPayments: failedOrders.length,
      failedAmount: Math.round(failedAmount),
      refundedAmount: Math.round(refundedAmount),
      distribution: {
        onlinePercentage: totalOrders > 0 ? Number(((onlineOrders.length / totalOrders) * 100).toFixed(1)) : 0.0,
        codPercentage: totalOrders > 0 ? Number(((codOrders.length / totalOrders) * 100).toFixed(1)) : 0.0,
      },
    },
    delivery: {
      deliveredOrders,
      activeDeliveries,
      deliveryCompletionRate,
      avgDeliveryTime,
    },
    cancellations: {
      totalCancelled: cancelledOrders,
      cancellationRate,
      cancellationAmount: Math.round(cancellationAmount),
    },
    estimatedProfit: profitData,
    dateRange: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
    comparison,
  };
};

/**
 * Get Time-Series Revenue Trends (Daily, Weekly, Monthly)
 */
export const getRevenueTrends = async (start, end, groupBy = 'daily') => {
  const isMongo = mongoose.connection.readyState === 1;
  const orders = isMongo
    ? await MongooseOrder.find({ createdAt: { $gte: start, $lte: end } }).lean()
    : await Order.find({ createdAt: { $gte: start, $lte: end } });

  const buckets = new Map();

  // Helper to format date keys
  const getKey = (d) => {
    const date = new Date(d);
    if (groupBy === 'monthly') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    if (groupBy === 'weekly') {
      const firstJan = new Date(date.getFullYear(), 0, 1);
      const weekNum = Math.ceil(((date - firstJan) / 86400000 + firstJan.getDay() + 1) / 7);
      return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    }
    // Default: daily
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  orders.forEach((o) => {
    const key = getKey(o.createdAt);
    if (!buckets.has(key)) {
      buckets.set(key, {
        date: key,
        orderCount: 0,
        revenue: 0,
        onlineRevenue: 0,
        codRevenue: 0,
      });
    }

    const item = buckets.get(key);
    item.orderCount++;

    // Only count realized revenue: paymentStatus === 'Paid'
    if (o.paymentStatus === 'Paid' && o.orderStatus !== 'Cancelled') {
      const amt = Number(o.total) || 0;
      item.revenue += amt;
      if (o.paymentMethod === 'ONLINE') {
        item.onlineRevenue += amt;
      } else {
        item.codRevenue += amt;
      }
    }
  });

  // Sort chronologically and round numbers
  const results = Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date));
  results.forEach((r) => {
    r.revenue = Math.round(r.revenue);
    r.onlineRevenue = Math.round(r.onlineRevenue);
    r.codRevenue = Math.round(r.codRevenue);
  });

  return results;
};

/**
 * Get Time-Series Order Status Trends
 */
export const getOrderTrends = async (start, end, groupBy = 'daily') => {
  const isMongo = mongoose.connection.readyState === 1;
  const orders = isMongo
    ? await MongooseOrder.find({ createdAt: { $gte: start, $lte: end } }).lean()
    : await Order.find({ createdAt: { $gte: start, $lte: end } });

  const buckets = new Map();

  const getKey = (d) => {
    const date = new Date(d);
    if (groupBy === 'monthly') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    if (groupBy === 'weekly') {
      const firstJan = new Date(date.getFullYear(), 0, 1);
      const weekNum = Math.ceil(((date - firstJan) / 86400000 + firstJan.getDay() + 1) / 7);
      return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  orders.forEach((o) => {
    const key = getKey(o.createdAt);
    if (!buckets.has(key)) {
      buckets.set(key, {
        date: key,
        totalOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        pendingOrders: 0,
        otherOrders: 0,
      });
    }

    const item = buckets.get(key);
    item.totalOrders++;
    if (o.orderStatus === 'Delivered') item.deliveredOrders++;
    else if (o.orderStatus === 'Cancelled') item.cancelledOrders++;
    else if (o.orderStatus === 'Pending') item.pendingOrders++;
    else item.otherOrders++;
  });

  return Array.from(buckets.values()).sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Get Meal Performance using Order Snapshot Data
 * Preserves historical accuracy even if meals are renamed or repriced later
 */
export const getMealPerformance = async (start, end, limit = 5) => {
  const isMongo = mongoose.connection.readyState === 1;
  const orders = isMongo
    ? await MongooseOrder.find({
        createdAt: { $gte: start, $lte: end },
        orderStatus: { $ne: 'Cancelled' }, // Exclude cancelled orders from meal sales
      }).lean()
    : (await Order.find({ createdAt: { $gte: start, $lte: end } })).filter((o) => o.orderStatus !== 'Cancelled');

  // Also fetch current menu meals to know current availability and detect zero-sales meals
  let currentMeals = [];
  if (isMongo) {
    currentMeals = await MongooseMeal.find({}).lean();
  } else {
    currentMeals = await Meal.find({});
  }

  const mealMap = new Map();

  // Aggregate from order item snapshots
  orders.forEach((o) => {
    if (Array.isArray(o.items)) {
      const seenMealsInThisOrder = new Set();
      o.items.forEach((item) => {
        const mealId = item.meal ? item.meal.toString() : item.nameSnapshot;
        const name = item.nameSnapshot || 'Unknown Meal';
        const qty = Number(item.quantity) || 1;
        const total = Number(item.itemTotal) || (Number(item.priceSnapshot) * qty) || 0;

        if (!mealMap.has(mealId)) {
          mealMap.set(mealId, {
            mealId,
            mealName: name,
            quantitySold: 0,
            orderCount: 0,
            revenueGenerated: 0,
            image: item.imageSnapshot || '/src/assets/hero-thali.jpg',
            currentAvailability: true,
          });
        }

        const entry = mealMap.get(mealId);
        entry.quantitySold += qty;
        entry.revenueGenerated += total;

        if (!seenMealsInThisOrder.has(mealId)) {
          entry.orderCount += 1;
          seenMealsInThisOrder.add(mealId);
        }
      });
    }
  });

  // Cross-reference with current Meal collection for live availability
  currentMeals.forEach((cm) => {
    const cid = cm._id ? cm._id.toString() : cm.name;
    if (mealMap.has(cid)) {
      mealMap.get(cid).currentAvailability = Boolean(cm.isAvailable);
      mealMap.get(cid).category = cm.category;
    } else {
      // Menu meal with 0 sales in this date range
      mealMap.set(cid, {
        mealId: cid,
        mealName: cm.name,
        quantitySold: 0,
        orderCount: 0,
        revenueGenerated: 0,
        image: cm.image || '/src/assets/hero-thali.jpg',
        currentAvailability: Boolean(cm.isAvailable),
        category: cm.category,
      });
    }
  });

  // Calculate Average Selling Price and sort
  const allMealPerformances = Array.from(mealMap.values()).map((m) => {
    const avgPrice = m.quantitySold > 0 ? Math.round(m.revenueGenerated / m.quantitySold) : 0;
    return {
      ...m,
      revenueGenerated: Math.round(m.revenueGenerated),
      averageSellingPrice: avgPrice,
    };
  });

  // Sort descending by Quantity Sold, then Revenue
  allMealPerformances.sort((a, b) => {
    if (b.quantitySold !== a.quantitySold) {
      return b.quantitySold - a.quantitySold;
    }
    return b.revenueGenerated - a.revenueGenerated;
  });

  const topSelling = allMealPerformances.slice(0, limit);

  // Low performing: lowest non-zero sales or zero sales
  const lowPerforming = [...allMealPerformances]
    .reverse()
    .slice(0, limit);

  return {
    topSelling,
    lowPerforming,
    totalTrackedMeals: allMealPerformances.length,
  };
};

/**
 * Get Comprehensive Customer Analytics & Top Customers
 * Strips password, tokens, and sensitive authentication fields
 */
export const getCustomerAnalytics = async (start, end) => {
  const isMongo = mongoose.connection.readyState === 1;

  let allCustomers = [];
  let allHistoricalOrders = [];
  let rangeOrders = [];

  if (isMongo) {
    allCustomers = await MongooseUser.find({ role: 'customer' }).select('-password -__v').lean();
    allHistoricalOrders = await MongooseOrder.find({}).lean();
    rangeOrders = await MongooseOrder.find({ createdAt: { $gte: start, $lte: end } }).lean();
  } else {
    allCustomers = await User.find({ role: 'customer' });
    allHistoricalOrders = await Order.find({});
    rangeOrders = await Order.find({ createdAt: { $gte: start, $lte: end } });
  }

  const totalCustomers = allCustomers.length;
  const newCustomers = allCustomers.filter((c) => new Date(c.createdAt) >= start && new Date(c.createdAt) <= end).length;

  // Active Customers in range
  const activeCustomerIds = new Set(rangeOrders.map((o) => o.user?.toString()).filter(Boolean));
  const activeCustomers = activeCustomerIds.size;
  const inactiveCustomers = Math.max(0, totalCustomers - activeCustomers);

  // Returning Customers in range
  const priorCustomerIds = new Set(
    allHistoricalOrders.filter((o) => new Date(o.createdAt) < start).map((o) => o.user?.toString()).filter(Boolean)
  );
  let returningCount = 0;
  for (const uid of activeCustomerIds) {
    if (priorCustomerIds.has(uid)) returningCount++;
  }

  // Aggregate user order stats
  const userStats = new Map();
  allCustomers.forEach((c) => {
    userStats.set(c._id.toString(), {
      _id: c._id.toString(),
      name: c.name,
      email: c.email,
      phone: c.phone,
      totalOrders: 0,
      completedOrders: 0,
      totalSpent: 0,
      lastOrderDate: null,
    });
  });

  allHistoricalOrders.forEach((o) => {
    if (o.user) {
      const uid = o.user.toString();
      if (!userStats.has(uid)) {
        userStats.set(uid, {
          _id: uid,
          name: o.customerSnapshot?.name || 'Guest User',
          email: o.customerSnapshot?.email || '',
          phone: o.customerSnapshot?.phone || '',
          totalOrders: 0,
          completedOrders: 0,
          totalSpent: 0,
          lastOrderDate: null,
        });
      }

      const st = userStats.get(uid);
      st.totalOrders++;
      if (o.orderStatus === 'Delivered') {
        st.completedOrders++;
      }
      if (o.paymentStatus === 'Paid' && o.orderStatus !== 'Cancelled') {
        st.totalSpent += Number(o.total) || 0;
      }

      const oDate = new Date(o.createdAt);
      if (!st.lastOrderDate || oDate > new Date(st.lastOrderDate)) {
        st.lastOrderDate = oDate.toISOString();
      }
    }
  });

  // Calculate repeat customer segments
  let customersWith2Plus = 0;
  let customersWith5Plus = 0;
  let customersNoOrder30Days = 0;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  userStats.forEach((st) => {
    if (st.totalOrders >= 2) customersWith2Plus++;
    if (st.totalOrders >= 5) customersWith5Plus++;
    if (!st.lastOrderDate || new Date(st.lastOrderDate) < thirtyDaysAgo) {
      customersNoOrder30Days++;
    }
    st.totalSpent = Math.round(st.totalSpent);
  });

  const orderingCustomersCount = Array.from(userStats.values()).filter((st) => st.totalOrders > 0).length;
  const repeatCustomerPercentage = orderingCustomersCount > 0
    ? Number(((customersWith2Plus / orderingCustomersCount) * 100).toFixed(2))
    : 0.0;

  const totalCompletedRevenue = Array.from(userStats.values()).reduce((sum, st) => sum + st.totalSpent, 0);
  const totalCompletedOrders = Array.from(userStats.values()).reduce((sum, st) => sum + st.totalOrders, 0);

  const avgOrdersPerCustomer = orderingCustomersCount > 0
    ? Number((totalCompletedOrders / orderingCustomersCount).toFixed(2))
    : 0.0;

  const avgCustomerSpend = orderingCustomersCount > 0
    ? Math.round(totalCompletedRevenue / orderingCustomersCount)
    : 0;

  // Top Customers (sorted by totalSpent desc, completedOrders desc)
  const topCustomers = Array.from(userStats.values())
    .filter((st) => st.totalOrders > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent || b.completedOrders - a.completedOrders)
    .slice(0, 10);

  return {
    overview: {
      totalCustomers,
      newCustomers,
      activeCustomers,
      inactiveCustomers,
      returningCustomers: returningCount,
      customersWith2Plus,
      customersWith5Plus,
      customersNoOrder30Days,
      repeatCustomerPercentage,
      avgOrdersPerCustomer,
      avgCustomerSpend,
    },
    topCustomers,
  };
};

/**
 * Get Detailed Cancellation Analytics
 */
export const getCancellationAnalytics = async (start, end) => {
  const isMongo = mongoose.connection.readyState === 1;
  const orders = isMongo
    ? await MongooseOrder.find({ createdAt: { $gte: start, $lte: end } }).lean()
    : await Order.find({ createdAt: { $gte: start, $lte: end } });

  const totalOrders = orders.length;
  const cancelledOrders = orders.filter((o) => o.orderStatus === 'Cancelled');
  const totalCancelled = cancelledOrders.length;
  const cancellationRate = totalOrders > 0 ? Number(((totalCancelled / totalOrders) * 100).toFixed(2)) : 0.0;

  let customerCancellations = 0;
  let ownerCancellations = 0;
  let cancellationAmount = 0;
  const reasonMap = new Map();

  cancelledOrders.forEach((o) => {
    cancellationAmount += Number(o.total) || 0;

    // Determine cancellation source
    const reason = (o.cancellationReason || '').trim() || 'No reason specified';
    reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);

    if (o.cancelledBy) {
      if (o.cancelledBy.toString() === o.user?.toString()) {
        customerCancellations++;
      } else {
        ownerCancellations++;
      }
    } else {
      // Fallback inspection: if reason contains "owner" or "admin" or cancelled in owner note
      customerCancellations++;
    }
  });

  const reasons = Array.from(reasonMap.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalOrders,
    totalCancelled,
    cancellationRate,
    customerCancellations,
    ownerCancellations,
    cancellationAmount: Math.round(cancellationAmount),
    reasons,
  };
};

/**
 * Get Comprehensive Payment Analytics
 */
export const getPaymentAnalytics = async (start, end) => {
  const isMongo = mongoose.connection.readyState === 1;
  const orders = isMongo
    ? await MongooseOrder.find({ createdAt: { $gte: start, $lte: end } }).lean()
    : await Order.find({ createdAt: { $gte: start, $lte: end } });

  const totalOrders = orders.length;

  // Online
  const onlineOrders = orders.filter((o) => o.paymentMethod === 'ONLINE');
  const onlineSuccessful = onlineOrders.filter((o) => o.paymentStatus === 'Paid');
  const onlineFailed = onlineOrders.filter((o) => o.paymentStatus === 'Failed');
  const onlineRefunded = onlineOrders.filter((o) => o.paymentStatus === 'Refunded');

  const onlineRevenue = onlineSuccessful.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const onlineFailedAmount = onlineFailed.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const onlineRefundAmount = onlineRefunded.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // COD
  const codOrders = orders.filter((o) => (o.paymentMethod || 'COD') === 'COD');
  const codCollected = codOrders.filter((o) => o.paymentStatus === 'Paid');
  const codPending = codOrders.filter((o) => o.paymentStatus === 'Pending' && o.orderStatus !== 'Cancelled');

  const codCollectedAmount = codCollected.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const codPendingAmount = codPending.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const codTotalEligible = codCollectedAmount + codPendingAmount;
  const codCollectionRate = codTotalEligible > 0
    ? Number(((codCollectedAmount / codTotalEligible) * 100).toFixed(2))
    : 0.0;

  // Distribution
  const onlinePercentage = totalOrders > 0 ? Number(((onlineOrders.length / totalOrders) * 100).toFixed(2)) : 0.0;
  const codPercentage = totalOrders > 0 ? Number(((codOrders.length / totalOrders) * 100).toFixed(2)) : 0.0;

  // Definition 18: Payment Success Rate = Successful Online Payments ÷ Total Online Payment Attempts × 100
  const totalOnlineAttempts = onlineSuccessful.length + onlineFailed.length;
  const paymentSuccessRate = totalOnlineAttempts > 0
    ? Number(((onlineSuccessful.length / totalOnlineAttempts) * 100).toFixed(2))
    : 0.0;

  return {
    totalOrders,
    online: {
      totalOnlineOrders: onlineOrders.length,
      successfulPayments: onlineSuccessful.length,
      failedPayments: onlineFailed.length,
      paymentSuccessRate,
      totalOnlineRevenue: Math.round(onlineRevenue),
      failedAmount: Math.round(onlineFailedAmount),
      refundAmount: Math.round(onlineRefundAmount),
    },
    cod: {
      totalCodOrders: codOrders.length,
      codCollectedCount: codCollected.length,
      codCollectedAmount: Math.round(codCollectedAmount),
      pendingCodCount: codPending.length,
      pendingCodAmount: Math.round(codPendingAmount),
      codCollectionRate,
    },
    distribution: {
      onlinePercentage,
      codPercentage,
    },
  };
};

/**
 * Get Operational Delivery Performance
 */
export const getDeliveryPerformance = async (start, end) => {
  const isMongo = mongoose.connection.readyState === 1;
  const allOrders = isMongo ? await MongooseOrder.find({}).lean() : await Order.find({});
  const rangeOrders = isMongo
    ? await MongooseOrder.find({ createdAt: { $gte: start, $lte: end } }).lean()
    : await Order.find({ createdAt: { $gte: start, $lte: end } });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  const deliveredToday = allOrders.filter((o) => {
    if (o.orderStatus !== 'Delivered') return false;
    const upd = o.updatedAt || o.createdAt;
    return new Date(upd) >= startOfToday;
  }).length;

  const outForDelivery = allOrders.filter((o) => o.orderStatus === 'Out for Delivery').length;
  const pendingDelivery = allOrders.filter((o) => ['Pending', 'Confirmed', 'Preparing'].includes(o.orderStatus)).length;
  const deliveredInRange = rangeOrders.filter((o) => o.orderStatus === 'Delivered').length;

  const totalRangeOrders = rangeOrders.length;
  const deliveryCompletionRate = totalRangeOrders > 0
    ? Number(((deliveredInRange / totalRangeOrders) * 100).toFixed(2))
    : 0.0;

  // Duration computation
  let durations = [];
  rangeOrders.forEach((o) => {
    if (o.orderStatus === 'Delivered' && Array.isArray(o.statusHistory)) {
      const deliveredEntry = o.statusHistory.find((h) => h.status === 'Delivered');
      const startEntry = o.statusHistory.find((h) => h.status === 'Out for Delivery' || h.status === 'Preparing' || h.status === 'Confirmed');
      const sTime = startEntry ? new Date(startEntry.changedAt) : new Date(o.createdAt);
      if (deliveredEntry && sTime) {
        const diffMins = Math.round((new Date(deliveredEntry.changedAt).getTime() - sTime.getTime()) / (60 * 1000));
        if (diffMins > 0 && diffMins < 600) {
          durations.push(diffMins);
        }
      }
    }
  });

  const avgCompletionTime = durations.length > 0
    ? `${Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)} mins`
    : 'Insufficient data';

  return {
    deliveredToday,
    outForDelivery,
    pendingDelivery,
    deliveredInRange,
    deliveryCompletionRate,
    avgCompletionTime,
  };
};

/**
 * Get Peak Order Times (Hourly & Weekday Analysis)
 */
export const getPeakTimes = async (start, end) => {
  const isMongo = mongoose.connection.readyState === 1;
  const orders = isMongo
    ? await MongooseOrder.find({ createdAt: { $gte: start, $lte: end } }).lean()
    : await Order.find({ createdAt: { $gte: start, $lte: end } });

  // 24 Hours breakdown
  const hours = Array.from({ length: 24 }, (_, i) => {
    const period = i >= 12 ? 'PM' : 'AM';
    const displayHour = i % 12 === 0 ? 12 : i % 12;
    return {
      hour: i,
      label: `${displayHour} ${period}`,
      orderCount: 0,
      revenue: 0,
    };
  });

  // 7 Weekdays breakdown
  const weekdays = [
    { dayIndex: 0, dayName: 'Sunday', orderCount: 0, revenue: 0 },
    { dayIndex: 1, dayName: 'Monday', orderCount: 0, revenue: 0 },
    { dayIndex: 2, dayName: 'Tuesday', orderCount: 0, revenue: 0 },
    { dayIndex: 3, dayName: 'Wednesday', orderCount: 0, revenue: 0 },
    { dayIndex: 4, dayName: 'Thursday', orderCount: 0, revenue: 0 },
    { dayIndex: 5, dayName: 'Friday', orderCount: 0, revenue: 0 },
    { dayIndex: 6, dayName: 'Saturday', orderCount: 0, revenue: 0 },
  ];

  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const hour = d.getHours();
    const day = d.getDay();

    hours[hour].orderCount++;
    weekdays[day].orderCount++;

    if (o.paymentStatus === 'Paid' && o.orderStatus !== 'Cancelled') {
      const amt = Number(o.total) || 0;
      hours[hour].revenue += amt;
      weekdays[day].revenue += amt;
    }
  });

  hours.forEach((h) => (h.revenue = Math.round(h.revenue)));
  weekdays.forEach((w) => (w.revenue = Math.round(w.revenue)));

  // Identify Peak Hour & Peak Day
  let peakHourObj = hours[0];
  hours.forEach((h) => {
    if (h.orderCount > peakHourObj.orderCount) peakHourObj = h;
  });

  let peakDayObj = weekdays[0];
  weekdays.forEach((w) => {
    if (w.orderCount > peakDayObj.orderCount) peakDayObj = w;
  });

  return {
    peakHour: peakHourObj.orderCount > 0 ? peakHourObj.label : 'No data',
    peakDay: peakDayObj.orderCount > 0 ? peakDayObj.dayName : 'No data',
    hours,
    weekdays,
  };
};

/**
 * Generate RFC 4180 Compliant CSV Export
 */
export const generateCSVReport = async (reportType, start, end) => {
  const isMongo = mongoose.connection.readyState === 1;

  // Helper to escape CSV values
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  if (reportType === 'sales') {
    const orders = isMongo
      ? await MongooseOrder.find({ createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }).lean()
      : await Order.find({ createdAt: { $gte: start, $lte: end } });

    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Phone',
      'Items Count',
      'Items Summary',
      'Subtotal (INR)',
      'Total (INR)',
      'Payment Method',
      'Payment Status',
      'Order Status',
    ];

    const rows = orders.map((o) => {
      const itemSummary = Array.isArray(o.items)
        ? o.items.map((i) => `${i.nameSnapshot} x${i.quantity}`).join('; ')
        : '';
      return [
        escapeCsv(o.orderNumber),
        escapeCsv(new Date(o.createdAt).toISOString()),
        escapeCsv(o.customerSnapshot?.name || 'Customer'),
        escapeCsv(o.customerSnapshot?.phone || ''),
        escapeCsv(o.totalItems || (o.items ? o.items.length : 1)),
        escapeCsv(itemSummary),
        escapeCsv(o.subtotal || 0),
        escapeCsv(o.total || 0),
        escapeCsv(o.paymentMethod || 'COD'),
        escapeCsv(o.paymentStatus || 'Pending'),
        escapeCsv(o.orderStatus || 'Pending'),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
  }

  if (reportType === 'payments') {
    const payments = isMongo
      ? await MongoosePayment.find({ createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }).lean()
      : await DualModePayment.find({ createdAt: { $gte: start, $lte: end } });

    const headers = [
      'Payment ID',
      'Order ID',
      'Gateway',
      'Method',
      'Amount (INR)',
      'Status',
      'Date',
      'Gateway Order ID',
      'Gateway Payment ID',
    ];

    const rows = payments.map((p) => [
      escapeCsv(p.paymentId),
      escapeCsv(p.order ? p.order.toString() : ''),
      escapeCsv(p.gateway || 'COD'),
      escapeCsv(p.method || 'COD'),
      escapeCsv(p.amount || 0),
      escapeCsv(p.status || 'Pending'),
      escapeCsv(new Date(p.createdAt).toISOString()),
      escapeCsv(p.gatewayOrderId || ''),
      escapeCsv(p.gatewayPaymentId || ''),
    ].join(','));

    return [headers.join(','), ...rows].join('\r\n');
  }

  if (reportType === 'customers') {
    const custAnalytics = await getCustomerAnalytics(start, end);
    const headers = [
      'Customer ID',
      'Name',
      'Email',
      'Phone',
      'Total Orders',
      'Completed Orders',
      'Total Spent (INR)',
      'Last Order Date',
    ];

    const rows = custAnalytics.topCustomers.map((c) => [
      escapeCsv(c._id),
      escapeCsv(c.name),
      escapeCsv(c.email),
      escapeCsv(c.phone),
      escapeCsv(c.totalOrders),
      escapeCsv(c.completedOrders),
      escapeCsv(c.totalSpent),
      escapeCsv(c.lastOrderDate || 'None'),
    ].join(','));

    return [headers.join(','), ...rows].join('\r\n');
  }

  if (reportType === 'meals') {
    const mealData = await getMealPerformance(start, end, 50);
    const headers = [
      'Meal Name',
      'Category',
      'Quantity Sold',
      'Order Count',
      'Revenue Generated (INR)',
      'Average Selling Price (INR)',
      'Currently Available',
    ];

    const allMeals = [...mealData.topSelling, ...mealData.lowPerforming];
    // deduplicate by mealId
    const seen = new Set();
    const uniqueMeals = [];
    allMeals.forEach((m) => {
      if (!seen.has(m.mealId)) {
        seen.add(m.mealId);
        uniqueMeals.push(m);
      }
    });

    const rows = uniqueMeals.map((m) => [
      escapeCsv(m.mealName),
      escapeCsv(m.category || 'General'),
      escapeCsv(m.quantitySold),
      escapeCsv(m.orderCount),
      escapeCsv(m.revenueGenerated),
      escapeCsv(m.averageSellingPrice),
      escapeCsv(m.currentAvailability ? 'Yes' : 'No'),
    ].join(','));

    return [headers.join(','), ...rows].join('\r\n');
  }

  throw new Error(`Unsupported report type: ${reportType}. Supported types: sales, payments, customers, meals`);
};
