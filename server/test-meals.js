// Automated test suite for Step 3: Menu / Meal Management System
const BASE_URL = process.env.TEST_URL || 'http://localhost:5000/api';

const runTests = async () => {
  console.log('--- STARTING STEP 3 MEAL MANAGEMENT TEST SUITE ---');
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
    // Authenticate Owner
    const ownerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@shreetiffin.com', password: 'Owner@12345' }),
    });
    const ownerLoginData = await ownerLoginRes.json();
    const ownerToken = ownerLoginData.token;
    assert(ownerToken, 'Owner token acquired');

    // Register a test customer
    const customerPayload = {
      name: 'Rohan Verma',
      email: `rohan_${Date.now()}@example.com`,
      phone: '9876543210',
      password: 'Password@123',
    };
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerPayload),
    });
    const regData = await regRes.json();
    const customerToken = regData.token;
    assert(customerToken, 'Customer token acquired');

    // 1. GET /api/meals (Public)
    const mealsRes = await fetch(`${BASE_URL}/meals`);
    const mealsData = await mealsRes.json();
    assert(mealsRes.status === 200 && mealsData.success && Array.isArray(mealsData.data), 'GET /api/meals (Public)');
    assert(mealsData.data.length >= 8, `Fetched all seeded meals (${mealsData.data.length} meals)`);

    const firstMeal = mealsData.data[0];

    // 2. GET /api/meals?category=Special Thali
    const categoryRes = await fetch(`${BASE_URL}/meals?category=Special%20Thali`);
    const categoryData = await categoryRes.json();
    assert(
      categoryRes.status === 200 && categoryData.data.every((m) => m.category === 'Special Thali'),
      'GET /api/meals?category=Special Thali (Category Filter)'
    );

    // 3. GET /api/meals?search=paneer
    const searchRes = await fetch(`${BASE_URL}/meals?search=paneer`);
    const searchData = await searchRes.json();
    assert(
      searchRes.status === 200 && searchData.data.length > 0,
      `GET /api/meals?search=paneer (Found ${searchData.data.length} matching meals)`
    );

    // 4. GET /api/meals?featured=true
    const featuredRes = await fetch(`${BASE_URL}/meals?featured=true`);
    const featuredData = await featuredRes.json();
    assert(
      featuredRes.status === 200 && featuredData.data.every((m) => m.isFeatured === true),
      'GET /api/meals?featured=true (Featured Filter)'
    );

    // 5. GET /api/meals/:id
    const singleMealRes = await fetch(`${BASE_URL}/meals/${firstMeal._id}`);
    const singleMealData = await singleMealRes.json();
    assert(
      singleMealRes.status === 200 && singleMealData.data.name === firstMeal.name,
      'GET /api/meals/:id (Single meal by ID)'
    );

    // 6. GET /api/meals/:slug
    const slugMealRes = await fetch(`${BASE_URL}/meals/${firstMeal.slug}`);
    const slugMealData = await slugMealRes.json();
    assert(
      slugMealRes.status === 200 && slugMealData.data.slug === firstMeal.slug,
      'GET /api/meals/:slug (Single meal by Slug)'
    );

    // 7. POST /api/meals as Customer (MUST BE 403 Forbidden)
    const custCreateRes = await fetch(`${BASE_URL}/meals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        name: 'Hacked Meal',
        description: 'Should fail',
        price: 99,
        category: 'Lunch',
      }),
    });
    assert(custCreateRes.status === 403, 'Customer cannot create meals (403 Forbidden)');

    // 8. POST /api/meals validation: Negative price rejected
    const badPriceRes = await fetch(`${BASE_URL}/meals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        name: 'Negative Price Meal',
        description: 'Should fail validation',
        price: -50,
        category: 'Lunch',
      }),
    });
    assert(badPriceRes.status === 400, 'Negative price rejected (400 Bad Request)');

    // 9. POST /api/meals as Owner (Success)
    const newMealPayload = {
      name: 'Chef Special Paneer Lababdar Thali',
      description: 'Cottage cheese cubes tossed in rich creamy gravy, served with 4 butter rotis and pulao.',
      price: 195,
      category: 'Special Thali',
      ingredients: ['Paneer', 'Cashews', 'Tomatoes', 'Butter Rotis', 'Basmati Pulao'],
      isAvailable: true,
      isFeatured: true,
    };
    const createRes = await fetch(`${BASE_URL}/meals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify(newMealPayload),
    });
    const createData = await createRes.json();
    assert(createRes.status === 201 && createData.data && createData.data.name === newMealPayload.name, 'POST /api/meals as Owner (201 Created)');
    const createdMealId = createData.data._id;

    // 10. PUT /api/meals/:id as Owner
    const updateRes = await fetch(`${BASE_URL}/meals/${createdMealId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ price: 210, description: 'Updated gourmet paneer lababdar thali.' }),
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200 && updateData.data.price === 210, 'PUT /api/meals/:id as Owner (Price updated)');

    // 11. PATCH /api/meals/:id/availability as Owner
    const toggleAvailRes = await fetch(`${BASE_URL}/meals/${createdMealId}/availability`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ isAvailable: false }),
    });
    const toggleAvailData = await toggleAvailRes.json();
    assert(toggleAvailRes.status === 200 && toggleAvailData.data.isAvailable === false, 'PATCH /api/meals/:id/availability (Toggled to false)');

    // 12. PATCH /api/meals/:id/featured as Owner
    const toggleFeatRes = await fetch(`${BASE_URL}/meals/${createdMealId}/featured`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ isFeatured: false }),
    });
    const toggleFeatData = await toggleFeatRes.json();
    assert(toggleFeatRes.status === 200 && toggleFeatData.data.isFeatured === false, 'PATCH /api/meals/:id/featured (Toggled to false)');

    // 13. GET /api/meals/admin/stats as Owner
    const statsRes = await fetch(`${BASE_URL}/meals/admin/stats`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const statsData = await statsRes.json();
    assert(
      statsRes.status === 200 && statsData.data.total >= 9 && statsData.data.unavailable >= 1,
      'GET /api/meals/admin/stats (Owner Stats KPI)'
    );

    // 14. DELETE /api/meals/:id as Customer (MUST BE 403 Forbidden)
    const custDeleteRes = await fetch(`${BASE_URL}/meals/${createdMealId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custDeleteRes.status === 403, 'Customer cannot delete meals (403 Forbidden)');

    // 15. DELETE /api/meals/:id as Owner (Success)
    const deleteRes = await fetch(`${BASE_URL}/meals/${createdMealId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(deleteRes.status === 200, 'DELETE /api/meals/:id as Owner (200 Deleted)');

    console.log(`\nRESULTS: ${testsPassed} passed, ${testsFailed} failed`);
    if (testsFailed === 0) {
      console.log('🎉 ALL STEP 3 BACKEND MEAL API TESTS PASSED!');
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
};

runTests();
