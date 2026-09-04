// Automated API test suite for Step 2 Authentication & Authorization
const BASE_URL = process.env.TEST_URL || 'http://localhost:5000/api';

const runTests = async () => {
  console.log('--- STARTING STEP 2 AUTHENTICATION TEST SUITE ---');
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
    // 1. Check Health Endpoint
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.success === true, 'GET /api/health');

    // 2. Register New Customer
    const customerPayload = {
      name: 'Rahul Sharma',
      email: `rahul_${Date.now()}@example.com`,
      phone: '9876543210',
      password: 'Password@123',
    };
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerPayload),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.success === true, 'POST /api/auth/register (Success)');
    assert(regData.user && regData.user.role === 'customer', 'Role defaults to customer');
    assert(!regData.user.password, 'Password omitted from response');
    const customerToken = regData.token;

    // 3. Prevent Duplicate Registration
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerPayload),
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 400 && dupData.success === false, 'POST /api/auth/register (Duplicate Email rejected)');

    // 4. Customer Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: customerPayload.email, password: customerPayload.password }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.token, 'POST /api/auth/login (Valid credentials)');

    // 5. Invalid Password Login Rejection
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: customerPayload.email, password: 'WrongPassword' }),
    });
    assert(badLoginRes.status === 401, 'POST /api/auth/login (Invalid password rejected with 401)');

    // 6. Get Current User (/me) with Token
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.user.email === customerPayload.email, 'GET /api/auth/me (Protected route)');

    // 7. Update Profile (Name & Phone)
    const updateRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ name: 'Rahul S. Sharma', phone: '9123456780' }),
    });
    const updateData = await updateRes.json();
    assert(
      updateRes.status === 200 && updateData.user.name === 'Rahul S. Sharma' && updateData.user.phone === '9123456780',
      'PUT /api/auth/profile (Update Name & Phone)'
    );

    // 8. Customer Access to Owner-Only API (Must be 403 Forbidden)
    const ownerOnlyRes = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(ownerOnlyRes.status === 403, 'Customer denied access to Owner route (403 Forbidden)');

    // 9. Owner Login
    const ownerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@shreetiffin.com', password: 'Owner@12345' }),
    });
    const ownerLoginData = await ownerLoginRes.json();
    assert(ownerLoginRes.status === 200 && ownerLoginData.user.role === 'owner', 'Owner Login Successful');
    const ownerToken = ownerLoginData.token;

    // 10. Owner Access to Owner-Only API (Must be 200 OK)
    const ownerAccessRes = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const ownerAccessData = await ownerAccessRes.json();
    assert(
      ownerAccessRes.status === 200 && Array.isArray(ownerAccessData.users),
      'Owner authorized to access /api/users (200 OK)'
    );

    console.log(`\nRESULTS: ${testsPassed} passed, ${testsFailed} failed`);
    if (testsFailed === 0) {
      console.log('🎉 ALL BACKEND AUTH & AUTHORIZATION TESTS PASSED!');
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
};

runTests();
