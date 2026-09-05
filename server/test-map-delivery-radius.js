/**
 * test-map-delivery-radius.js - Automated test suite for Map System & 15 KM Delivery Radius
 * "Ghar Jaisa Khana, Har Din."
 * 
 * Target: shree_tiffin_service_test (PORT 5001)
 */

import {
  calculateHaversineDistanceKm,
  validateCoordinates,
  OFFICIAL_KITCHEN_COORDINATES,
} from './utils/distance.js';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5001/api';

const runTests = async () => {
  console.log('====================================================================');
  console.log('🗺️  STARTING MAP SYSTEM & 15 KM DELIVERY RADIUS TEST SUITE');
  console.log('   "Ghar Jaisa Khana, Har Din."');
  console.log('====================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, extra = '') => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName} ${extra}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${extra}`);
      failed++;
    }
  };

  try {
    // -------------------------------------------------------------------
    // 1. HAVERSINE DISTANCE & COORDINATE VALIDATION UNIT TESTS
    // -------------------------------------------------------------------
    console.log('--- 1. HAVERSINE DISTANCE & COORDINATE VALIDATION ---');

    // Official kitchen: 22.7648, 75.8976 (Scheme No 78, Vijay Nagar)
    const kLat = OFFICIAL_KITCHEN_COORDINATES.latitude;
    const kLng = OFFICIAL_KITCHEN_COORDINATES.longitude;

    // Test 1a: Zero distance to self
    const distSelf = calculateHaversineDistanceKm(kLat, kLng, kLat, kLng);
    assert(distSelf === 0, 'Distance from kitchen to self is exactly 0 km');

    // Test 1b: Nearby point (Bhawarkua, ~9 km away)
    // Bhawarkua coordinates: 22.6916, 75.8667
    const distBhawarkua = calculateHaversineDistanceKm(kLat, kLng, 22.6916, 75.8667);
    assert(distBhawarkua > 7 && distBhawarkua < 12, 'Calculates accurate distance to Bhawarkua', `(${distBhawarkua} km)`);

    // Test 1c: Near-boundary point (Rajendra Nagar, Indore: 22.6715, 75.8295 ~12.6 km away)
    const distRajendraNagar = calculateHaversineDistanceKm(kLat, kLng, 22.6715, 75.8295);
    assert(distRajendraNagar < 15, 'Identifies point inside 15 km delivery radius', `(${distRajendraNagar} km)`);

    // Test 1d: Far point (>15 km away - Mhow: 22.5539, 75.7628 is ~27 km away)
    const distMhow = calculateHaversineDistanceKm(kLat, kLng, 22.5539, 75.7628);
    assert(distMhow > 15, 'Identifies point outside 15 km delivery radius', `(${distMhow} km)`);

    // Test 1e: Coordinate validation
    const validCoord = validateCoordinates('22.7196', '75.8577');
    assert(validCoord.valid === true && validCoord.latitude === 22.7196 && validCoord.longitude === 75.8577, 'Valid coordinates parsed cleanly');

    const badLat = validateCoordinates(95.5, 75.0);
    assert(badLat.valid === false, 'Rejects latitude > 90 degrees');

    const badLng = validateCoordinates(22.0, -195.0);
    assert(badLng.valid === false, 'Rejects longitude < -180 degrees');

    const nanCoord = validateCoordinates('not_a_number', 75.0);
    assert(nanCoord.valid === false, 'Rejects NaN latitude');

    // -------------------------------------------------------------------
    // 2. PUBLIC LOCATION API ENDPOINTS
    // -------------------------------------------------------------------
    console.log('\n--- 2. PUBLIC LOCATION API ENDPOINTS ---');

    // Test 2a: GET /api/location/kitchen
    const kitchenRes = await fetch(`${BASE_URL}/location/kitchen`);
    const kitchenJson = await kitchenRes.json();
    assert(kitchenRes.status === 200 && kitchenJson.success === true, 'GET /api/location/kitchen returns 200 OK');
    assert(kitchenJson.data?.latitude === kLat && kitchenJson.data?.longitude === kLng, 'Returns official kitchen coordinates');
    assert(kitchenJson.data?.deliveryRadiusKm === 15, 'Returns 15 KM delivery radius');

    // Test 2b: GET /api/location/check-radius (within radius)
    const checkEligibleRes = await fetch(`${BASE_URL}/location/check-radius?lat=22.7500&lng=75.8900`);
    const checkEligibleJson = await checkEligibleRes.json();
    assert(checkEligibleRes.status === 200 && checkEligibleJson.data?.isEligible === true, 'GET /api/location/check-radius identifies eligible coordinates');
    assert(checkEligibleJson.data?.distanceKm < 15, 'Reports distance within 15 km limit');

    // Test 2c: GET /api/location/check-radius (outside radius)
    const checkIneligibleRes = await fetch(`${BASE_URL}/location/check-radius?lat=22.5539&lng=75.7628`);
    const checkIneligibleJson = await checkIneligibleRes.json();
    assert(checkIneligibleRes.status === 200 && checkIneligibleJson.data?.isEligible === false, 'GET /api/location/check-radius rejects coordinates beyond 15 km');
    assert(checkIneligibleJson.data?.distanceKm > 15, 'Reports distance exceeds 15 km limit');

    // Test 2d: GET /api/location/reverse
    const revRes = await fetch(`${BASE_URL}/location/reverse?lat=${kLat}&lng=${kLng}`);
    const revJson = await revRes.json();
    assert(revRes.status === 200 && revJson.success === true, 'GET /api/location/reverse returns 200 OK');
    assert(revJson.data?.city === 'Indore' || revJson.data?.state === 'Madhya Pradesh', 'Reverse geocode returns normalized location data');

    // Test 2e: GET /api/location/search
    const searchRes = await fetch(`${BASE_URL}/location/search?q=Vijay`);
    const searchJson = await searchRes.json();
    assert(searchRes.status === 200 && Array.isArray(searchJson.data), 'GET /api/location/search returns array of matches');

    // -------------------------------------------------------------------
    // 3. ADDRESS CREATION & DELIVERY RADIUS VALIDATION
    // -------------------------------------------------------------------
    console.log('\n--- 3. ADDRESS CREATION & RADIUS VALIDATION ---');

    // Register a test customer
    const timestamp = Date.now();
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Map Test Customer',
        email: `map_customer_${timestamp}@shreetiffin.com`,
        phone: '9876543210',
        password: 'Password@123',
      }),
    });
    const regJson = await regRes.json();
    const token = regJson.token;
    assert(regRes.status === 201 && !!token, 'Registered test customer for map verification');

    // Address A: Inside 15 KM (Vijay Nagar, 2 km from kitchen)
    const addrInsideRes = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        label: 'Home',
        fullName: 'Map Test Customer',
        phone: '9876543210',
        addressLine1: 'Flat 101, Scheme 54',
        addressLine2: 'Vijay Nagar',
        city: 'Indore',
        state: 'Madhya Pradesh',
        postalCode: '452010',
        latitude: 22.7533,
        longitude: 75.8937,
      }),
    });
    const addrInsideJson = await addrInsideRes.json();
    assert(addrInsideRes.status === 201 && !!addrInsideJson.data?._id, 'Created address within 15 km delivery radius');
    const eligibleAddressId = addrInsideJson.data?._id;

    // Address B: Outside 15 KM (Mhow / Pithampur area, 28 km away)
    const addrOutsideRes = await fetch(`${BASE_URL}/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        label: 'Other',
        fullName: 'Far Customer',
        phone: '9876543210',
        addressLine1: 'Main Road, Pithampur Industrial Area',
        city: 'Pithampur',
        state: 'Madhya Pradesh',
        postalCode: '454775',
        latitude: 22.6122,
        longitude: 75.6811,
      }),
    });
    const addrOutsideJson = await addrOutsideRes.json();
    assert(addrOutsideRes.status === 201 && !!addrOutsideJson.data?._id, 'Saved address records outside radius for checkout boundary testing');
    const outOfRadiusAddressId = addrOutsideJson.data?._id;

    // -------------------------------------------------------------------
    // 4. CHECKOUT SERVER-SIDE DELIVERY RADIUS ENFORCEMENT
    // -------------------------------------------------------------------
    console.log('\n--- 4. CHECKOUT 15 KM RADIUS SERVER-SIDE ENFORCEMENT ---');

    // Add a meal to cart
    const mealsRes = await fetch(`${BASE_URL}/meals`);
    const mealsJson = await mealsRes.json();
    const availableMeal = (mealsJson.data || mealsJson.meals || []).find((m) => m.isAvailable) || mealsJson[0];

    await fetch(`${BASE_URL}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        mealId: availableMeal._id,
        quantity: 1,
      }),
    });

    // Test 4a: Validate checkout with ELIGIBLE address (within 15 km)
    const checkoutEligibleRes = await fetch(`${BASE_URL}/checkout/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        addressId: eligibleAddressId,
      }),
    });
    const checkoutEligibleJson = await checkoutEligibleRes.json();
    assert(checkoutEligibleRes.status === 200 && checkoutEligibleJson.success === true, 'Checkout validation SUCCEEDS for address within 15 km radius');

    // Test 4b: Validate checkout with OUT-OF-RADIUS address (> 15 km)
    const checkoutIneligibleRes = await fetch(`${BASE_URL}/checkout/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        addressId: outOfRadiusAddressId,
      }),
    });
    const checkoutIneligibleJson = await checkoutIneligibleRes.json();
    assert(checkoutIneligibleRes.status === 400 && checkoutIneligibleJson.success === false, 'Checkout validation REJECTS address outside 15 km radius (HTTP 400)');
    assert(checkoutIneligibleJson.message?.includes('outside our 15 km delivery area'), 'Returns descriptive radius rejection message to customer');

    // Test 4c: Order placement REJECTS address outside 15 KM
    const orderRejectRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        addressId: outOfRadiusAddressId,
      }),
    });
    const orderRejectJson = await orderRejectRes.json();
    assert(orderRejectRes.status === 400 && orderRejectJson.success === false, 'Order creation REJECTS address outside 15 km boundary (HTTP 400)');

  } catch (error) {
    console.error('Test Suite Fatal Error:', error);
    failed++;
  }

  console.log('\n====================================================================');
  console.log(`📊 MAP & DELIVERY RADIUS TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests();
