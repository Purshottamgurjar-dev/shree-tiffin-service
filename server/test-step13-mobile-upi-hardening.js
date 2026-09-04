/**
 * test-step13-mobile-upi-hardening.js
 * Automated Test Suite for Step 13: Production Payment UX + Mobile Responsiveness Hardening
 * Project: Shree Tiffin Service ("Ghar Jaisa Khana, Har Din.")
 * 
 * Strict Database Guard: Targets `shree_tiffin_service_test` on dedicated port 5001
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { validateTestDatabase } from './config/db.js';
import {
  createGatewayOrder,
  verifyPaymentSignature,
  generateTestSignature,
  verifyWebhookSignature,
  getPublicPaymentConfig,
} from './services/paymentService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// 1. Enforce test environment and load .env.test
process.env.NODE_ENV = 'test';
dotenv.config({ path: path.join(__dirname, '.env.test') });

const PORT = process.env.TEST_PORT || process.env.PORT || 5001;
const BASE_URL = `http://localhost:${PORT}/api`;

export const runStep13Tests = async () => {
  console.log('\n========================================================================');
  console.log('🚀 RUNNING STEP 13 AUTOMATED TEST SUITE: MOBILE UPI PAYMENT UX & RESPONSIVENESS');
  console.log('   "Ghar Jaisa Khana, Har Din."');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, description) => {
    if (condition) {
      console.log(`  ✅ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
      failed++;
    }
  };

  try {
    // ------------------------------------------------------------------------
    // SECTION 1: DATABASE SAFETY GUARD & ENVIRONMENT VERIFICATION
    // ------------------------------------------------------------------------
    console.log('--- 1. DATABASE SAFETY & ENVIRONMENT VERIFICATION ---');
    assert(process.env.NODE_ENV === 'test', 'NODE_ENV is strictly set to "test"');

    try {
      validateTestDatabase('mongodb://localhost:27017/shree_tiffin_service');
      assert(false, 'Safety guard should block production DB');
    } catch {
      assert(true, 'Safety guard refuses connection to production database');
    }

    const publicConfig = getPublicPaymentConfig();
    assert(publicConfig.currency === 'INR', 'Payment gateway currency is strictly INR');
    assert(typeof publicConfig.keyId === 'string', 'Public keyId is string');
    assert(!publicConfig.keyId.includes('secret'), 'Public keyId never exposes secret');

    // ------------------------------------------------------------------------
    // SECTION 2: AUTHENTICATION & SETUP TEST CUSTOMERS
    // ------------------------------------------------------------------------
    console.log('\n--- 2. SETUP AUTHENTICATED CUSTOMERS & TEST ORDER ---');
    const timestamp = Date.now();

    // Customer 1
    const regRes1 = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Step13 Customer One',
        email: `step13_cust1_${timestamp}@test.com`,
        phone: '9876543210',
        password: 'Password@123',
      }),
    });
    const regData1 = await regRes1.json();
    assert(regRes1.status === 201, 'Customer 1 registered successfully (201 Created)');
    const token1 = regData1.token;
    const user1Id = regData1.user._id;

    // Customer 2 (for IDOR attack tests)
    const regRes2 = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Step13 Attacker Two',
        email: `step13_cust2_${timestamp}@test.com`,
        phone: '9123456780',
        password: 'Password@123',
      }),
    });
    const regData2 = await regRes2.json();
    assert(regRes2.status === 201, 'Customer 2 registered successfully (201 Created)');
    const token2 = regData2.token;

    // Get menu meal
    const mealsRes = await fetch(`${BASE_URL}/meals`);
    const mealsData = await mealsRes.json();
    const testMeal = mealsData.data?.[0];
    assert(Boolean(testMeal), 'Retrieved sample meal for cart checkout');

    // Add to cart
    const cartRes = await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ mealId: testMeal._id, quantity: 2 }),
    });
    assert(cartRes.status === 200, 'Customer 1 added meal to cart (200 OK)');

    // Add address
    const addrRes = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        label: 'Home',
        fullName: 'Step13 Customer One',
        phone: '9876543210',
        addressLine1: 'Flat 101, Shree Residency',
        city: 'Indore',
        state: 'Madhya Pradesh',
        postalCode: '452001',
        latitude: 22.7196,
        longitude: 75.8577,
      }),
    });
    const addrData = await addrRes.json();
    assert(addrRes.status === 201, 'Customer 1 created delivery address (201 Created)');
    const addressId = addrData.data._id;

    // Create order
    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ addressId }),
    });
    const orderData = await orderRes.json();
    assert(orderRes.status === 201, 'Customer 1 placed order for payment testing (201 Created)');
    const order1 = orderData.order;

    // ------------------------------------------------------------------------
    // SECTION 3: RAZORPAY GATEWAY ORDER CREATION FOR MOBILE UPI
    // ------------------------------------------------------------------------
    console.log('\n--- 3. RAZORPAY GATEWAY ORDER CREATION ---');
    const payOrderRes = await fetch(`${BASE_URL}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ orderId: order1._id }),
    });
    const payOrderData = await payOrderRes.json();
    assert(payOrderRes.status === 200, 'POST /api/payments/create-order returns 200 OK');
    assert(payOrderData.success === true, 'Response indicates success: true');
    assert(Boolean(payOrderData.payment?.gatewayOrderId), 'Returns valid gatewayOrderId');
    assert(payOrderData.payment.currency === 'INR', 'Gateway currency is INR');
    assert(payOrderData.payment.amount === Math.round(order1.total * 100), 'Amount in paise matches order total strictly');
    assert(payOrderData.payment.orderId === order1._id, 'Payload includes orderId for client checkout options');
    assert(Boolean(payOrderData.payment.keyId), 'Payload includes public keyId for Razorpay Checkout');
    assert(!payOrderData.payment.keySecret, 'Security: RAZORPAY_KEY_SECRET is NEVER returned to client');

    // ------------------------------------------------------------------------
    // SECTION 4: IDOR SECURITY — ATTACKER CANNOT PAY/VERIFY OTHER'S ORDER
    // ------------------------------------------------------------------------
    console.log('\n--- 4. IDOR PROTECTION & CROSS-CUSTOMER SECURITY ---');
    const idorPayRes = await fetch(`${BASE_URL}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token2}`, // Attacker token
      },
      body: JSON.stringify({ orderId: order1._id }),
    });
    assert(idorPayRes.status === 403, 'Attacker cannot create payment for another customer order (403 Forbidden)');

    const idorVerifyRes = await fetch(`${BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token2}`, // Attacker token
      },
      body: JSON.stringify({
        orderId: order1._id,
        razorpay_order_id: payOrderData.payment.gatewayOrderId,
        razorpay_payment_id: 'pay_dummy_attack',
        razorpay_signature: 'sig_dummy_attack',
      }),
    });
    assert(idorVerifyRes.status === 403, 'Attacker cannot verify payment for another customer order (403 Forbidden)');

    // ------------------------------------------------------------------------
    // SECTION 5: CRYPTOGRAPHIC SIGNATURE VERIFICATION & REPLAY PROTECTION
    // ------------------------------------------------------------------------
    console.log('\n--- 5. CRYPTOGRAPHIC SIGNATURE VERIFICATION & REPLAY PROTECTION ---');
    const gatewayOrderId = payOrderData.payment.gatewayOrderId;
    const gatewayPaymentId = `pay_step13_${Date.now()}`;

    // Tampered signature
    const badSigRes = await fetch(`${BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        orderId: order1._id,
        razorpay_order_id: gatewayOrderId,
        razorpay_payment_id: gatewayPaymentId,
        razorpay_signature: 'fraudulent_tampered_signature_hex_123',
      }),
    });
    assert(badSigRes.status === 400, 'Tampered signature rejected with 400 Bad Request');

    // Valid HMAC SHA-256 signature
    const validSignature = generateTestSignature({ gatewayOrderId, gatewayPaymentId });
    const verifyRes = await fetch(`${BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        orderId: order1._id,
        razorpay_order_id: gatewayOrderId,
        razorpay_payment_id: gatewayPaymentId,
        razorpay_signature: validSignature,
      }),
    });
    const verifyData = await verifyRes.json();
    assert(verifyRes.status === 200, 'Valid HMAC signature verified with 200 OK');
    assert(verifyData.payment.status === 'Paid', 'Payment status transitioned to Paid');
    assert(verifyData.order.paymentStatus === 'Paid', 'Order paymentStatus updated to Paid server-side');

    // Replay attack / idempotent duplicate verify
    const replayRes = await fetch(`${BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        orderId: order1._id,
        razorpay_order_id: gatewayOrderId,
        razorpay_payment_id: gatewayPaymentId,
        razorpay_signature: validSignature,
      }),
    });
    assert(replayRes.status === 200, 'Replay verification handled idempotently (200 OK)');

    // ------------------------------------------------------------------------
    // SECTION 6: PAYMENT FAILURE & RETRY / SWITCH TO COD
    // ------------------------------------------------------------------------
    console.log('\n--- 6. PAYMENT FAILURE & COD RECOVERY FLOW ---');
    // Create another order for failure testing
    await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ mealId: testMeal._id, quantity: 1 }),
    });
    const orderRes2 = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ addressId }),
    });
    const orderData2 = await orderRes2.json();
    const order2 = orderData2.order;

    const failRecordRes = await fetch(`${BASE_URL}/payments/failure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        orderId: order2._id,
        gatewayOrderId: 'order_failed_test_123',
        reason: 'Customer cancelled UPI modal',
      }),
    });
    assert(failRecordRes.status === 200, 'POST /api/payments/failure records failure cleanly (200 OK)');

    // Switch failed online payment to COD
    const codRes = await fetch(`${BASE_URL}/payments/cod`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ orderId: order2._id }),
    });
    const codData = await codRes.json();
    assert(codRes.status === 200, 'Customer successfully switched pending order to Cash on Delivery (200 OK)');
    assert(codData.order.paymentMethod === 'COD', 'Order paymentMethod updated to COD');
    assert(codData.order.paymentStatus === 'Pending', 'Order paymentStatus remains Pending for doorstep collection');

    // ------------------------------------------------------------------------
    // SECTION 7: WEBHOOK SIGNATURE VERIFICATION
    // ------------------------------------------------------------------------
    console.log('\n--- 7. WEBHOOK HMAC SIGNATURE VERIFICATION ---');
    const fakeRawBody = JSON.stringify({ event: 'payment.captured', test: true });
    assert(
      !verifyWebhookSignature({ rawBody: fakeRawBody, signature: 'invalid_webhook_sig' }),
      'Invalid webhook signature is mathematically rejected'
    );

    // ------------------------------------------------------------------------
    // SECTION 8: FRONTEND ASSET & SECURITY AUDIT
    // ------------------------------------------------------------------------
    console.log('\n--- 8. FRONTEND ASSETS & SECURITY AUDIT ---');
    const clientPackage = JSON.parse(fs.readFileSync(path.join(rootDir, 'client', 'package.json'), 'utf8'));
    assert(Boolean(clientPackage.dependencies), 'client/package.json exists with dependencies');

    // Check client source for hardcoded localhost
    const checkoutSource = fs.readFileSync(path.join(rootDir, 'client', 'src', 'pages', 'Checkout.jsx'), 'utf8');
    assert(!checkoutSource.includes('http://localhost:5000'), 'Checkout.jsx has zero hardcoded localhost:5000 URLs');
    assert(!checkoutSource.includes('RAZORPAY_KEY_SECRET'), 'Checkout.jsx has zero references to RAZORPAY_KEY_SECRET');
    assert(checkoutSource.includes('buildRazorpayOptions'), 'Checkout.jsx uses standardized buildRazorpayOptions');

    console.log('\n========================================================================');
    console.log(`📊 STEP 13 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================\n');

    return { passed, failed };
  } catch (error) {
    console.error('❌ Step 13 Test Suite Error:', error);
    return { passed, failed: failed + 1 };
  }
};

// Direct CLI invocation
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runStep13Tests().then(({ failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}
