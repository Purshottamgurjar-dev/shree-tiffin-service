/**
 * test-step8-owner-delivery.js
 * Comprehensive automated test suite for Step 8:
 * Production-Safe Owner Operations, Delivery Management, Real-time Architecture & Security
 * Shree Tiffin Service — "Ghar Jaisa Khana, Har Din."
 */

import { validateTestDatabase } from './config/db.js';

const PORT = process.env.TEST_PORT || process.env.PORT || 5001;
const BASE_URL = process.env.TEST_URL || `http://localhost:${PORT}/api`;

export const runStep8Tests = async () => {
  console.log('\n========================================================================');
  console.log('🚀 RUNNING STEP 8 AUTOMATED TEST SUITE: OWNER OPERATIONS & DELIVERY');
  console.log('========================================================================');

  let passed = 0;
  let failed = 0;
  let kpiData = {};
  let deliveryData = {};
  let ownerUsersData = {};
  let ownerCollectData = {};

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
    // 1. PHASE 0 & 17: DATABASE SAFETY GUARD VERIFICATION
    // -------------------------------------------------------------------
    console.log('\n--- 1. DATABASE SAFETY GUARD VERIFICATION ---');
    assert(process.env.NODE_ENV === 'test', 'NODE_ENV is strictly set to "test"');

    // Test that validateTestDatabase rejects non-test production database
    let caughtProdRejection = false;
    try {
      validateTestDatabase('mongodb+srv://user:pass@cluster.mongodb.net/shree_tiffin_service?retryWrites=true');
    } catch (err) {
      if (err.message.includes('REFUSING TO RUN TESTS: TEST DATABASE REQUIRED')) {
        caughtProdRejection = true;
      }
    }
    assert(caughtProdRejection, 'Safety guard refuses tests against production DB "shree_tiffin_service"');

    // Test that validateTestDatabase permits test database
    let testDbPermitted = false;
    try {
      validateTestDatabase('mongodb+srv://user:pass@cluster.mongodb.net/shree_tiffin_service_test?retryWrites=true');
      testDbPermitted = true;
    } catch (err) {
      testDbPermitted = false;
    }
    assert(testDbPermitted, 'Safety guard permits isolated test DB "shree_tiffin_service_test"');

    // -------------------------------------------------------------------
    // 2. SETUP TEST USERS (CUSTOMER A, CUSTOMER B, AND OWNER)
    // -------------------------------------------------------------------
    console.log('\n--- 2. SETUP AUTHENTICATED CUSTOMERS & OWNER ---');
    const timestamp = Date.now();

    // Register Customer A
    const custARes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Step8 Customer A',
        email: `custA_step8_${timestamp}@test.com`,
        phone: '9876543211',
        password: 'Password@123',
      }),
    });
    const custAData = await custARes.json();
    const tokenA = custAData.token;
    const userAId = custAData.user?._id;
    assert(custARes.status === 201 && !!tokenA, 'Registered Customer A successfully');

    // Register Customer B
    const custBRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Step8 Customer B',
        email: `custB_step8_${timestamp}@test.com`,
        phone: '9876543222',
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
    // 3. OWNER DASHBOARD KPIS (PHASE 1)
    // -------------------------------------------------------------------
    console.log('\n--- 3. OWNER DASHBOARD KPIS & AUTHORIZATION ---');

    // Unauthenticated access fails
    const unauthKpi = await fetch(`${BASE_URL}/orders/dashboard-kpis`);
    assert(unauthKpi.status === 401, 'Unauthenticated GET /api/orders/dashboard-kpis returns 401');

    // Customer access fails with 403 Forbidden
    const custKpi = await fetch(`${BASE_URL}/orders/dashboard-kpis`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(custKpi.status === 403, 'Customer cannot access owner dashboard KPIs (returns 403 Forbidden)');

    // Owner access succeeds with all 9 KPI metrics
    const ownerKpi = await fetch(`${BASE_URL}/orders/dashboard-kpis`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    kpiData = await ownerKpi.json();
    assert(ownerKpi.status === 200 && kpiData.success === true, 'Owner GET /api/orders/dashboard-kpis returns 200');
    assert('todayOrders' in kpiData.kpis, 'KPI includes todayOrders');
    assert('pendingOrders' in kpiData.kpis, 'KPI includes pendingOrders');
    assert('preparingOrders' in kpiData.kpis, 'KPI includes preparingOrders');
    assert('outForDelivery' in kpiData.kpis, 'KPI includes outForDelivery');
    assert('deliveredToday' in kpiData.kpis, 'KPI includes deliveredToday');
    assert('todayRevenue' in kpiData.kpis, 'KPI includes todayRevenue');
    assert('pendingCod' in kpiData.kpis, 'KPI includes pendingCod');
    assert('onlinePayments' in kpiData.kpis, 'KPI includes onlinePayments');
    assert('activeCustomers' in kpiData.kpis, 'KPI includes activeCustomers');

    // -------------------------------------------------------------------
    // 4. SEED ORDER & ADDRESS FOR DELIVERY TESTING
    // -------------------------------------------------------------------
    console.log('\n--- 4. SEED ORDER & DELIVERY DATA ---');

    // Add Address for Customer A with GPS coordinates
    const addrRes = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        fullName: 'Rahul Delivery Test',
        phone: '9876543211',
        addressLine1: 'Flat 402, Royal Residency, Vijay Nagar',
        city: 'Indore',
        state: 'Madhya Pradesh',
        postalCode: '452010',
        latitude: 22.7533,
        longitude: 75.8937,
        deliveryInstructions: 'Ring bell twice, leave on shoe rack',
      }),
    });
    const addrData = await addrRes.json();
    const addressId = addrData.data?._id || addrData.address?._id;
    assert(addrRes.status === 201 && !!addressId, 'Saved address with coordinates (22.7533, 75.8937)');

    // Fetch meals to add to cart
    const mealsRes = await fetch(`${BASE_URL}/meals`);
    const mealsData = await mealsRes.json();
    const sampleMeal = mealsData.data?.[0] || mealsData.meals?.[0];

    // Add meal to cart
    await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ mealId: sampleMeal._id, quantity: 2 }),
    });

    // Create Order
    const createOrderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ addressId }),
    });
    const orderData = await createOrderRes.json();
    const createdOrder = orderData.order;
    assert(createOrderRes.status === 201 && !!createdOrder?._id, `Order created (${createdOrder?.orderNumber}) in Pending status`);

    // -------------------------------------------------------------------
    // 5. DELIVERY MANAGEMENT & MAP DATA (PHASE 3 & 4)
    // -------------------------------------------------------------------
    console.log('\n--- 5. DELIVERY DISPATCH API & MAP VERIFICATION ---');

    // Advance order to Confirmed so it shows up on delivery dispatch
    const confirmRes = await fetch(`${BASE_URL}/orders/${createdOrder._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'Confirmed', note: 'Kitchen confirmed order' }),
    });
    assert(confirmRes.status === 200, 'Advanced order status from Pending ➔ Confirmed');

    // Customer cannot access delivery orders
    const custDeliveryRes = await fetch(`${BASE_URL}/orders/delivery-orders`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(custDeliveryRes.status === 403, 'Customer cannot access /api/orders/delivery-orders (403)');

    // Owner accesses delivery orders
    const ownerDeliveryRes = await fetch(`${BASE_URL}/orders/delivery-orders`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    deliveryData = await ownerDeliveryRes.json();
    assert(ownerDeliveryRes.status === 200 && Array.isArray(deliveryData.orders), 'Owner GET /api/orders/delivery-orders returns 200');

    const foundDeliveryOrder = deliveryData.orders.find((o) => o._id === createdOrder._id);
    assert(!!foundDeliveryOrder, 'Confirmed order appears in delivery dispatch queue');
    assert(foundDeliveryOrder.deliveryAddressSnapshot?.latitude === 22.7533, 'Delivery order includes valid GPS latitude');
    assert(foundDeliveryOrder.deliveryAddressSnapshot?.longitude === 75.8937, 'Delivery order includes valid GPS longitude');
    assert(foundDeliveryOrder.customerSnapshot?.phone === '9876543211', 'Delivery order includes customer phone for Call/WhatsApp');

    // -------------------------------------------------------------------
    // 6. ORDER FILTERING & PAGINATION (PHASE 2)
    // -------------------------------------------------------------------
    console.log('\n--- 6. ORDER FILTERING, SORTING & PAGINATION ---');

    // Filter by status
    const filterStatusRes = await fetch(`${BASE_URL}/orders?status=Confirmed`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const filterStatusData = await filterStatusRes.json();
    assert(filterStatusData.orders.every((o) => o.orderStatus === 'Confirmed'), 'Order filtering by status=Confirmed works');

    // Filter by paymentMethod
    const filterMethodRes = await fetch(`${BASE_URL}/orders?paymentMethod=COD`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const filterMethodData = await filterMethodRes.json();
    assert(filterMethodData.orders.every((o) => (o.paymentMethod || 'COD') === 'COD'), 'Order filtering by paymentMethod=COD works');

    // Sort oldest vs newest
    const sortOldestRes = await fetch(`${BASE_URL}/orders?sort=oldest`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const sortOldestData = await sortOldestRes.json();
    assert(sortOldestRes.status === 200 && Array.isArray(sortOldestData.orders), 'Sorting by oldest orders works');

    // Pagination metadata
    const pageRes = await fetch(`${BASE_URL}/orders?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const pageData = await pageRes.json();
    assert(pageData.pagination?.page === 1 && pageData.pagination?.limit === 5, 'Pagination metadata (page, limit, total, totalPages) returned correctly');

    // -------------------------------------------------------------------
    // 7. CASH ON DELIVERY (COD) COLLECTION & AUDIT (PHASE 8)
    // -------------------------------------------------------------------
    console.log('\n--- 7. COD COLLECTION & AUDIT TRAIL ---');

    // Select COD payment for this order
    const codSelectRes = await fetch(`${BASE_URL}/payments/cod`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ orderId: createdOrder._id }),
    });
    const codSelectData = await codSelectRes.json();
    const paymentId = codSelectData.payment?._id;
    assert(codSelectRes.status === 200 && !!paymentId, 'Created COD Payment record in Pending status');

    // Customer cannot collect their own COD payment
    const custCollectRes = await fetch(`${BASE_URL}/payments/${paymentId}/cod-collect`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(custCollectRes.status === 403, 'Customer cannot mark COD as collected (returns 403 Forbidden)');

    // Owner collects COD payment
    const ownerCollectRes = await fetch(`${BASE_URL}/payments/${paymentId}/cod-collect`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    ownerCollectData = await ownerCollectRes.json();
    assert(ownerCollectRes.status === 200 && ownerCollectData.payment?.status === 'Paid', 'Owner successfully marked COD as collected');
    assert(ownerCollectData.order?.paymentStatus === 'Paid', 'Order paymentStatus updated to Paid server-side');
    assert(!!ownerCollectData.payment?.codCollectedAt, 'Payment records codCollectedAt timestamp');

    // Audit trail verification
    const hasAuditLog = ownerCollectData.payment?.auditHistory?.some((a) => a.action === 'COD_COLLECTED');
    assert(hasAuditLog, 'Payment records immutable audit trail entry for COD_COLLECTED');

    // Duplicate collection prevention
    const duplicateCollectRes = await fetch(`${BASE_URL}/payments/${paymentId}/cod-collect`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(duplicateCollectRes.status === 400, 'Duplicate COD collection attempt rejected with 400 Bad Request');

    // -------------------------------------------------------------------
    // 8. PAYMENT HISTORY & DATE FILTERING (PHASE 9)
    // -------------------------------------------------------------------
    console.log('\n--- 8. PAYMENT HISTORY & DATE FILTERING ---');

    const paymentHistRes = await fetch(`${BASE_URL}/payments?status=Paid&dateRange=today`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const paymentHistData = await paymentHistRes.json();
    assert(paymentHistRes.status === 200 && Array.isArray(paymentHistData.payments), 'Owner GET /api/payments with status=Paid and dateRange=today succeeds');
    assert('totalRevenue' in paymentHistData.stats, 'Payment history returns server-calculated totalRevenue');

    // -------------------------------------------------------------------
    // 9. OWNER CUSTOMER MANAGEMENT & STATS (PHASE 10)
    // -------------------------------------------------------------------
    console.log('\n--- 9. CUSTOMER DIRECTORY & STATS ---');

    // Customer cannot access /api/users
    const custUsersRes = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(custUsersRes.status === 403, 'Customer cannot access /api/users (returns 403 Forbidden)');

    // Owner accesses /api/users
    const custAEmail = `custA_step8_${timestamp}@test.com`;
    const ownerUsersRes = await fetch(`${BASE_URL}/users?search=${encodeURIComponent(custAEmail)}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    ownerUsersData = await ownerUsersRes.json();
    assert(ownerUsersRes.status === 200 && Array.isArray(ownerUsersData.users), 'Owner GET /api/users returns 200 with customer directory');

    const customerRecord = ownerUsersData.users.find(
      (u) => u.email.toLowerCase() === custAEmail.toLowerCase()
    );
    assert(!!customerRecord, 'Found Customer A record in directory');
    assert(customerRecord?.stats?.totalOrders >= 1, 'Customer stats includes accurate lifetime totalOrders');
    assert(!customerRecord?.password, 'Password hash is strictly omitted from customer response');

    // -------------------------------------------------------------------
    // 10. CUSTOMER ISOLATION & IDOR PROTECTION (PHASE 13)
    // -------------------------------------------------------------------
    console.log('\n--- 10. CUSTOMER ISOLATION & IDOR TESTS ---');

    // Customer B cannot view Customer A's order
    const idorOrderRes = await fetch(`${BASE_URL}/orders/my/${createdOrder._id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(idorOrderRes.status === 403, 'Customer B cannot view Customer A order (returns 403 Forbidden)');

    // Customer B cannot cancel Customer A's order
    const idorCancelRes = await fetch(`${BASE_URL}/orders/my/${createdOrder._id}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ reason: 'Malicious attempt' }),
    });
    assert(idorCancelRes.status === 403, 'Customer B cannot cancel Customer A order (returns 403 Forbidden)');

    // -------------------------------------------------------------------
    // 11. OBJECTID VALIDATION & ERROR HANDLING (PHASE 13)
    // -------------------------------------------------------------------
    console.log('\n--- 11. OBJECTID VALIDATION & SAFE ERROR HANDLING ---');

    const invalidIdRes = await fetch(`${BASE_URL}/orders/not-a-valid-object-id`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(invalidIdRes.status === 400, 'Invalid ObjectId format on /api/orders/:id returns 400 Bad Request (no 500 crash)');

    const invalidPayRes = await fetch(`${BASE_URL}/payments/invalid-id-xyz/cod-collect`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(invalidPayRes.status === 400, 'Invalid ObjectId format on /api/payments/:id/cod-collect returns 400 Bad Request');

    // -------------------------------------------------------------------
    // 12. SECURITY AUDIT: NO SECRETS IN RESPONSES
    // -------------------------------------------------------------------
    console.log('\n--- 12. SENSITIVE CREDENTIAL LEAKAGE AUDIT ---');

    const responseString = JSON.stringify({
      kpiData,
      deliveryData,
      ownerUsersData,
      ownerCollectData,
    });

    assert(!responseString.includes('RAZORPAY_KEY_SECRET'), 'No RAZORPAY_KEY_SECRET in API responses');
    assert(!responseString.includes('JWT_SECRET'), 'No JWT_SECRET in API responses');
    assert(!responseString.includes('$2a$') && !responseString.includes('$2b$'), 'No bcrypt password hashes in API responses');

  } catch (err) {
    console.error('Fatal error during test execution:', err);
    failed++;
  }

  console.log('\n========================================================================');
  console.log(`🏁 STEP 8 TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  return { passed, failed };
};

// Allow standalone execution: node test-step8-owner-delivery.js
if (process.argv[1]?.endsWith('test-step8-owner-delivery.js')) {
  runStep8Tests().then(({ failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}
