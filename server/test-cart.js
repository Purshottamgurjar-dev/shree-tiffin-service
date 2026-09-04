// Automated API test suite for Step 4 Real Cart & Shopping System
const BASE_URL = process.env.TEST_URL || 'http://localhost:5000/api';

const runCartTests = async () => {
  console.log('--- STARTING STEP 4 CART & SHOPPING SYSTEM TEST SUITE ---');
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
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.success === true, 'GET /api/health is online');

    // 2. Authentication Protection
    const unauthGet = await fetch(`${BASE_URL}/cart`);
    assert(unauthGet.status === 401, 'GET /api/cart without token returns 401 Unauthorized');

    const unauthPost = await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mealId: 'dummy123', quantity: 1 }),
    });
    assert(unauthPost.status === 401, 'POST /api/cart/items without token returns 401 Unauthorized');

    // 3. Register Customer A
    const customerAEmail = `cust_a_${Date.now()}@example.com`;
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aarav Patel',
        email: customerAEmail,
        phone: '9876543211',
        password: 'Password@123',
      }),
    });
    const regDataA = await regResA.json();
    const tokenA = regDataA.token;
    assert(regResA.status === 201 && !!tokenA, 'Customer A registered successfully');

    // 4. Customer A initial empty cart
    const emptyCartRes = await fetch(`${BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const emptyCartData = await emptyCartRes.json();
    assert(
      emptyCartRes.status === 200 &&
        emptyCartData.success === true &&
        Array.isArray(emptyCartData.data.items) &&
        emptyCartData.data.items.length === 0 &&
        emptyCartData.data.totalItems === 0 &&
        emptyCartData.data.subtotal === 0,
      'Customer A receives clean empty cart (totalItems = 0, subtotal = 0)'
    );

    // 5. Get available meals to test cart with
    const mealsRes = await fetch(`${BASE_URL}/meals`);
    const mealsData = await mealsRes.json();
    const availableMeals = mealsData.data.filter((m) => m.isAvailable);
    assert(availableMeals.length >= 2, 'Available meals present in database', `(Found ${availableMeals.length})`);
    const meal1 = availableMeals[0];
    const meal2 = availableMeals[1];

    // 6. Add available meal to cart
    const addRes1 = await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ mealId: meal1._id, quantity: 1 }),
    });
    const addData1 = await addRes1.json();
    assert(
      addRes1.status === 200 &&
        addData1.success === true &&
        addData1.data.items.length === 1 &&
        addData1.data.totalItems === 1 &&
        addData1.data.subtotal === meal1.price,
      `Added meal1 "${meal1.name}" to cart (totalItems: 1, subtotal: ₹${meal1.price})`
    );

    // 7. Add same meal again -> increases quantity
    const addResDuplicate = await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ mealId: meal1._id, quantity: 2 }),
    });
    const addDataDup = await addResDuplicate.json();
    assert(
      addResDuplicate.status === 200 &&
        addDataDup.data.items.length === 1 &&
        addDataDup.data.items[0].quantity === 3 &&
        addDataDup.data.totalItems === 3 &&
        addDataDup.data.subtotal === meal1.price * 3,
      `Adding same meal increments quantity (qty: 3, subtotal: ₹${meal1.price * 3})`
    );

    // 8. Update item quantity via PUT
    const updateRes = await fetch(`${BASE_URL}/cart/items/${meal1._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ quantity: 2 }),
    });
    const updateData = await updateRes.json();
    assert(
      updateRes.status === 200 &&
        updateData.data.items[0].quantity === 2 &&
        updateData.data.totalItems === 2 &&
        updateData.data.subtotal === meal1.price * 2,
      `PUT /api/cart/items/:mealId updates quantity (qty: 2, subtotal: ₹${meal1.price * 2})`
    );

    // 9. Add a second meal to cart
    const addMeal2Res = await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ mealId: meal2._id, quantity: 1 }),
    });
    const addMeal2Data = await addMeal2Res.json();
    const expectedSubtotal = meal1.price * 2 + meal2.price * 1;
    assert(
      addMeal2Res.status === 200 &&
        addMeal2Data.data.items.length === 2 &&
        addMeal2Data.data.totalItems === 3 &&
        addMeal2Data.data.subtotal === expectedSubtotal,
      `Added meal2 "${meal2.name}" (2 distinct items, totalItems: 3, subtotal: ₹${expectedSubtotal})`
    );

    // 10. Remove meal1 from cart
    const removeRes = await fetch(`${BASE_URL}/cart/items/${meal1._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const removeData = await removeRes.json();
    assert(
      removeRes.status === 200 &&
        removeData.data.items.length === 1 &&
        removeData.data.items[0].meal._id === meal2._id &&
        removeData.data.totalItems === 1 &&
        removeData.data.subtotal === meal2.price,
      `DELETE /api/cart/items/:mealId removed meal1; meal2 remains with subtotal ₹${meal2.price}`
    );

    // 11. Clear Cart
    const clearRes = await fetch(`${BASE_URL}/cart`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const clearData = await clearRes.json();
    assert(
      clearRes.status === 200 &&
        clearData.success === true &&
        clearData.data.items.length === 0 &&
        clearData.data.totalItems === 0 &&
        clearData.data.subtotal === 0,
      'DELETE /api/cart clears all items and resets totals'
    );

    // 12. Input Validation Checks
    // Missing mealId
    const valMissing = await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ quantity: 1 }),
    });
    assert(valMissing.status === 400, 'Validation: missing mealId returns 400');

    // Quantity = 0
    const valZero = await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ mealId: meal1._id, quantity: 0 }),
    });
    assert(valZero.status === 400, 'Validation: quantity = 0 returns 400');

    // Quantity = -1
    const valNegative = await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ mealId: meal1._id, quantity: -1 }),
    });
    assert(valNegative.status === 400, 'Validation: negative quantity returns 400');

    // Quantity = 1.5 (decimal)
    const valDecimal = await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ mealId: meal1._id, quantity: 1.5 }),
    });
    assert(valDecimal.status === 400, 'Validation: non-integer quantity returns 400');

    // 13. Unavailable Meal Handling
    // Login as owner to mark a meal unavailable
    const ownerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@shreetiffin.com', password: 'Owner@12345' }),
    });
    const ownerData = await ownerLoginRes.json();
    const ownerToken = ownerData.token;

    // Toggle meal2 availability to false
    await fetch(`${BASE_URL}/meals/${meal2._id}/availability`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    // Customer tries to add unavailable meal
    const addUnavailRes = await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ mealId: meal2._id, quantity: 1 }),
    });
    const addUnavailData = await addUnavailRes.json();
    assert(
      addUnavailRes.status === 400 && addUnavailData.message.includes('currently unavailable'),
      'Adding unavailable meal rejected with 400 and message'
    );

    // Toggle meal2 availability back to true
    await fetch(`${BASE_URL}/meals/${meal2._id}/availability`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    // 14. Customer Cart Isolation Security Test
    // Register Customer B
    const customerBEmail = `cust_b_${Date.now()}@example.com`;
    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Priya Sharma',
        email: customerBEmail,
        phone: '9876543222',
        password: 'Password@123',
      }),
    });
    const regDataB = await regResB.json();
    const tokenB = regDataB.token;

    // Add meal to Customer B's cart
    await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ mealId: meal1._id, quantity: 4 }),
    });

    // Customer A checks their cart -> should still be 0 items
    const cartResA = await fetch(`${BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const cartDataA = await cartResA.json();
    assert(
      cartDataA.data.items.length === 0 && cartDataA.data.totalItems === 0,
      'Customer Isolation: Customer A cannot see Customer B items'
    );

    // Customer B checks their cart -> should have 4 items
    const cartResB = await fetch(`${BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const cartDataB = await cartResB.json();
    assert(
      cartDataB.data.items.length === 1 && cartDataB.data.totalItems === 4,
      'Customer Isolation: Customer B sees their own 4 items'
    );

    // 15. Price Manipulation Protection
    // Malicious customer sends manipulated price: ₹1 instead of real price
    const maliciousRes = await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        mealId: meal1._id,
        quantity: 1,
        price: 1, // MALICIOUS TAMPERED PRICE
      }),
    });
    const maliciousData = await maliciousRes.json();
    assert(
      maliciousRes.status === 200 &&
        maliciousData.data.items[0].meal.price === meal1.price &&
        maliciousData.data.subtotal === meal1.price,
      `Price Security: Tampered client price ₹1 ignored; real DB price ₹${meal1.price} charged`
    );

    console.log('----------------------------------------------------');
    console.log(`STEP 4 CART TESTS COMPLETED: ${testsPassed} passed, ${testsFailed} failed`);
    console.log('----------------------------------------------------');
    if (testsFailed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error in cart test suite:', error);
    process.exit(1);
  }
};

runCartTests();
