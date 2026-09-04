/**
 * test-payments.js
 * Comprehensive automated test suite for Step 7: Real Payment System (COD + Online + Server-Side Verification)
 * Shree Tiffin Service — "Ghar Jaisa Khana, Har Din."
 */

import crypto from 'node:crypto';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE = process.env.TEST_URL || 'http://localhost:5000/api';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'dev_test_secret_shree_tiffin_key_2026';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'dev_test_webhook_secret_shree_2026';

const runTests = async () => {
  console.log('====================================================================');
  console.log('🚀 RUNNING STEP 7 AUTOMATED TEST SUITE: REAL PAYMENT SYSTEM (COD + RAZORPAY)');
  console.log('====================================================================');

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
    // ----------------------------------------------------
    // 1. UNAUTHENTICATED ENDPOINT CHECKS
    // ----------------------------------------------------
    console.log('\n--- 1. UNAUTHENTICATED ENDPOINT CHECKS ---');
    const unauthCod = await fetch(`${API_BASE}/payments/cod`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: '123' }),
    });
    assert(unauthCod.status === 401, 'Unauthenticated POST /api/payments/cod returns 401 Unauthorized');

    const unauthCreate = await fetch(`${API_BASE}/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: '123' }),
    });
    assert(unauthCreate.status === 401, 'Unauthenticated POST /api/payments/create-order returns 401 Unauthorized');

    const unauthVerify = await fetch(`${API_BASE}/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: '123' }),
    });
    assert(unauthVerify.status === 401, 'Unauthenticated POST /api/payments/verify returns 401 Unauthorized');

    const unauthMyPayments = await fetch(`${API_BASE}/payments/my`);
    assert(unauthMyPayments.status === 401, 'Unauthenticated GET /api/payments/my returns 401 Unauthorized');

    const unauthAllPayments = await fetch(`${API_BASE}/payments`);
    assert(unauthAllPayments.status === 401, 'Unauthenticated GET /api/payments returns 401 Unauthorized');

    // ----------------------------------------------------
    // 2. SETUP CUSTOMER A, CUSTOMER B & OWNER
    // ----------------------------------------------------
    console.log('\n--- 2. SETUP CUSTOMERS & OWNER ---');
    const timestamp = Date.now();

    // Customer A
    const custARes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Payment Test Cust A',
        email: `pay_cust_a_${timestamp}@test.com`,
        phone: '9876543210',
        password: 'Password@123',
      }),
    });
    const custAData = await custARes.json();
    const tokenA = custAData.token;
    assert(custARes.status === 201 && !!tokenA, 'Registered Customer A successfully');

    // Customer B
    const custBRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Payment Test Cust B',
        email: `pay_cust_b_${timestamp}@test.com`,
        phone: '9876543211',
        password: 'Password@123',
      }),
    });
    const custBData = await custBRes.json();
    const tokenB = custBData.token;
    assert(custBRes.status === 201 && !!tokenB, 'Registered Customer B successfully');

    // Owner Login
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
    assert(ownerRes.status === 200 && ownerData.user?.role === 'owner', 'Owner logged in successfully');

    // ----------------------------------------------------
    // 3. CREATE ADDRESSES & REAL ORDERS FOR TESTING
    // ----------------------------------------------------
    console.log('\n--- 3. SETUP ADDRESS & TEST ORDERS ---');
    const addrRes = await fetch(`${API_BASE}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        label: 'Home',
        fullName: 'Payment Cust A',
        phone: '9876543210',
        addressLine1: '404 Golden Arcade',
        city: 'Indore',
        state: 'Madhya Pradesh',
        postalCode: '452001',
        latitude: 22.7196,
        longitude: 75.8577,
      }),
    });
    const addrData = await addrRes.json();
    const addressId = (addrData.data || addrData.address)?._id;
    assert(addrRes.status === 201 && !!addressId, 'Created Address for Customer A');

    // Fetch meals
    const mealsRes = await fetch(`${API_BASE}/meals`);
    const mealsData = await mealsRes.json();
    const meals = mealsData.data || mealsData.meals;
    const meal1 = meals[0];

    // Helper to create an order for Customer A
    const createTestOrder = async () => {
      // Add meal to cart
      await fetch(`${API_BASE}/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ mealId: meal1._id, quantity: 2 }),
      });

      // Place order
      const oRes = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ addressId }),
      });
      const oData = await oRes.json();
      return oData.order;
    };

    const orderCOD = await createTestOrder();
    assert(!!orderCOD?._id && orderCOD.total === meal1.price * 2, 'Created test Order 1 for COD');

    const orderOnline = await createTestOrder();
    assert(!!orderOnline?._id, 'Created test Order 2 for Online Payment');

    // ----------------------------------------------------
    // 4. CASH ON DELIVERY (COD) FLOW
    // ----------------------------------------------------
    console.log('\n--- 4. CASH ON DELIVERY (COD) FLOW ---');
    // Customer B cannot select COD for Customer A's order
    const crossCodRes = await fetch(`${API_BASE}/payments/cod`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ orderId: orderCOD._id }),
    });
    assert(crossCodRes.status === 403, 'Cross-customer COD selection rejected (403 Forbidden)');

    // Customer A selects COD
    const codRes = await fetch(`${API_BASE}/payments/cod`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ orderId: orderCOD._id }),
    });
    const codData = await codRes.json();
    assert(codRes.status === 200, 'Customer A selected COD successfully (200 OK)');
    assert(codData.payment?.method === 'COD', 'Payment method is COD');
    assert(codData.payment?.status === 'Pending', 'Payment status is strictly Pending (not falsely marked Paid)');
    assert(codData.order?.paymentMethod === 'COD' && codData.order?.paymentStatus === 'Pending', 'Order reflects COD method with Pending status');
    assert(codData.payment?.amount === orderCOD.total, 'Payment amount equals order total');
    assert(codData.payment?.amountInPaise === orderCOD.total * 100, 'Payment amountInPaise correctly converted');

    // Customer cannot mark COD as collected / paid
    const custCollectRes = await fetch(`${API_BASE}/payments/${codData.payment._id}/cod-collect`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(custCollectRes.status === 403, 'Customer cannot collect COD payment (403 Forbidden)');

    // Owner marks COD as collected
    const ownerCollectRes = await fetch(`${API_BASE}/payments/${codData.payment._id}/cod-collect`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const ownerCollectData = await ownerCollectRes.json();
    assert(ownerCollectRes.status === 200, 'Owner marked COD collected successfully (200 OK)');
    assert(ownerCollectData.payment?.status === 'Paid', 'Payment status updated to Paid');
    assert(!!ownerCollectData.payment?.codCollectedAt, 'codCollectedAt timestamp recorded');
    assert(ownerCollectData.order?.paymentStatus === 'Paid', 'Order paymentStatus updated to Paid');

    // Duplicate collection attempt on already Paid COD
    const reCollectRes = await fetch(`${API_BASE}/payments/${codData.payment._id}/cod-collect`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(reCollectRes.status === 400, 'Duplicate COD collection rejected (400 Bad Request)');

    // ----------------------------------------------------
    // 5. ONLINE PAYMENT ORDER CREATION
    // ----------------------------------------------------
    console.log('\n--- 5. ONLINE PAYMENT ORDER CREATION ---');
    // Customer B cannot create gateway order for Customer A's order
    const crossOnlineRes = await fetch(`${API_BASE}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ orderId: orderOnline._id }),
    });
    assert(crossOnlineRes.status === 403, 'Cross-customer gateway order creation rejected (403 Forbidden)');

    // Customer A creates online order
    const createOrderRes = await fetch(`${API_BASE}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ orderId: orderOnline._id }),
    });
    const createOrderData = await createOrderRes.json();
    assert(createOrderRes.status === 200, 'Gateway order created successfully (200 OK)');
    const pInfo = createOrderData.payment;
    assert(!!pInfo?.gatewayOrderId, `Generated gatewayOrderId: ${pInfo?.gatewayOrderId}`);
    const expectedPaise = orderOnline.total * 100;
    assert(pInfo?.amount === expectedPaise, `Amount in paise strictly converted: ${pInfo?.amount} (₹${orderOnline.total})`);
    assert(pInfo?.currency === 'INR', 'Currency is INR');
    assert(!!pInfo?.keyId, 'Client receives public keyId');
    assert(!createOrderData.keySecret && !createOrderData.secret, 'Secret key is NEVER leaked in response');

    // ----------------------------------------------------
    // 6. CRYPTOGRAPHIC SIGNATURE VERIFICATION
    // ----------------------------------------------------
    console.log('\n--- 6. CRYPTOGRAPHIC SIGNATURE VERIFICATION ---');
    const gatewayOrderId = pInfo.gatewayOrderId;
    const gatewayPaymentId = `pay_test_${timestamp}_abc`;

    // 6a. Invalid signature test
    const invalidSigRes = await fetch(`${API_BASE}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        orderId: orderOnline._id,
        razorpay_order_id: gatewayOrderId,
        razorpay_payment_id: gatewayPaymentId,
        razorpay_signature: 'forged_fake_signature_hex_123',
      }),
    });
    assert(invalidSigRes.status === 400, 'Forged cryptographic signature rejected (400 Bad Request)');

    // 6b. Tampered gatewayOrderId test
    const validSignature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(`${gatewayOrderId}|${gatewayPaymentId}`)
      .digest('hex');

    const tamperedOrderRes = await fetch(`${API_BASE}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        orderId: orderOnline._id,
        razorpay_order_id: 'order_wrong_fake_id',
        razorpay_payment_id: gatewayPaymentId,
        razorpay_signature: validSignature,
      }),
    });
    assert(tamperedOrderRes.status === 404 || tamperedOrderRes.status === 400, 'Tampered gatewayOrderId rejected');

    // 6c. Valid HMAC signature verification
    const verifyRes = await fetch(`${API_BASE}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        orderId: orderOnline._id,
        razorpay_order_id: gatewayOrderId,
        razorpay_payment_id: gatewayPaymentId,
        razorpay_signature: validSignature,
      }),
    });
    const verifyData = await verifyRes.json();
    assert(verifyRes.status === 200, 'Valid HMAC signature verified successfully (200 OK)');
    assert(verifyData.payment?.status === 'Paid', 'Payment status transitioned to Paid');
    assert(!!verifyData.payment?.verifiedAt, 'verifiedAt timestamp recorded');
    assert(verifyData.order?.paymentStatus === 'Paid', 'Order paymentStatus transitioned to Paid');
    assert(verifyData.order?.paymentMethod === 'ONLINE', 'Order paymentMethod is ONLINE');

    // 6d. Replay protection / Idempotency
    const replayVerifyRes = await fetch(`${API_BASE}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        orderId: orderOnline._id,
        razorpay_order_id: gatewayOrderId,
        razorpay_payment_id: gatewayPaymentId,
        razorpay_signature: validSignature,
      }),
    });
    const replayData = await replayVerifyRes.json();
    assert(replayVerifyRes.status === 200, 'Replay payment verification is idempotent (200 OK)');
    assert(replayData.payment?.status === 'Paid', 'Returns existing verified Paid payment without duplicates');

    // ----------------------------------------------------
    // 7. PAYMENT FAILURE RECORDING & RETRY FLOW
    // ----------------------------------------------------
    console.log('\n--- 7. PAYMENT FAILURE & RETRY FLOW ---');
    const orderRetry = await createTestOrder();

    // Create online order
    const retryGatewayRes = await fetch(`${API_BASE}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ orderId: orderRetry._id }),
    });
    const retryGatewayData = await retryGatewayRes.json();
    const retryGOrderId = retryGatewayData.payment.gatewayOrderId;

    // Record failure (e.g. user cancelled payment popup or card declined)
    const failRes = await fetch(`${API_BASE}/payments/failure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        orderId: orderRetry._id,
        gatewayOrderId: retryGOrderId,
        reason: 'Payment cancelled by user in checkout popup',
      }),
    });
    assert(failRes.status === 200, 'Payment failure recorded (200 OK)');

    // Order remains payable (paymentStatus !== 'Paid')
    const checkRetryOrder = await fetch(`${API_BASE}/orders/my/${orderRetry._id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const checkRetryOrderData = await checkRetryOrder.json();
    assert(checkRetryOrderData.order?.paymentStatus === 'Pending', 'Order remains in Pending payment state for retry');

    // Customer can switch to COD after failure
    const switchCodRes = await fetch(`${API_BASE}/payments/cod`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ orderId: orderRetry._id }),
    });
    const switchCodData = await switchCodRes.json();
    assert(switchCodRes.status === 200 && switchCodData.payment?.method === 'COD', 'Customer successfully retried by switching to COD');

    // ----------------------------------------------------
    // 8. RAZORPAY WEBHOOK SUPPORT
    // ----------------------------------------------------
    console.log('\n--- 8. RAZORPAY WEBHOOK INTEGRATION ---');
    const orderWebhook = await createTestOrder();

    // Create online order
    const whGatewayRes = await fetch(`${API_BASE}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ orderId: orderWebhook._id }),
    });
    const whGatewayData = await whGatewayRes.json();
    const whGOrderId = whGatewayData.payment.gatewayOrderId;

    const webhookBody = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_wh_${Date.now()}`,
            order_id: whGOrderId,
            amount: orderWebhook.total * 100,
            currency: 'INR',
            status: 'captured',
          },
        },
      },
    });

    // 8a. Invalid webhook signature rejected
    const badWhRes = await fetch(`${API_BASE}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'bad_fake_webhook_signature',
      },
      body: webhookBody,
    });
    assert(badWhRes.status === 400, 'Invalid webhook signature rejected (400 Bad Request)');

    // 8b. Valid webhook signature accepted
    const validWhSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(webhookBody)
      .digest('hex');

    const goodWhRes = await fetch(`${API_BASE}/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': validWhSignature,
      },
      body: webhookBody,
    });
    assert(goodWhRes.status === 200, 'Valid webhook signature processed successfully (200 OK)');

    // Verify order was marked Paid via webhook
    const checkWhOrder = await fetch(`${API_BASE}/orders/my/${orderWebhook._id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const checkWhOrderData = await checkWhOrder.json();
    assert(checkWhOrderData.order?.paymentStatus === 'Paid', 'Order paymentStatus marked Paid via webhook');

    // ----------------------------------------------------
    // 9. OWNER PAYMENT MANAGEMENT & KPI STATS
    // ----------------------------------------------------
    console.log('\n--- 9. OWNER PAYMENT DASHBOARD & KPI STATS ---');
    // Customer cannot access owner payment dashboard
    const custAccessAllRes = await fetch(`${API_BASE}/payments`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(custAccessAllRes.status === 403, 'Customer denied access to owner payments portal (403 Forbidden)');

    // Owner accesses all payments
    const ownerPaymentsRes = await fetch(`${API_BASE}/payments`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const ownerPaymentsData = await ownerPaymentsRes.json();
    assert(ownerPaymentsRes.status === 200, 'Owner accessed GET /api/payments successfully (200 OK)');
    assert(Array.isArray(ownerPaymentsData.payments) && ownerPaymentsData.payments.length >= 3, 'Owner receives list of all payments');
    assert(ownerPaymentsData.stats && typeof ownerPaymentsData.stats.totalRevenue === 'number', 'Owner receives total revenue KPI stat');
    assert(typeof ownerPaymentsData.stats.onlineRevenue === 'number', 'KPI stats has onlineRevenue');
    assert(typeof ownerPaymentsData.stats.codCollectedRevenue === 'number', 'KPI stats has codCollectedRevenue');

    // Filter by method
    const codFilterRes = await fetch(`${API_BASE}/payments?method=COD`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const codFilterData = await codFilterRes.json();
    assert(codFilterData.payments.every((p) => p.method === 'COD'), 'Owner filter by method=COD works');

    // Filter by status
    const paidFilterRes = await fetch(`${API_BASE}/payments?status=Paid`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const paidFilterData = await paidFilterRes.json();
    assert(paidFilterData.payments.every((p) => p.status === 'Paid'), 'Owner filter by status=Paid works');

    console.log('\n====================================================================');
    console.log(`STEP 7 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Unhandled test suite error:', error);
    process.exit(1);
  }
};

runTests();
