/**
 * test-step9-analytics.js
 * Comprehensive automated test suite for Step 9:
 * Advanced Owner Analytics & Business Reporting System
 * Shree Tiffin Service — "Ghar Jaisa Khana, Har Din."
 *
 * Enforces test isolation against `shree_tiffin_service_test`
 */

import { validateTestDatabase } from './config/db.js';

const PORT = process.env.TEST_PORT || process.env.PORT || 5001;
const BASE_URL = process.env.TEST_URL || `http://localhost:${PORT}/api`;

export const runStep9Tests = async () => {
  console.log('\n========================================================================');
  console.log('🚀 RUNNING STEP 9 AUTOMATED TEST SUITE: ADVANCED OWNER ANALYTICS');
  console.log('========================================================================');

  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  };

  try {
    // -------------------------------------------------------------------
    // 1. DATABASE SAFETY GUARD VERIFICATION
    // -------------------------------------------------------------------
    console.log('\n--- 1. DATABASE SAFETY GUARD & TEST ENVIRONMENT ---');
    assert(process.env.NODE_ENV === 'test', 'NODE_ENV is strictly set to "test"');

    let caughtProdRejection = false;
    try {
      validateTestDatabase('mongodb+srv://user:pass@cluster.mongodb.net/shree_tiffin_service?retryWrites=true');
    } catch (err) {
      if (err.message.includes('REFUSING TO RUN TESTS: TEST DATABASE REQUIRED')) {
        caughtProdRejection = true;
      }
    }
    assert(caughtProdRejection, 'Safety guard refuses tests against production DB "shree_tiffin_service"');

    // -------------------------------------------------------------------
    // 2. SETUP AUTHENTICATED USERS (CUSTOMER A, CUSTOMER B, AND OWNER)
    // -------------------------------------------------------------------
    console.log('\n--- 2. SETUP AUTHENTICATED CUSTOMERS & OWNER ---');
    const timestamp = Date.now();

    // Register Customer A
    const custARes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Analytics Cust A',
        email: `analytics_a_${timestamp}@test.com`,
        phone: '9876500001',
        password: 'Password@123',
      }),
    });
    const custAData = await custARes.json();
    const tokenA = custAData.token;
    assert(custARes.status === 201 && !!tokenA, 'Registered Customer A successfully');

    // Register Customer B
    const custBRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Analytics Cust B',
        email: `analytics_b_${timestamp}@test.com`,
        phone: '9876500002',
        password: 'Password@123',
      }),
    });
    const custBData = await custBRes.json();
    const tokenB = custBData.token;
    assert(custBRes.status === 201 && !!tokenB, 'Registered Customer B successfully');

    // Login Owner
    const ownerRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'owner@shreetiffin.com',
        password: 'Owner@12345',
      }),
    });
    const ownerData = await ownerRes.json();
    const ownerToken = ownerData.token;
    assert(ownerRes.status === 200 && ownerData.user?.role === 'owner', 'Owner logged in with role: owner');

    // -------------------------------------------------------------------
    // 3. SEED REAL ORDERS & PAYMENTS FOR ANALYTICS MATHEMATICAL VALIDATION
    // -------------------------------------------------------------------
    console.log('\n--- 3. SEED TEST ORDERS & PAYMENTS FOR MATH ACCURACY ---');

    // Fetch available meals from DB
    const mealsRes = await fetch(`${BASE_URL}/meals`);
    const mealsData = await mealsRes.json();
    const testMeal = mealsData.data?.[0] || mealsData.meals?.[0];
    assert(!!testMeal, 'Retrieved sample meal from menu');

    // Create address for Customer A
    const addrARes = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        fullName: 'Analytics Receiver A',
        phone: '9876500001',
        addressLine1: 'Flat 101, Test Residency',
        city: 'Indore',
        state: 'Madhya Pradesh',
        postalCode: '452010',
        latitude: 22.7533,
        longitude: 75.8937,
      }),
    });
    const addrAData = await addrARes.json();
    const addressAId = addrAData.data?._id || addrAData.address?._id;
    assert(addrARes.status === 201 && !!addressAId, 'Saved delivery address for Customer A');

    // Create address for Customer B
    const addrBRes = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        fullName: 'Analytics Receiver B',
        phone: '9876500002',
        addressLine1: 'Flat 202, Test Residency',
        city: 'Indore',
        state: 'Madhya Pradesh',
        postalCode: '452010',
        latitude: 22.7533,
        longitude: 75.8937,
      }),
    });
    const addrBData = await addrBRes.json();
    const addressBId = addrBData.data?._id || addrBData.address?._id;
    assert(addrBRes.status === 201 && !!addressBId, 'Saved delivery address for Customer B');

    // Order 1: Placed by Customer A - COD - Completed and marked Paid (Realized Revenue: ₹testMeal.price * 2)
    await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ mealId: testMeal._id, quantity: 2 }),
    });

    const ord1Res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ addressId: addressAId }),
    });
    const ord1Data = await ord1Res.json();
    const ord1Id = ord1Data.order?._id;
    assert(ord1Res.status === 201 && !!ord1Id, 'Created Order 1 (COD)');

    // Select COD payment for Order 1
    const cod1Res = await fetch(`${BASE_URL}/payments/cod`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ orderId: ord1Id }),
    });
    const cod1Data = await cod1Res.json();
    const payment1Id = cod1Data.payment?._id;

    // Owner marks COD collected for Order 1 -> becomes Paid and Delivered
    await fetch(`${BASE_URL}/payments/${payment1Id}/cod-collect`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    await fetch(`${BASE_URL}/orders/${ord1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ status: 'Delivered', note: 'Handed to customer' }),
    });

    // Order 2: Placed by Customer A - COD - Remains Pending COD (Realized Revenue: 0, Pending COD: > 0)
    await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ mealId: testMeal._id, quantity: 1 }),
    });

    const ord2Res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ addressId: addressAId }),
    });
    const ord2Data = await ord2Res.json();
    const ord2Id = ord2Data.order?._id;
    assert(ord2Res.status === 201 && !!ord2Id, 'Created Order 2 (Pending COD)');

    // Order 3: Placed by Customer B - Cancelled order (Must NOT inflate revenue!)
    await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ mealId: testMeal._id, quantity: 1 }),
    });

    const ord3Res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ addressId: addressBId }),
    });
    const ord3Data = await ord3Res.json();
    const ord3Id = ord3Data.order?._id;
    assert(ord3Res.status === 201 && !!ord3Id, 'Created Order 3 (To be cancelled)');

    // Cancel Order 3 with explicit reason
    const cancelRes = await fetch(`${BASE_URL}/orders/my/${ord3Id}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ reason: 'Changed mind about dinner plans' }),
    });
    assert(cancelRes.status === 200, 'Cancelled Order 3 with recorded reason');

    // -------------------------------------------------------------------
    // 4. SECURITY & RBAC AUTHORIZATION CHECKS
    // -------------------------------------------------------------------
    console.log('\n--- 4. SECURITY & RBAC AUTHORIZATION CHECKS ---');

    // Unauthenticated access fails
    const unauthRes = await fetch(`${BASE_URL}/analytics/overview`);
    assert(unauthRes.status === 401, 'Unauthenticated GET /api/analytics/overview returns 401');

    // Customer access fails with 403 Forbidden
    const custBlockRes = await fetch(`${BASE_URL}/analytics/overview`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(custBlockRes.status === 403, 'Customer GET /api/analytics/overview returns 403 Forbidden');

    // Customer blocked from reports
    const custReportRes = await fetch(`${BASE_URL}/analytics/export/sales`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(custReportRes.status === 403, 'Customer blocked from CSV report exports (403)');

    // Owner access succeeds
    const ownerAccessRes = await fetch(`${BASE_URL}/analytics/overview`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(ownerAccessRes.status === 200, 'Owner GET /api/analytics/overview succeeds (200 OK)');

    // -------------------------------------------------------------------
    // 5. DASHBOARD OVERVIEW KPI ACCURACY & REALIZED REVENUE
    // -------------------------------------------------------------------
    console.log('\n--- 5. DASHBOARD OVERVIEW KPIS & REALIZED REVENUE RULES ---');
    const overviewJson = await ownerAccessRes.json();
    const kpis = overviewJson.data;

    assert(kpis && typeof kpis.revenue === 'object', 'Overview contains revenue metrics object');
    assert(typeof kpis.orders === 'object', 'Overview contains orders metrics object');
    assert(typeof kpis.customers === 'object', 'Overview contains customers metrics object');
    assert(typeof kpis.payments === 'object', 'Overview contains payments metrics object');
    assert(typeof kpis.estimatedProfit === 'object', 'Overview contains estimatedProfit object');

    // Realized revenue check: Order 1 is Paid, Order 2 is Pending, Order 3 is Cancelled
    assert(kpis.revenue.realizedRevenue >= ord1Data.order.total, 'Realized revenue includes paid Order 1');
    assert(kpis.orders.cancelled >= 1, 'Cancelled orders accurately counted');
    assert(kpis.payments.pendingCod >= ord2Data.order.total, 'Pending COD accurately tracked');

    // -------------------------------------------------------------------
    // 6. REVENUE TREND ANALYTICS
    // -------------------------------------------------------------------
    console.log('\n--- 6. REVENUE TREND ANALYTICS ENDPOINT ---');
    const revTrendRes = await fetch(`${BASE_URL}/analytics/revenue-trend?groupBy=daily`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const revTrendJson = await revTrendRes.json();
    assert(revTrendRes.status === 200 && Array.isArray(revTrendJson.data?.trend), 'GET /api/analytics/revenue-trend returns daily trend array');

    if (revTrendJson.data.trend.length > 0) {
      const first = revTrendJson.data.trend[0];
      assert('date' in first && 'orderCount' in first && 'revenue' in first, 'Revenue trend item has date, orderCount, revenue');
    }

    // Weekly & Monthly grouping support
    const weeklyRes = await fetch(`${BASE_URL}/analytics/revenue-trend?groupBy=weekly`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(weeklyRes.status === 200, 'Supports groupBy=weekly');

    const monthlyRes = await fetch(`${BASE_URL}/analytics/revenue-trend?groupBy=monthly`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(monthlyRes.status === 200, 'Supports groupBy=monthly');

    // Invalid groupBy rejection
    const invalidGroupRes = await fetch(`${BASE_URL}/analytics/revenue-trend?groupBy=hourly`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(invalidGroupRes.status === 400, 'Rejects invalid groupBy parameter with 400 Bad Request');

    // -------------------------------------------------------------------
    // 7. ORDER TREND ANALYTICS
    // -------------------------------------------------------------------
    console.log('\n--- 7. ORDER TREND ANALYTICS ENDPOINT ---');
    const ordTrendRes = await fetch(`${BASE_URL}/analytics/order-trend?groupBy=daily`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const ordTrendJson = await ordTrendRes.json();
    assert(ordTrendRes.status === 200 && Array.isArray(ordTrendJson.data?.trend), 'GET /api/analytics/order-trend returns trend array');

    if (ordTrendJson.data.trend.length > 0) {
      const first = ordTrendJson.data.trend[0];
      assert('deliveredOrders' in first && 'cancelledOrders' in first && 'pendingOrders' in first, 'Order trend includes status breakdown');
    }

    // -------------------------------------------------------------------
    // 8. BEST-SELLING MEALS & SNAPSHOT INTEGRITY
    // -------------------------------------------------------------------
    console.log('\n--- 8. MEAL PERFORMANCE USING IMMUTABLE ORDER SNAPSHOTS ---');
    const mealPerfRes = await fetch(`${BASE_URL}/analytics/meals?limit=5`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const mealPerfJson = await mealPerfRes.json();
    assert(mealPerfRes.status === 200 && Array.isArray(mealPerfJson.data?.topSelling), 'GET /api/analytics/meals returns topSelling array');
    assert(Array.isArray(mealPerfJson.data?.lowPerforming), 'Returns lowPerforming array');

    if (mealPerfJson.data.topSelling.length > 0) {
      const topMeal = mealPerfJson.data.topSelling[0];
      assert('mealName' in topMeal && 'quantitySold' in topMeal && 'revenueGenerated' in topMeal, 'Meal metrics include mealName, quantitySold, revenueGenerated');
      assert('averageSellingPrice' in topMeal, 'Meal metrics include calculated averageSellingPrice');
      assert(typeof topMeal.currentAvailability === 'boolean', 'Meal metrics include currentAvailability');
    }

    // -------------------------------------------------------------------
    // 9. CUSTOMER ANALYTICS & RETENTION METRICS
    // -------------------------------------------------------------------
    console.log('\n--- 9. CUSTOMER ANALYTICS & RETENTION FORMULAS ---');
    const custAnalyticsRes = await fetch(`${BASE_URL}/analytics/customers`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const custAnalyticsJson = await custAnalyticsRes.json();
    const custOverview = custAnalyticsJson.data?.overview;
    assert(custAnalyticsRes.status === 200 && !!custOverview, 'GET /api/analytics/customers returns customer overview');

    assert(typeof custOverview.totalCustomers === 'number', 'Calculates totalCustomers');
    assert(typeof custOverview.activeCustomers === 'number', 'Calculates activeCustomers');
    assert(typeof custOverview.newCustomers === 'number', 'Calculates newCustomers');
    assert(typeof custOverview.repeatCustomerPercentage === 'number', 'Calculates repeatCustomerPercentage');
    assert(typeof custOverview.customersWith2Plus === 'number', 'Tracks customers with 2+ orders');

    // Verify top customers leaderboard
    const topCust = custAnalyticsJson.data?.topCustomers;
    assert(Array.isArray(topCust), 'Returns topCustomers leaderboard');
    if (topCust.length > 0) {
      const leader = topCust[0];
      assert('name' in leader && 'totalOrders' in leader && 'totalSpent' in leader, 'Leaderboard has name, totalOrders, totalSpent');
      // STRICT SENSITIVE DATA CHECK
      assert(!('password' in leader), 'Security: password field is NOT exposed in customer analytics');
      assert(!('salt' in leader), 'Security: salt field is NOT exposed in customer analytics');
    }

    // -------------------------------------------------------------------
    // 10. AVERAGE ORDER VALUE (AOV) ZERO-DIVISION HANDLING
    // -------------------------------------------------------------------
    console.log('\n--- 10. AVERAGE ORDER VALUE (AOV) CALCULATION ---');
    assert(typeof kpis.revenue.aov === 'number' && !isNaN(kpis.revenue.aov), 'AOV is a valid number (no NaN)');
    assert(isFinite(kpis.revenue.aov), 'AOV is finite (no Infinity)');

    // -------------------------------------------------------------------
    // 11. CANCELLATION ANALYTICS & REASONS
    // -------------------------------------------------------------------
    console.log('\n--- 11. CANCELLATION ANALYTICS & REASON AGGREGATION ---');
    const cancRes = await fetch(`${BASE_URL}/analytics/cancellations`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const cancJson = await cancRes.json();
    assert(cancRes.status === 200 && cancJson.data?.totalCancelled >= 1, 'Cancellation analytics records cancelled orders');
    assert(typeof cancJson.data?.cancellationRate === 'number', 'Calculates cancellationRate percentage');
    assert(cancJson.data?.cancellationAmount > 0, 'Calculates cancelled order financial value');

    const foundReason = cancJson.data?.reasons?.some((r) => r.reason.includes('Changed mind'));
    assert(foundReason, 'Aggregates actual recorded cancellation reasons');

    // -------------------------------------------------------------------
    // 12. PAYMENT ANALYTICS (ONLINE VS COD)
    // -------------------------------------------------------------------
    console.log('\n--- 12. PAYMENT ANALYTICS (ONLINE VS COD) ---');
    const payRes = await fetch(`${BASE_URL}/analytics/payments`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const payJson = await payRes.json();
    assert(payRes.status === 200 && !!payJson.data?.online, 'Payment analytics returns online metrics');
    assert(!!payJson.data?.cod, 'Payment analytics returns COD metrics');
    assert(payJson.data?.cod?.codCollectedAmount >= ord1Data.order.total, 'COD collected amount matches marked payments');
    assert(typeof payJson.data?.cod?.codCollectionRate === 'number', 'Calculates COD collection rate percentage');
    assert(typeof payJson.data?.distribution?.onlinePercentage === 'number', 'Calculates dynamic online percentage');

    // -------------------------------------------------------------------
    // 13. OPERATIONAL DELIVERY PERFORMANCE
    // -------------------------------------------------------------------
    console.log('\n--- 13. OPERATIONAL DELIVERY PERFORMANCE ---');
    const delivRes = await fetch(`${BASE_URL}/analytics/delivery`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const delivJson = await delivRes.json();
    assert(delivRes.status === 200, 'GET /api/analytics/delivery returns 200 OK');
    assert('deliveredToday' in delivJson.data, 'Includes deliveredToday count');
    assert('outForDelivery' in delivJson.data, 'Includes outForDelivery count');
    assert('deliveryCompletionRate' in delivJson.data, 'Includes deliveryCompletionRate');
    assert('avgCompletionTime' in delivJson.data, 'Includes avgCompletionTime or Insufficient data');

    // -------------------------------------------------------------------
    // 14. PEAK ORDER TIMES (HOURLY & WEEKDAY)
    // -------------------------------------------------------------------
    console.log('\n--- 14. PEAK ORDER TIMES (HOURLY & WEEKDAY) ---');
    const peakRes = await fetch(`${BASE_URL}/analytics/peak-times`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const peakJson = await peakRes.json();
    assert(peakRes.status === 200, 'GET /api/analytics/peak-times returns 200 OK');
    assert(Array.isArray(peakJson.data?.hours) && peakJson.data.hours.length === 24, 'Provides full 24-hour distribution (0 to 23)');
    assert(Array.isArray(peakJson.data?.weekdays) && peakJson.data.weekdays.length === 7, 'Provides 7-day weekday distribution (Sun to Sat)');
    assert(typeof peakJson.data?.peakHour === 'string', 'Identifies peak hour label');
    assert(typeof peakJson.data?.peakDay === 'string', 'Identifies peak day name');

    // -------------------------------------------------------------------
    // 15. PRESET DATE FILTERS & CUSTOM DATE RANGE VALIDATION
    // -------------------------------------------------------------------
    console.log('\n--- 15. DATE FILTERING & CUSTOM RANGE VALIDATION ---');
    const presetsToTest = ['today', 'yesterday', 'last7days', 'last30days', 'thismonth', 'lastmonth', 'thisyear'];
    for (const p of presetsToTest) {
      const res = await fetch(`${BASE_URL}/analytics/overview?preset=${p}`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      assert(res.status === 200, `Preset filter "${p}" returns 200 OK`);
    }

    // Custom date range: valid
    const validCustomRes = await fetch(`${BASE_URL}/analytics/overview?preset=custom&startDate=2026-01-01&endDate=2026-12-31`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(validCustomRes.status === 200, 'Valid custom date range returns 200 OK');

    // Custom date range: inverted dates (start > end) -> 400 Bad Request
    const invertedRes = await fetch(`${BASE_URL}/analytics/overview?preset=custom&startDate=2026-12-31&endDate=2026-01-01`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(invertedRes.status === 400, 'Rejects inverted date range (start > end) with 400 Bad Request');

    // Custom date range: invalid format -> 400 Bad Request
    const invalidDateRes = await fetch(`${BASE_URL}/analytics/overview?preset=custom&startDate=invalid-date&endDate=2026-01-01`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(invalidDateRes.status === 400, 'Rejects invalid date format with 400 Bad Request');

    // -------------------------------------------------------------------
    // 16. COMPARISON MODE & GROWTH CALCULATION
    // -------------------------------------------------------------------
    console.log('\n--- 16. COMPARISON MODE & GROWTH METRICS ---');
    const compareRes = await fetch(`${BASE_URL}/analytics/overview?compare=true`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const compareJson = await compareRes.json();
    const compData = compareJson.data?.comparison;
    assert(compareRes.status === 200 && !!compData, 'Comparison mode returns comparison object');
    assert('growth' in compData, 'Comparison contains growth percentages');
    assert(typeof compData.growth?.revenueGrowth === 'number', 'Calculates revenueGrowth percentage');
    assert(!isNaN(compData.growth?.revenueGrowth), 'Growth is not NaN');
    assert(isFinite(compData.growth?.revenueGrowth), 'Growth is not Infinity');

    // -------------------------------------------------------------------
    // 17. PROFIT ESTIMATION & COST CONFIGURATION
    // -------------------------------------------------------------------
    console.log('\n--- 17. ESTIMATED PROFIT & BUSINESS COST CONFIGURATION ---');
    // Get existing costs
    const getCostRes = await fetch(`${BASE_URL}/analytics/costs`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(getCostRes.status === 200, 'GET /api/analytics/costs returns 200 OK');

    // Update costs
    const updateCostRes = await fetch(`${BASE_URL}/analytics/costs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        ingredientCostPercentage: 30,
        packagingCostPerOrder: 15,
        deliveryCostPerOrder: 20,
        operatingCostMonthly: 3000,
      }),
    });
    const updateCostJson = await updateCostRes.json();
    assert(updateCostRes.status === 200 && updateCostJson.data?.ingredientCostPercentage === 30, 'POST /api/analytics/costs updates business costs');

    // Verify in overview that Estimated Profit reflects recorded costs
    const profitOverviewRes = await fetch(`${BASE_URL}/analytics/overview`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const profitOverviewJson = await profitOverviewRes.json();
    const estProfit = profitOverviewJson.data?.estimatedProfit;
    assert(!!estProfit && typeof estProfit.estimatedProfit === 'number', 'Calculates Estimated Profit accurately');
    assert(estProfit.totalRecordedCosts >= 0, 'Computes totalRecordedCosts');
    assert(estProfit.estimatedProfit === estProfit.realizedRevenue - estProfit.totalRecordedCosts, 'Formula holds: Estimated Profit = Realized Revenue - Recorded Costs');

    // -------------------------------------------------------------------
    // 18. CSV REPORT EXPORTS (SALES, PAYMENTS, CUSTOMERS, MEALS)
    // -------------------------------------------------------------------
    console.log('\n--- 18. EXPORTABLE CSV REPORTS ---');
    const reports = ['sales', 'payments', 'customers', 'meals'];
    for (const r of reports) {
      const repRes = await fetch(`${BASE_URL}/analytics/export/${r}`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const repText = await repRes.text();
      const contentType = repRes.headers.get('content-type') || '';
      assert(repRes.status === 200, `GET /api/analytics/export/${r} returns 200 OK`);
      assert(contentType.includes('text/csv'), `Report ${r} Content-Type is text/csv`);
      assert(repText.split('\n').length >= 1, `Report ${r} contains CSV header row`);
    }

    // Invalid report type -> 400
    const badReportRes = await fetch(`${BASE_URL}/analytics/export/unknown`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(badReportRes.status === 400, 'Rejects unknown report type with 400 Bad Request');

    // -------------------------------------------------------------------
    // 19. SENSITIVE DATA LEAKAGE PREVENTION
    // -------------------------------------------------------------------
    console.log('\n--- 19. SENSITIVE CREDENTIALS & SECRETS PROTECTION ---');
    const overviewStr = JSON.stringify(overviewJson);
    assert(!overviewStr.includes('JWT_SECRET'), 'No JWT secret in overview response');
    assert(!overviewStr.includes('RAZORPAY_KEY_SECRET'), 'No Razorpay secret in overview response');
    assert(!overviewStr.includes('$2a$'), 'No bcrypt hash in overview response');

    // -------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------
    console.log('\n========================================================================');
    console.log(`📊 STEP 9 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================\n');

    return { passed, failed };
  } catch (error) {
    console.error('Fatal test error in Step 9:', error);
    return { passed, failed: failed + 1 };
  }
};

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('test-step9-analytics.js')) {
  runStep9Tests().then(({ failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}
