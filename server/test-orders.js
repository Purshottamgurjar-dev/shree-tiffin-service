/**
 * test-orders.js
 * Comprehensive automated test suite for Step 6: Real Order Creation & Order Management System
 * Shree Tiffin Service — "Ghar Jaisa Khana, Har Din."
 */

const API_BASE = process.env.TEST_URL || 'http://localhost:5000/api';

const runTests = async () => {
  console.log('===============================================================');
  console.log('🚀 RUNNING STEP 6 AUTOMATED TEST SUITE: ORDER MANAGEMENT SYSTEM');
  console.log('===============================================================');

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
    // 1. Unauthenticated checks
    console.log('\n--- 1. UNAUTHENTICATED REQUEST REJECTIONS ---');
    const unauthOrders = await fetch(`${API_BASE}/orders/my`);
    assert(unauthOrders.status === 401, 'Unauthenticated GET /api/orders/my returns 401');

    const unauthCreate = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressId: '123' }),
    });
    assert(unauthCreate.status === 401, 'Unauthenticated POST /api/orders returns 401');

    // 2. Register Customer A and Customer B
    console.log('\n--- 2. SETUP TEST CUSTOMERS & OWNER ---');
    const timestamp = Date.now();
    const custARes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Order Test Customer A',
        email: `custA_${timestamp}@test.com`,
        phone: '9876543210',
        password: 'password123',
      }),
    });
    const custAData = await custARes.json();
    const tokenA = custAData.token;
    assert(custARes.status === 201 && !!tokenA, 'Registered Customer A successfully');

    const custBRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Order Test Customer B',
        email: `custB_${timestamp}@test.com`,
        phone: '9876543211',
        password: 'password123',
      }),
    });
    const custBData = await custBRes.json();
    const tokenB = custBData.token;
    assert(custBRes.status === 201 && !!tokenB, 'Registered Customer B successfully');

    // Login owner
    const ownerRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'owner@shreetiffin.com',
        password: 'Owner@12345',
      }),
    });
    const ownerData = await ownerRes.json();
    const ownerToken = ownerData.token;
    assert(ownerRes.status === 200 && ownerData.user.role === 'owner', 'Owner logged in successfully');

    // 3. Create addresses
    console.log('\n--- 3. SETUP ADDRESSES & CART ITEMS ---');
    const addrARes = await fetch(`${API_BASE}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        label: 'Home',
        fullName: 'Customer A',
        phone: '9876543210',
        addressLine1: 'Flat 101, Shanti Niketan',
        city: 'Indore',
        state: 'Madhya Pradesh',
        postalCode: '452001',
        latitude: 22.7196,
        longitude: 75.8577,
        deliveryInstructions: 'Ring doorbell twice',
      }),
    });
    const addrAData = await addrARes.json();
    const addressA = addrAData.data || addrAData.address;
    const addressIdA = addressA?._id;
    assert(addrARes.status === 201 && !!addressIdA, 'Created Address for Customer A');

    const addrBRes = await fetch(`${API_BASE}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        label: 'Office',
        fullName: 'Customer B',
        phone: '9876543211',
        addressLine1: 'Office 404, Tech Park',
        city: 'Indore',
        state: 'Madhya Pradesh',
        postalCode: '452010',
        latitude: 22.7533,
        longitude: 75.8937,
      }),
    });
    const addrBData = await addrBRes.json();
    const addressB = addrBData.data || addrBData.address;
    const addressIdB = addressB?._id;
    assert(addrBRes.status === 201 && !!addressIdB, 'Created Address for Customer B');

    // Fetch meals
    const mealsRes = await fetch(`${API_BASE}/meals`);
    const mealsData = await mealsRes.json();
    const meals = mealsData.data || mealsData.meals;
    assert(Array.isArray(meals) && meals.length >= 2, 'Meals exist in database for ordering');
    const meal1 = meals[0];
    const meal2 = meals[1];

    // 4. Test Order creation validations
    console.log('\n--- 4. ORDER CREATION VALIDATIONS ---');
    // a) Empty cart test
    const emptyCartOrderRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ addressId: addressIdA }),
    });
    const emptyCartData = await emptyCartOrderRes.json();
    assert(emptyCartOrderRes.status === 400 && emptyCartData.message.includes('empty'), 'Order rejected when cart is empty');

    // b) Add items to Customer A's cart
    await fetch(`${API_BASE}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ mealId: meal1._id, quantity: 2 }),
    });
    await fetch(`${API_BASE}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ mealId: meal2._id, quantity: 1 }),
    });

    // c) Missing addressId test
    const missingAddrRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({}),
    });
    assert(missingAddrRes.status === 400, 'Order rejected when addressId is missing');

    // d) Cross-tenant address test (Customer A trying to use Customer B's address)
    const crossAddrRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ addressId: addressIdB }),
    });
    assert(crossAddrRes.status === 403, 'Order rejected with 403 when customer tries to use another customer address');

    // 5. Successful Order Creation
    console.log('\n--- 5. SUCCESSFUL ORDER CREATION & IMMUTABLE SNAPSHOTS ---');
    const idempotencyKey = `idem_${timestamp}_123`;
    const orderCreateRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        addressId: addressIdA,
        deliveryInstructions: 'Please leave outside the door',
      }),
    });
    const orderCreateData = await orderCreateRes.json();
    assert(orderCreateRes.status === 201, 'Order created successfully (201 Created)');
    const orderA = orderCreateData.order;

    assert(/^STS-2026-\d{4}$/.test(orderA.orderNumber), `Order has sequential orderNumber: ${orderA.orderNumber}`);
    assert(orderA.orderStatus === 'Pending', 'Initial order status is Pending');
    assert(orderA.totalItems === 3, 'Total items count is 3 (2 + 1)');
    const expectedSubtotal = meal1.price * 2 + meal2.price * 1;
    assert(orderA.subtotal === expectedSubtotal && orderA.total === expectedSubtotal, `Price matches database meal calculation: ₹${expectedSubtotal}`);
    assert(orderA.customerSnapshot.name === 'Order Test Customer A', 'Customer snapshot preserved');
    assert(orderA.deliveryAddressSnapshot.addressLine1 === 'Flat 101, Shanti Niketan', 'Delivery address snapshot preserved');
    assert(
      orderA.items.length === 2 && orderA.items.some((i) => i.nameSnapshot === meal1.name),
      'Meal snapshots captured correctly in items array'
    );

    // Verify cart is cleared automatically
    const checkCartRes = await fetch(`${API_BASE}/cart`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const checkCartData = await checkCartRes.json();
    const cartData = checkCartData.data || checkCartData.cart;
    assert(cartData.items.length === 0 && cartData.subtotal === 0, 'Customer cart automatically cleared upon order creation');

    // 6. Idempotency Verification
    console.log('\n--- 6. IDEMPOTENCY PROTECTION ---');
    const replayOrderRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        addressId: addressIdA,
      }),
    });
    const replayOrderData = await replayOrderRes.json();
    assert(replayOrderRes.status === 200, 'Replay with same Idempotency-Key returns 200 OK');
    assert(replayOrderData.order._id === orderA._id, 'Replay returns identical existing order without duplication');

    // 7. Customer Order Listing and Detail API
    console.log('\n--- 7. CUSTOMER ORDER LIST & DETAILS ---');
    const myOrdersRes = await fetch(`${API_BASE}/orders/my`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const myOrdersData = await myOrdersRes.json();
    assert(myOrdersRes.status === 200 && myOrdersData.orders.length >= 1, 'Customer A can view their orders');

    const myOrderRes = await fetch(`${API_BASE}/orders/my/${orderA._id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const myOrderData = await myOrderRes.json();
    assert(myOrderRes.status === 200 && myOrderData.order._id === orderA._id, 'Customer A can view single order details');

    // Cross-customer view protection
    const crossViewRes = await fetch(`${API_BASE}/orders/my/${orderA._id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(crossViewRes.status === 403, 'Customer B cannot view Customer A order (403 Forbidden)');

    // 8. Customer Order Cancellation
    console.log('\n--- 8. CUSTOMER CANCELLATION RULES ---');
    // Create a second order for cancellation test
    await fetch(`${API_BASE}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ mealId: meal1._id, quantity: 1 }),
    });
    const order2Res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ addressId: addressIdA }),
    });
    const order2Data = await order2Res.json();
    const orderToCancelId = order2Data.order._id;

    // Customer B cannot cancel Customer A's order
    const crossCancelRes = await fetch(`${API_BASE}/orders/my/${orderToCancelId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ reason: 'Malicious cancellation' }),
    });
    assert(crossCancelRes.status === 403, 'Customer B cannot cancel Customer A order (403 Forbidden)');

    // Customer A cancels their own pending order
    const cancelRes = await fetch(`${API_BASE}/orders/my/${orderToCancelId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ reason: 'Ordered by mistake' }),
    });
    const cancelData = await cancelRes.json();
    assert(cancelRes.status === 200 && cancelData.order.orderStatus === 'Cancelled', 'Customer A cancelled pending order successfully');
    assert(cancelData.order.cancellationReason === 'Ordered by mistake', 'Cancellation reason saved');

    // Trying to cancel an already cancelled order
    const reCancelRes = await fetch(`${API_BASE}/orders/my/${orderToCancelId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ reason: 'Cancel again' }),
    });
    assert(reCancelRes.status === 400, 'Cannot cancel already cancelled order');

    // 9. Owner Orders Management
    console.log('\n--- 9. OWNER ORDER MANAGEMENT & STATS ---');
    // Customer cannot access owner order routes
    const custAccessOwnerRes = await fetch(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(custAccessOwnerRes.status === 403, 'Customer cannot access GET /api/orders (403 Forbidden)');

    // Owner accesses all orders
    const ownerOrdersRes = await fetch(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const ownerOrdersData = await ownerOrdersRes.json();
    assert(ownerOrdersRes.status === 200, 'Owner can access GET /api/orders');
    assert(Array.isArray(ownerOrdersData.orders) && ownerOrdersData.orders.length >= 2, 'Owner sees all orders across system');
    assert(ownerOrdersData.stats && typeof ownerOrdersData.stats.total === 'number', 'Owner receives KPI stats breakdown');
    assert(typeof ownerOrdersData.stats.pending === 'number' && typeof ownerOrdersData.stats.cancelled === 'number', 'KPI stats has status counts');

    // Search and filter test
    const searchRes = await fetch(`${API_BASE}/orders?search=${encodeURIComponent(orderA.orderNumber)}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const searchData = await searchRes.json();
    assert(searchData.orders.some((o) => o.orderNumber === orderA.orderNumber), `Owner search works for orderNumber: ${orderA.orderNumber}`);

    const statusFilterRes = await fetch(`${API_BASE}/orders?status=Pending`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const statusFilterData = await statusFilterRes.json();
    assert(statusFilterData.orders.every((o) => o.orderStatus === 'Pending'), 'Owner filter by ?status=Pending works');

    // 10. Strict Status Workflow Transitions
    console.log('\n--- 10. STRICT STATUS WORKFLOW TRANSITIONS ---');
    // orderA is 'Pending'
    // Invalid jump: Pending -> Delivered should fail
    const invalidJumpRes = await fetch(`${API_BASE}/orders/${orderA._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'Delivered' }),
    });
    assert(invalidJumpRes.status === 400, 'Invalid transition Pending -> Delivered rejected (400)');

    // Valid step 1: Pending -> Confirmed
    const confirmRes = await fetch(`${API_BASE}/orders/${orderA._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'Confirmed', note: 'Kitchen accepted order' }),
    });
    const confirmData = await confirmRes.json();
    assert(confirmRes.status === 200 && confirmData.order.orderStatus === 'Confirmed', 'Transition Pending -> Confirmed succeeded');

    // Customer can no longer cancel Confirmed order
    const custCancelConfirmedRes = await fetch(`${API_BASE}/orders/my/${orderA._id}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ reason: 'Too late' }),
    });
    assert(custCancelConfirmedRes.status === 400, 'Customer cannot cancel order once Confirmed');

    // Valid step 2: Confirmed -> Preparing
    const prepRes = await fetch(`${API_BASE}/orders/${orderA._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'Preparing', note: 'Food is on the stove' }),
    });
    const prepData = await prepRes.json();
    assert(prepRes.status === 200 && prepData.order.orderStatus === 'Preparing', 'Transition Confirmed -> Preparing succeeded');

    // Valid step 3: Preparing -> Out for Delivery
    const outRes = await fetch(`${API_BASE}/orders/${orderA._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'Out for Delivery', note: 'Rider dispatched' }),
    });
    const outData = await outRes.json();
    assert(outRes.status === 200 && outData.order.orderStatus === 'Out for Delivery', 'Transition Preparing -> Out for Delivery succeeded');

    // Valid step 4: Out for Delivery -> Delivered
    const delivRes = await fetch(`${API_BASE}/orders/${orderA._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'Delivered', note: 'Handed to customer' }),
    });
    const delivData = await delivRes.json();
    assert(delivRes.status === 200 && delivData.order.orderStatus === 'Delivered', 'Transition Out for Delivery -> Delivered succeeded');

    // Status history check
    assert(delivData.order.statusHistory.length >= 5, 'Audit trail statusHistory recorded every step with timestamp and note');

    // Delivered order cannot transition anywhere else
    const afterDelivRes = await fetch(`${API_BASE}/orders/${orderA._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'Pending' }),
    });
    assert(afterDelivRes.status === 400, 'Cannot transition from Delivered to Pending');

    // Owner cancellation test on active order
    // Let's create a 3rd order
    await fetch(`${API_BASE}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ mealId: meal1._id, quantity: 1 }),
    });
    const order3Res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ addressId: addressIdA }),
    });
    const order3Data = await order3Res.json();
    const order3Id = order3Data.order._id;

    // Owner cancels order 3
    const ownerCancelRes = await fetch(`${API_BASE}/orders/${order3Id}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ reason: 'Kitchen out of fresh ingredients' }),
    });
    const ownerCancelData = await ownerCancelRes.json();
    assert(ownerCancelRes.status === 200 && ownerCancelData.order.orderStatus === 'Cancelled', 'Owner cancelled order successfully');
    assert(ownerCancelData.order.cancellationReason === 'Kitchen out of fresh ingredients', 'Owner cancellation reason saved');

    // Delivered order 1 cannot be cancelled by owner
    const cancelDeliveredRes = await fetch(`${API_BASE}/orders/${orderA._id}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ reason: 'Cannot cancel delivered' }),
    });
    assert(cancelDeliveredRes.status === 400, 'Owner cannot cancel already Delivered order');

    console.log('\n===============================================================');
    console.log(`STEP 6 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Unhandled test execution error:', error);
    process.exit(1);
  }
};

runTests();
