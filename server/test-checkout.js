// Automated API test suite for Step 5 Checkout Validation
const BASE_URL = process.env.TEST_URL || 'http://localhost:5000/api';

const runCheckoutTests = async () => {
  console.log('--- STARTING STEP 5 CHECKOUT VALIDATION TEST SUITE ---');
  let testsPassed = 0;
  let testsFailed = 0;

  const assert = (condition, testName, extra = '') => {
    if (condition) {
      console.log(`✅ PASS: ${testName} ${extra}`);
      testsPassed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${extra}`);
      testsFailed++;
    }
  };

  try {
    // 1. Authentication Protection
    const unauthRes = await fetch(`${BASE_URL}/checkout/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(unauthRes.status === 401, 'POST /api/checkout/validate without token returns 401 Unauthorized');

    // 2. Register Customer
    const customerEmail = `cust_chk_${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rohan Joshi',
        email: customerEmail,
        phone: '9876543233',
        password: 'Password@123',
      }),
    });
    const regData = await regRes.json();
    const token = regData.token;
    assert(regRes.status === 201 && !!token, 'Customer registered successfully');

    // 3. Checkout with Empty Cart -> Rejection
    const emptyCheckoutRes = await fetch(`${BASE_URL}/checkout/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    const emptyCheckoutData = await emptyCheckoutRes.json();
    assert(
      emptyCheckoutRes.status === 400 && emptyCheckoutData.message.includes('cart is empty'),
      'Checkout with empty cart rejected with 400 Bad Request'
    );

    // 4. Create Address for Customer
    const addrRes = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        label: 'Home',
        fullName: 'Rohan Joshi',
        phone: '9876543233',
        addressLine1: 'B-201, Silver Residency',
        city: 'Indore',
        state: 'Madhya Pradesh',
        postalCode: '452002',
        latitude: 22.7196,
        longitude: 75.8577,
      }),
    });
    const addrJson = await addrRes.json();
    const address = addrJson.data || addrJson.address;
    if (!address) {
      console.error('[DEBUG POST /addresses]: status =', addrRes.status, 'body =', addrJson);
    }
    assert(!!address?._id, 'Customer address created');

    // 5. Add Available Meals to Cart
    const mealsRes = await fetch(`${BASE_URL}/meals`);
    const mealsData = await mealsRes.json();
    const availableMeals = mealsData.data.filter((m) => m.isAvailable);
    const meal1 = availableMeals[0];
    const meal2 = availableMeals[1];

    await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mealId: meal1._id, quantity: 2 }),
    });
    await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mealId: meal2._id, quantity: 1 }),
    });

    // 6. Valid Checkout Validation
    const validCheckoutRes = await fetch(`${BASE_URL}/checkout/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ addressId: address._id }),
    });
    const validCheckoutData = await validCheckoutRes.json();
    const expectedSubtotal = meal1.price * 2 + meal2.price * 1;
    assert(
      validCheckoutRes.status === 200 &&
        validCheckoutData.success === true &&
        validCheckoutData.data.totalItems === 3 &&
        validCheckoutData.data.subtotal === expectedSubtotal &&
        validCheckoutData.data.address._id === address._id,
      `Valid checkout verified (3 items, subtotal: ₹${expectedSubtotal})`
    );

    // 7. Security: Address Ownership during Checkout
    // Register Another Customer and create their address
    const otherCustRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another User',
        email: `other_${Date.now()}@example.com`,
        phone: '9876543244',
        password: 'Password@123',
      }),
    });
    const otherToken = (await otherCustRes.json()).token;
    const otherAddrRes = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${otherToken}` },
      body: JSON.stringify({
        label: 'Office',
        fullName: 'Another User',
        phone: '9876543244',
        addressLine1: 'Some other place',
        city: 'Gwalior',
        state: 'Madhya Pradesh',
        postalCode: '474001',
        latitude: 26.2183,
        longitude: 78.1828,
      }),
    });
    const otherAddrJson = await otherAddrRes.json();
    const otherAddr = otherAddrJson.data || otherAddrJson.address;

    // First customer attempts to checkout using the other customer's address
    const stealAddrCheckout = await fetch(`${BASE_URL}/checkout/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ addressId: otherAddr._id }),
    });
    assert(
      stealAddrCheckout.status === 403,
      'Security: Checkout with another customer’s address returns 403 Forbidden'
    );

    // 8. Price Manipulation Protection in Checkout
    const maliciousCheckoutRes = await fetch(`${BASE_URL}/checkout/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        addressId: address._id,
        subtotal: 1, // MALICIOUS TAMPERED AMOUNT
        total: 1,
      }),
    });
    const maliciousCheckoutData = await maliciousCheckoutRes.json();
    assert(
      maliciousCheckoutData.data.subtotal === expectedSubtotal &&
        maliciousCheckoutData.data.total === expectedSubtotal,
      `Price Security: Tampered subtotal (₹1) ignored; server recalculated real subtotal (₹${expectedSubtotal})`
    );

    // 9. Unavailable Meal in Cart Detection
    // Owner marks meal2 as unavailable
    const ownerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@shreetiffin.com', password: 'Owner@12345' }),
    });
    const ownerToken = (await ownerLoginRes.json()).token;

    await fetch(`${BASE_URL}/meals/${meal2._id}/availability`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    // Customer attempts to validate checkout with unavailable meal in cart
    const unavailCheckoutRes = await fetch(`${BASE_URL}/checkout/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ addressId: address._id }),
    });
    const unavailCheckoutData = await unavailCheckoutRes.json();
    assert(
      unavailCheckoutRes.status === 400 &&
        unavailCheckoutData.message.includes('currently unavailable'),
      'Checkout with unavailable meal rejected with 400 and clear error message'
    );

    // Restore availability of meal2
    await fetch(`${BASE_URL}/meals/${meal2._id}/availability`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    console.log('----------------------------------------------------');
    console.log(`STEP 5 CHECKOUT TESTS COMPLETED: ${testsPassed} passed, ${testsFailed} failed`);
    console.log('----------------------------------------------------');
    if (testsFailed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error in checkout test suite:', error);
    process.exit(1);
  }
};

runCheckoutTests();
