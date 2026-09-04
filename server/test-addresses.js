// Automated API test suite for Step 5 Customer Address System
const BASE_URL = process.env.TEST_URL || 'http://localhost:5000/api';

const runAddressTests = async () => {
  console.log('--- STARTING STEP 5 ADDRESS SYSTEM TEST SUITE ---');
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
    const unauthGet = await fetch(`${BASE_URL}/addresses`);
    assert(unauthGet.status === 401, 'GET /api/addresses without token returns 401 Unauthorized');

    const unauthPost = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Nobody' }),
    });
    assert(unauthPost.status === 401, 'POST /api/addresses without token returns 401 Unauthorized');

    // 3. Register Customer A
    const customerAEmail = `cust_addr_a_${Date.now()}@example.com`;
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Purshottam Gurjar',
        email: customerAEmail,
        phone: '9876543210',
        password: 'Password@123',
      }),
    });
    const regDataA = await regResA.json();
    const tokenA = regDataA.token;
    assert(regResA.status === 201 && !!tokenA, 'Customer A registered successfully');

    // 4. Create Address 1 (Home in Indore, MP) -> should automatically become isDefault = true (first address)
    const addr1Payload = {
      label: 'Home',
      fullName: 'Purshottam Gurjar',
      phone: '9876543210',
      addressLine1: 'Flat 402, Shanti Heights',
      addressLine2: 'Scheme No 54',
      landmark: 'Near Bombay Hospital',
      city: 'Indore',
      state: 'Madhya Pradesh',
      postalCode: '452010',
      country: 'India',
      latitude: 22.7533,
      longitude: 75.8937,
      deliveryInstructions: 'Ring doorbell and hand to recipient',
    };
    const createRes1 = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify(addr1Payload),
    });
    const createData1 = await createRes1.json();
    const addr1 = createData1.data;
    assert(createRes1.status === 201 && createData1.success === true, 'POST /api/addresses (Create Address 1)');
    assert(addr1.isDefault === true, 'First address automatically set to default (isDefault: true)');
    assert(addr1.city === 'Indore' && addr1.postalCode === '452010', 'Address data preserved accurately');

    // 5. Create Address 2 (Office, with isDefault: true)
    const addr2Payload = {
      label: 'Office',
      fullName: 'Purshottam Gurjar',
      phone: '9876543210',
      addressLine1: 'Brilliant Titanium, 6th Floor',
      addressLine2: 'Vijay Nagar',
      landmark: 'Behind C21 Mall',
      city: 'Indore',
      state: 'Madhya Pradesh',
      postalCode: '452010',
      country: 'India',
      latitude: 22.7484,
      longitude: 75.8953,
      isDefault: true,
    };
    const createRes2 = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify(addr2Payload),
    });
    const createData2 = await createRes2.json();
    const addr2 = createData2.data;
    assert(createRes2.status === 201 && addr2.isDefault === true, 'POST /api/addresses (Create Address 2 with isDefault: true)');

    // 6. Verify single default address logic
    const getAddrsRes = await fetch(`${BASE_URL}/addresses`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getAddrsData = await getAddrsRes.json();
    assert(getAddrsData.count === 2, 'Customer A has 2 saved addresses');
    const defaultAddresses = getAddrsData.data.filter((a) => a.isDefault);
    assert(defaultAddresses.length === 1 && defaultAddresses[0]._id === addr2._id, 'Exactly one default address exists (Address 2)');

    // 7. Get single address by ID
    const getSingleRes = await fetch(`${BASE_URL}/addresses/${addr1._id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getSingleData = await getSingleRes.json();
    assert(getSingleRes.status === 200 && getSingleData.data.addressLine1 === addr1Payload.addressLine1, 'GET /api/addresses/:id');

    // 8. Update Address
    const updateRes = await fetch(`${BASE_URL}/addresses/${addr1._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ landmark: 'Opposite Bombay Hospital Gate 2' }),
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200 && updateData.data.landmark === 'Opposite Bombay Hospital Gate 2', 'PUT /api/addresses/:id (Update landmark)');

    // 9. Set Default Address via PATCH
    const patchDefRes = await fetch(`${BASE_URL}/addresses/${addr1._id}/default`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const patchDefData = await patchDefRes.json();
    assert(patchDefRes.status === 200 && patchDefData.data.isDefault === true, 'PATCH /api/addresses/:id/default sets Address 1 as default');

    // 10. Delete default address -> promotes another address to default
    const deleteRes = await fetch(`${BASE_URL}/addresses/${addr1._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(deleteRes.status === 200, 'DELETE /api/addresses/:id deletes Address 1');

    const remainingAddrsRes = await fetch(`${BASE_URL}/addresses`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const remainingAddrsData = await remainingAddrsRes.json();
    assert(remainingAddrsData.count === 1, 'Only Address 2 remains');
    assert(remainingAddrsData.data[0].isDefault === true, 'Address 2 promoted to default automatically upon deleting Address 1');

    // 11. Input Validation Tests
    // Missing fullName
    const valName = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ ...addr1Payload, fullName: '' }),
    });
    assert(valName.status === 400, 'Validation: missing fullName returns 400');

    // Invalid phone
    const valPhone = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ ...addr1Payload, phone: '123' }),
    });
    assert(valPhone.status === 400, 'Validation: invalid phone returns 400');

    // Missing addressLine1
    const valLine = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ ...addr1Payload, addressLine1: '' }),
    });
    assert(valLine.status === 400, 'Validation: missing addressLine1 returns 400');

    // Invalid latitude (> 90)
    const valLat = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ ...addr1Payload, latitude: 95.5 }),
    });
    assert(valLat.status === 400, 'Validation: invalid latitude (95.5 > 90) returns 400');

    // Invalid longitude (< -180)
    const valLng = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ ...addr1Payload, longitude: -195.0 }),
    });
    assert(valLng.status === 400, 'Validation: invalid longitude (-195 < -180) returns 400');

    // 12. Customer Ownership & Isolation Security Tests
    // Register Customer B
    const customerBEmail = `cust_addr_b_${Date.now()}@example.com`;
    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sneha Verma',
        email: customerBEmail,
        phone: '9876543222',
        password: 'Password@123',
      }),
    });
    const regDataB = await regResB.json();
    const tokenB = regDataB.token;

    // Customer B creates an address
    const createResB = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        label: 'Hostel',
        fullName: 'Sneha Verma',
        phone: '9876543222',
        addressLine1: 'Room 12, Girls PG',
        city: 'Bhopal',
        state: 'Madhya Pradesh',
        postalCode: '462001',
        latitude: 23.2599,
        longitude: 77.4126,
      }),
    });
    const addrB = (await createResB.json()).data;

    // Customer A attempts to GET Customer B's address
    const stealGet = await fetch(`${BASE_URL}/addresses/${addrB._id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(stealGet.status === 403, 'Security: Customer A cannot GET Customer B address (403 Forbidden)');

    // Customer A attempts to PUT Customer B's address
    const stealPut = await fetch(`${BASE_URL}/addresses/${addrB._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ addressLine1: 'Hacked Address' }),
    });
    assert(stealPut.status === 403, 'Security: Customer A cannot PUT Customer B address (403 Forbidden)');

    // Customer A attempts to DELETE Customer B's address
    const stealDel = await fetch(`${BASE_URL}/addresses/${addrB._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(stealDel.status === 403, 'Security: Customer A cannot DELETE Customer B address (403 Forbidden)');

    console.log('----------------------------------------------------');
    console.log(`STEP 5 ADDRESS TESTS COMPLETED: ${testsPassed} passed, ${testsFailed} failed`);
    console.log('----------------------------------------------------');
    if (testsFailed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error in address test suite:', error);
    process.exit(1);
  }
};

runAddressTests();
