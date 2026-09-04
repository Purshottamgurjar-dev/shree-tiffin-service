/**
 * test-step10-production-hardening.js
 * Comprehensive automated test suite for Step 10:
 * Production-Ready Notifications, Business Settings & System Hardening
 * Shree Tiffin Service — "Ghar Jaisa Khana, Har Din."
 *
 * Enforces test isolation against `shree_tiffin_service_test`
 */

import { validateTestDatabase } from './config/db.js';

const PORT = process.env.TEST_PORT || process.env.PORT || 5001;
const BASE_URL = process.env.TEST_URL || `http://localhost:${PORT}/api`;

export const runStep10Tests = async () => {
  console.log('\n========================================================================');
  console.log('🚀 RUNNING STEP 10 AUTOMATED TEST SUITE: NOTIFICATIONS, SETTINGS & HARDENING');
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
    // 1. DATABASE SAFETY GUARD & ENVIRONMENT VERIFICATION
    // -------------------------------------------------------------------
    console.log('\n--- 1. DATABASE SAFETY GUARD & TEST ISOLATION ---');
    assert(process.env.NODE_ENV === 'test', 'NODE_ENV is strictly set to "test"');

    let caughtProdRejection = false;
    try {
      validateTestDatabase('mongodb+srv://user:pass@cluster.mongodb.net/shree_tiffin_service?retryWrites=true');
    } catch (err) {
      if (err.message.includes('REFUSING TO RUN TESTS: TEST DATABASE REQUIRED')) {
        caughtProdRejection = true;
      }
    }
    assert(caughtProdRejection, 'Safety guard strictly refuses tests against production DB "shree_tiffin_service"');

    // -------------------------------------------------------------------
    // 2. HTTP SECURITY HEADERS AUDIT
    // -------------------------------------------------------------------
    console.log('\n--- 2. HTTP SECURITY HEADERS AUDIT ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    assert(healthRes.status === 200, 'Health endpoint responds with 200 OK');

    const headers = healthRes.headers;
    assert(headers.get('x-content-type-options') === 'nosniff', 'X-Content-Type-Options is nosniff');
    assert(headers.get('x-frame-options') === 'DENY', 'X-Frame-Options is DENY');
    assert(headers.get('x-xss-protection') === '1; mode=block', 'X-XSS-Protection is 1; mode=block');
    assert(headers.get('referrer-policy') === 'strict-origin-when-cross-origin', 'Referrer-Policy is strict-origin-when-cross-origin');

    const csp = headers.get('content-security-policy') || '';
    assert(csp.includes('checkout.razorpay.com'), 'CSP whitelists Razorpay checkout gateway');
    assert(csp.includes('openstreetmap.org'), 'CSP whitelists Leaflet OSM map tiles');

    // -------------------------------------------------------------------
    // 3. SETUP TEST USERS (CUSTOMER A, CUSTOMER B, OWNER)
    // -------------------------------------------------------------------
    console.log('\n--- 3. SETUP AUTHENTICATED USERS & SESSIONS ---');
    const timestamp = Date.now();

    // Register Customer A
    const custARes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Step 10 Cust A',
        email: `step10_a_${timestamp}@test.com`,
        phone: '9876540001',
        password: 'Password@123',
      }),
    });
    const custAJson = await custARes.json();
    const tokenA = custAJson.token;
    const userAId = custAJson.user?._id;
    assert(custARes.status === 201 && !!tokenA, 'Registered Customer A successfully');

    // Register Customer B
    const custBRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Step 10 Cust B',
        email: `step10_b_${timestamp}@test.com`,
        phone: '9876540002',
        password: 'Password@123',
      }),
    });
    const custBJson = await custBRes.json();
    const tokenB = custBJson.token;
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
    const ownerJson = await ownerRes.json();
    const ownerToken = ownerJson.token;
    assert(ownerRes.status === 200 && ownerJson.user?.role === 'owner', 'Authenticated as Kitchen Owner');

    // -------------------------------------------------------------------
    // 4. PUBLIC BUSINESS SETTINGS VERIFICATION
    // -------------------------------------------------------------------
    console.log('\n--- 4. PUBLIC BUSINESS SETTINGS & OPERATING CONTROLS ---');
    const pubSettingsRes = await fetch(`${BASE_URL}/settings`);
    const pubSettingsJson = await pubSettingsRes.json();

    assert(pubSettingsRes.status === 200, 'GET /api/settings returns 200 OK without authentication');
    assert(pubSettingsJson.success === true, 'Public settings response reports success');
    assert(pubSettingsJson.settings?.businessInfo?.tagline === 'Ghar Jaisa Khana, Har Din.', 'Public settings includes official tagline');
    assert(Array.isArray(pubSettingsJson.settings?.businessHours) && pubSettingsJson.settings.businessHours.length === 7, 'Provides 7-day business operating hours');
    assert(typeof pubSettingsJson.settings?.ordering?.isOpenNow === 'boolean', 'Computes store isOpenNow boolean dynamically');
    assert(!('singletonId' in pubSettingsJson.settings), 'Does not leak internal database singleton ID to public');

    // -------------------------------------------------------------------
    // 5. OWNER BUSINESS SETTINGS MANAGEMENT & RBAC
    // -------------------------------------------------------------------
    console.log('\n--- 5. OWNER BUSINESS SETTINGS CONFIGURATION ---');
    // Customer forbidden
    const custForbiddenRes = await fetch(`${BASE_URL}/settings/admin`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(custForbiddenRes.status === 403, 'Customer cannot access owner settings (403 Forbidden)');

    // Owner access
    const adminSettingsRes = await fetch(`${BASE_URL}/settings/admin`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const adminSettingsJson = await adminSettingsRes.json();
    assert(adminSettingsRes.status === 200, 'Owner can retrieve full admin settings (200 OK)');

    // Validation: Reject negative delivery fee
    const badFeeRes = await fetch(`${BASE_URL}/settings/admin`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        delivery: { deliveryFee: -20 },
      }),
    });
    assert(badFeeRes.status === 400, 'Rejects negative delivery fee with 400 Bad Request');

    // Validation: Reject invalid time format
    const badTimeRes = await fetch(`${BASE_URL}/settings/admin`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        businessHours: [{ day: 'Monday', isOpen: true, openTime: '25:99', closeTime: '22:00' }],
      }),
    });
    assert(badTimeRes.status === 400, 'Rejects invalid time format with 400 Bad Request');

    // Configure valid delivery settings: Delivery Fee = 30, Minimum Order Value = 150
    const updateSettingsRes = await fetch(`${BASE_URL}/settings/admin`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        delivery: {
          deliveryFee: 30,
          minimumOrderValue: 150,
          deliveryRadius: 15,
        },
        ordering: {
          isAcceptingOrders: true,
          pausedMessage: 'Kitchen is paused for evening prep.',
        },
      }),
    });
    const updateSettingsJson = await updateSettingsRes.json();
    assert(updateSettingsRes.status === 200, 'Owner successfully updates delivery fee & minimum order');
    assert(updateSettingsJson.settings?.delivery?.deliveryFee === 30, 'Delivery fee updated to ₹30');
    assert(updateSettingsJson.settings?.delivery?.minimumOrderValue === 150, 'Minimum order value updated to ₹150');

    // -------------------------------------------------------------------
    // 6. BUSINESS CONTROLS: MINIMUM ORDER VALUE & STORE PAUSE ENFORCEMENT
    // -------------------------------------------------------------------
    console.log('\n--- 6. BUSINESS CONTROLS IN CHECKOUT & ORDERING ---');
    // Fetch meals to add to cart
    const mealsRes = await fetch(`${BASE_URL}/meals`);
    const mealsJson = await mealsRes.json();
    const mealsList = mealsJson.data || mealsJson.meals || [];
    const availableMeal = mealsList.find((m) => m.isAvailable && m.price < 150) || mealsList[0];

    // Add 1 meal to cart for Customer A (subtotal < 150)
    await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        mealId: availableMeal._id,
        quantity: 1,
      }),
    });

    // Create address for Customer A
    const addrRes = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        label: 'Home',
        fullName: 'Step 10 Cust A',
        phone: '9876540001',
        addressLine1: 'Flat 402, Royal Residency',
        city: 'Indore',
        state: 'Madhya Pradesh',
        postalCode: '452001',
        latitude: 22.7196,
        longitude: 75.8577,
      }),
    });
    const addrJson = await addrRes.json();
    const addressId = addrJson.data?._id || addrJson.address?._id;
    assert(addrRes.status === 201 && !!addressId, 'Saved delivery address for Customer A');

    // Validate checkout when subtotal < minimumOrderValue
    const minOrderValRes = await fetch(`${BASE_URL}/checkout/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ addressId }),
    });
    assert(minOrderValRes.status === 400, 'Checkout rejects when cart subtotal is below minimum order value (400 Bad Request)');

    // Attempt to place order when subtotal < minimumOrderValue
    const minOrderPlaceRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ addressId }),
    });
    assert(minOrderPlaceRes.status === 400, 'Order creation rejects when subtotal is below minimum order value (400 Bad Request)');

    // Owner pauses store ordering
    await fetch(`${BASE_URL}/settings/admin`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        ordering: {
          isAcceptingOrders: false,
          pausedMessage: 'Kitchen is currently closed for prep.',
        },
      }),
    });

    // Customer attempts order while store is paused
    const pausedOrderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ addressId }),
    });
    const pausedOrderJson = await pausedOrderRes.json();
    assert(pausedOrderRes.status === 400, 'Order creation rejects when store is paused (400 Bad Request)');
    assert(pausedOrderJson.message.includes('Kitchen is currently closed'), 'Paused message matches owner configuration');

    // Owner unpauses store & sets minimumOrderValue to 0 for seamless order testing
    await fetch(`${BASE_URL}/settings/admin`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        delivery: { deliveryFee: 30, minimumOrderValue: 0 },
        ordering: { isAcceptingOrders: true },
      }),
    });

    // -------------------------------------------------------------------
    // 7. ORDER CREATION, DELIVERY FEE & AUTOMATED NOTIFICATIONS
    // -------------------------------------------------------------------
    console.log('\n--- 7. AUTOMATED NOTIFICATIONS & REAL ORDER DELIVERY FEE ---');
    // Place order with delivery fee applied
    const placeOrderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ addressId }),
    });
    const placeOrderJson = await placeOrderRes.json();
    assert(placeOrderRes.status === 201, 'Customer A successfully creates order with store unpaused');
    const createdOrder = placeOrderJson.order;
    assert(createdOrder.deliveryFee === 30, 'Applies centralized delivery fee of ₹30 on Order model');
    assert(createdOrder.total === createdOrder.subtotal + 30, 'Order total correctly includes subtotal + delivery fee');

    // Customer Notification Center verification
    const custNotifsRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const custNotifsJson = await custNotifsRes.json();
    assert(custNotifsRes.status === 200, 'Customer retrieves personal notifications (200 OK)');
    assert(custNotifsJson.count > 0, 'Customer has at least 1 notification after placing order');

    const placedNotif = custNotifsJson.notifications.find((n) => n.type === 'ORDER_PLACED');
    assert(!!placedNotif, 'Found notification of type "ORDER_PLACED"');
    assert(placedNotif.metadata?.orderNumber === createdOrder.orderNumber, 'Notification contains real, collision-safe order number');
    assert(placedNotif.isRead === false, 'New notification defaults to isRead = false');

    // Customer Isolation: Customer B cannot view Customer A's notifications
    const custBNotifsRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const custBNotifsJson = await custBNotifsRes.json();
    const custBHasOrderA = custBNotifsJson.notifications.some(
      (n) => n.metadata?.orderNumber === createdOrder.orderNumber
    );
    assert(!custBHasOrderA, 'Customer isolation strictly enforced: Customer B cannot see Customer A notifications');

    // Unread count endpoint
    const unreadCountRes = await fetch(`${BASE_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const unreadCountJson = await unreadCountRes.json();
    assert(unreadCountRes.status === 200 && unreadCountJson.unreadCount > 0, 'GET /notifications/unread-count returns accurate count');

    // Mark single notification as read
    const markReadRes = await fetch(`${BASE_URL}/notifications/${placedNotif._id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const markReadJson = await markReadRes.json();
    assert(markReadRes.status === 200 && markReadJson.notification?.isRead === true, 'PATCH /notifications/:id/read marks notification as read');

    // Mark all as read
    const markAllRes = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const markAllJson = await markAllRes.json();
    assert(markAllRes.status === 200 && markAllJson.unreadCount === 0, 'PATCH /notifications/read-all resets unread count to 0');

    // Owner Order Status Update triggers status notification
    const updateStatusRes = await fetch(`${BASE_URL}/orders/${createdOrder._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'Confirmed', note: 'Order accepted by kitchen head' }),
    });
    assert(updateStatusRes.status === 200, 'Owner updates order status to "Confirmed"');

    const confirmedNotifsRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const confirmedNotifsJson = await confirmedNotifsRes.json();
    const confirmedNotif = confirmedNotifsJson.notifications.find((n) => n.type === 'ORDER_CONFIRMED');
    assert(!!confirmedNotif, 'Automated trigger created "ORDER_CONFIRMED" notification for customer');

    // COD Collection triggers notification
    const codRes = await fetch(`${BASE_URL}/payments/cod`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ orderId: createdOrder._id }),
    });
    const codJson = await codRes.json();
    const paymentId = codJson.payment?._id;

    if (paymentId) {
      const collectRes = await fetch(`${BASE_URL}/payments/${paymentId}/cod-collect`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      assert(collectRes.status === 200, 'Owner collects Cash on Delivery payment');

      const codNotifsRes = await fetch(`${BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const codNotifsJson = await codNotifsRes.json();
      const codNotif = codNotifsJson.notifications.find((n) => n.type === 'COD_COLLECTED');
      assert(!!codNotif, 'Automated trigger created "COD_COLLECTED" notification for customer');
    }

    // -------------------------------------------------------------------
    // 8. SECURE PASSWORD RESET FLOW WITH CRYPTOGRAPHIC TOKENS
    // -------------------------------------------------------------------
    console.log('\n--- 8. SECURE PASSWORD RESET FLOW (SHA-256 TOKENS) ---');
    // Direct unverified reset without token must be rejected
    const unverifiedResetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `step10_b_${timestamp}@test.com`,
        newPassword: 'HackedPassword@123',
      }),
    });
    assert(unverifiedResetRes.status === 400 || unverifiedResetRes.status === 403, 'Direct unverified password reset without token is REJECTED');

    // Request reset token
    const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `step10_b_${timestamp}@test.com`,
      }),
    });
    const forgotJson = await forgotRes.json();
    assert(forgotRes.status === 200, 'POST /api/auth/forgot-password generates reset token');
    const rawResetToken = forgotJson.resetToken;
    assert(typeof rawResetToken === 'string' && rawResetToken.length >= 40, 'Generated cryptographically secure 20+ byte hex token');

    // Invalid token rejected
    const invalidTokenRes = await fetch(`${BASE_URL}/auth/reset-password/invalid_token_12345`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'BrandNewPassword@123' }),
    });
    assert(invalidTokenRes.status === 400, 'Rejects invalid reset token with 400 Bad Request');

    // Valid token reset
    const validResetRes = await fetch(`${BASE_URL}/auth/reset-password/${rawResetToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'BrandNewPassword@123' }),
    });
    const validResetJson = await validResetRes.json();
    assert(validResetRes.status === 200 && validResetJson.success === true, 'Successfully resets password with valid single-use token');

    // Replay attack: Token cannot be re-used
    const replayResetRes = await fetch(`${BASE_URL}/auth/reset-password/${rawResetToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'AnotherPassword@123' }),
    });
    assert(replayResetRes.status === 400, 'Replay protection: Single-use token is immediately invalidated after first use');

    // Verify login with new password
    const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `step10_b_${timestamp}@test.com`,
        password: 'BrandNewPassword@123',
      }),
    });
    assert(newLoginRes.status === 200, 'Successfully logs in with newly reset password');

    // -------------------------------------------------------------------
    // 9. REGRESSION VERIFICATION OF STEP 9 PEAK TIMES
    // -------------------------------------------------------------------
    console.log('\n--- 9. STEP 9 PEAK TIMES REGRESSION CHECK ---');
    const peakRes = await fetch(`${BASE_URL}/analytics/peak-times`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const peakJson = await peakRes.json();
    assert(peakRes.status === 200, 'GET /api/analytics/peak-times returns 200 OK');
    assert(Array.isArray(peakJson.data?.hours) && peakJson.data.hours.length === 24, 'Provides full 24-hour distribution (0 to 23)');
    assert(Array.isArray(peakJson.data?.weekdays) && peakJson.data.weekdays.length === 7, 'Provides 7-day weekday distribution');

    // -------------------------------------------------------------------
    // 10. SENSITIVE CREDENTIALS PROTECTION
    // -------------------------------------------------------------------
    console.log('\n--- 10. SENSITIVE DATA & CREDENTIALS PROTECTION ---');
    const settingsStr = JSON.stringify(pubSettingsJson);
    assert(!settingsStr.includes('JWT_SECRET'), 'No JWT secret in settings response');
    assert(!settingsStr.includes('RAZORPAY_KEY_SECRET'), 'No Razorpay secret in settings response');
    assert(!settingsStr.includes('$2a$'), 'No password hash in settings response');

    const notifsStr = JSON.stringify(custNotifsJson);
    assert(!notifsStr.includes('JWT_SECRET'), 'No JWT secret in notifications response');
    // -------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------
    try {
      await fetch(`${BASE_URL}/settings/admin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          delivery: { deliveryFee: 0, minimumOrderValue: 0, deliveryRadius: 15 },
          ordering: { isAcceptingOrders: true },
        }),
      });
    } catch (cleanErr) {
      // ignore cleanup errors
    }

    // -------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------
    console.log('\n========================================================================');
    console.log(`📊 STEP 10 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================\n');

    return { passed, failed };
  } catch (error) {
    console.error('Fatal test error in Step 10:', error);
    return { passed, failed: failed + 1 };
  }
};

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('test-step10-production-hardening.js')) {
  runStep10Tests().then(({ failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}
