/**
 * test-step15a-security.js
 * Comprehensive automated test suite for Step 15A:
 * Owner/Admin Security & Client Onboarding Hardening
 * Shree Tiffin Service — "Ghar Jaisa Khana, Har Din."
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { seedOwnerUser } from './utils/seedOwner.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const API_BASE = process.env.TEST_URL || 'http://localhost:5001/api';

const runTests = async () => {
  console.log('====================================================================');
  console.log('🔒 RUNNING STEP 15A: OWNER SECURITY & CLIENT ONBOARDING TEST SUITE');
  console.log('   "Ghar Jaisa Khana, Har Din."');
  console.log('====================================================================\n');

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
    const timestamp = Date.now();
    const customerEmail = `sec_cust_${timestamp}@test.com`;
    const customerPassword = 'CustomerPass@12345';

    // ------------------------------------------------------------------------
    // TEST 1: Customer Registration Works Normally
    // ------------------------------------------------------------------------
    console.log('--- TEST 1: Customer Registration Works ---');
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Secured Customer',
        email: customerEmail,
        phone: '9826000001',
        password: customerPassword,
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, `Customer registration returns 201 Created (got ${regRes.status})`);
    assert(regData.success === true && regData.user?.role === 'customer', 'Registered user has role=customer');
    assert(Boolean(regData.token), 'Customer received JWT authentication token');
    const customerToken = regData.token;

    // ------------------------------------------------------------------------
    // TEST 2: Customer Cannot Register with role="owner" (Rejected)
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 2: Exploit Attempt: Register with role="owner" ---');
    const exploitOwnerRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Malicious Attacker',
        email: `hacker_owner_${timestamp}@test.com`,
        phone: '9826000002',
        password: 'HackerPassword@123',
        role: 'owner',
      }),
    });
    const exploitOwnerData = await exploitOwnerRes.json();
    assert(exploitOwnerRes.status === 403, `Registration with role=owner is strictly rejected with 403 Forbidden (got ${exploitOwnerRes.status})`);
    assert(exploitOwnerData.success === false, 'Malicious registration returned success: false');

    // ------------------------------------------------------------------------
    // TEST 3: Public Registration with role="admin" is Rejected
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 3: Exploit Attempt: Register with role="admin" ---');
    const exploitAdminRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Malicious Admin Attacker',
        email: `hacker_admin_${timestamp}@test.com`,
        phone: '9826000003',
        password: 'HackerPassword@123',
        role: 'admin',
      }),
    });
    const exploitAdminData = await exploitAdminRes.json();
    assert(exploitAdminRes.status === 403, `Registration with role=admin is strictly rejected with 403 Forbidden (got ${exploitAdminRes.status})`);
    assert(exploitAdminData.success === false, 'Malicious admin registration returned success: false');

    // ------------------------------------------------------------------------
    // TEST 4: Unauthenticated User Cannot Access Owner APIs (401)
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 4: Unauthenticated Access to Owner API ---');
    const unauthOrdersRes = await fetch(`${API_BASE}/orders`, {
      method: 'GET',
    });
    assert(unauthOrdersRes.status === 401, `Unauthenticated request to GET /api/orders returns 401 Unauthorized (got ${unauthOrdersRes.status})`);

    const unauthAnalyticsRes = await fetch(`${API_BASE}/analytics/overview`, {
      method: 'GET',
    });
    assert(unauthAnalyticsRes.status === 401, `Unauthenticated request to GET /api/analytics/overview returns 401 Unauthorized (got ${unauthAnalyticsRes.status})`);

    // ------------------------------------------------------------------------
    // TEST 5: Customer Token Cannot Access Owner APIs (403)
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 5: Customer Token Access to Owner API ---');
    const custOrdersRes = await fetch(`${API_BASE}/orders`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custOrdersRes.status === 403, `Customer token accessing GET /api/orders returns 403 Forbidden (got ${custOrdersRes.status})`);

    const custAnalyticsRes = await fetch(`${API_BASE}/analytics/overview`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(custAnalyticsRes.status === 403, `Customer token accessing GET /api/analytics/overview returns 403 Forbidden (got ${custAnalyticsRes.status})`);

    // ------------------------------------------------------------------------
    // TEST 6: Valid Owner Token Can Access Owner API (200)
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 6: Valid Owner Token Access to Owner API ---');
    const ownerEmail = process.env.OWNER_EMAIL || 'owner@shreetiffin.com';
    const ownerPassword = process.env.OWNER_PASSWORD || 'Owner@12345';
    const ownerLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ownerEmail,
        password: ownerPassword,
      }),
    });
    const ownerLoginData = await ownerLoginRes.json();
    assert(ownerLoginRes.status === 200, `Owner login succeeds with 200 OK (got ${ownerLoginRes.status})`);
    const ownerToken = ownerLoginData.token;
    assert(Boolean(ownerToken), 'Owner received valid JWT token');

    const ownerAnalyticsRes = await fetch(`${API_BASE}/analytics/overview`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(ownerAnalyticsRes.status === 200, `Owner token accessing GET /api/analytics/overview returns 200 OK (got ${ownerAnalyticsRes.status})`);

    // ------------------------------------------------------------------------
    // TEST 7: Owner-Only Dashboard Route is Protected
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 7: Owner Route Protection Verification ---');
    const adminRouteFile = fs.readFileSync(path.join(rootDir, 'client', 'src', 'components', 'AdminRoute.jsx'), 'utf-8');
    assert(adminRouteFile.includes('isOwner'), 'AdminRoute verifies isOwner authorization');
    assert(adminRouteFile.includes('/unauthorized') || adminRouteFile.includes('/admin/login'), 'AdminRoute redirects unauthorized customers');

    // ------------------------------------------------------------------------
    // TEST 8: No Owner Credentials Exist in Frontend Source Code
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 8: Frontend Source Credentials Scan ---');
    const clientSrcDir = path.join(rootDir, 'client', 'src');
    const scanDirForString = (dir, needle) => {
      let found = false;
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const f of files) {
        const fullPath = path.join(dir, f.name);
        if (f.isDirectory()) {
          if (scanDirForString(fullPath, needle)) found = true;
        } else if (/\.(jsx?|tsx?|html|css|json)$/i.test(f.name)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (content.toLowerCase().includes(needle.toLowerCase())) {
            found = true;
            break;
          }
        }
      }
      return found;
    };

    const hasOwnerDemoCred = scanDirForString(clientSrcDir, 'owner@12345');
    assert(!hasOwnerDemoCred, 'Zero occurrences of demo password in client/src source files');

    const adminLoginContent = fs.readFileSync(path.join(clientSrcDir, 'pages', 'AdminLogin.jsx'), 'utf-8');
    assert(!adminLoginContent.includes('owner@shreetiffin.com'), 'AdminLogin.jsx does not expose demo owner email');
    assert(!adminLoginContent.includes('Owner@12345'), 'AdminLogin.jsx does not expose demo owner password');
    assert(!adminLoginContent.includes('Fill Demo Owner'), 'AdminLogin.jsx contains no demo credential autofill button');

    // ------------------------------------------------------------------------
    // TEST 9: No Real/Demo Credentials in Public Documentation
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 9: Public Documentation Credentials Scan ---');
    const readmeContent = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf-8');
    assert(!readmeContent.includes('`Owner@12345`'), 'README.md does not contain plaintext owner password');
    assert(readmeContent.includes('Owner credentials are provisioned securely'), 'README.md directs to secure deployment provisioning');

    // ------------------------------------------------------------------------
    // TEST 10: Production Seed Cannot Create a Known-Password Owner
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 10: Production Seed Safety Guard ---');
    const origEnv = process.env.NODE_ENV;
    const origOwnerEmail = process.env.OWNER_EMAIL;
    const origOwnerPass = process.env.OWNER_PASSWORD;

    try {
      process.env.NODE_ENV = 'production';
      delete process.env.OWNER_EMAIL;
      delete process.env.OWNER_PASSWORD;

      const seedResult = await seedOwnerUser();
      assert(
        seedResult === null,
        'Production seed safely skips default owner auto-creation if OWNER_EMAIL or OWNER_PASSWORD are not explicitly set'
      );
    } finally {
      process.env.NODE_ENV = origEnv;
      if (origOwnerEmail) process.env.OWNER_EMAIL = origOwnerEmail;
      if (origOwnerPass) process.env.OWNER_PASSWORD = origOwnerPass;
    }

    // ------------------------------------------------------------------------
    // TEST 11: Owner Password is Never Returned by API
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 11: Password Scrubbing in API Responses ---');
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200, 'GET /api/auth/me succeeds for owner');
    assert(meData.user?.password === undefined, 'Owner password field is omitted from GET /api/auth/me');
    assert(ownerLoginData.user?.password === undefined, 'Owner password field is omitted from POST /api/auth/login response');

    // ------------------------------------------------------------------------
    // TEST 12: Customer UI Contains No Owner/Admin Login Links
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 12: Customer UI Owner Link Audit ---');
    const loginContent = fs.readFileSync(path.join(clientSrcDir, 'pages', 'Login.jsx'), 'utf-8');
    assert(!loginContent.includes('/admin/login'), 'Customer Login.jsx contains NO link to /admin/login');
    assert(!loginContent.includes('Kitchen Owner / Admin Login'), 'Customer Login.jsx contains NO Kitchen Owner link text');

    const navbarContent = fs.readFileSync(path.join(clientSrcDir, 'components', 'Navbar.jsx'), 'utf-8');
    // Check unauthenticated section of Navbar
    assert(!navbarContent.includes("to=\"/admin/login\">Owner"), 'Navbar unauthenticated desktop links do not contain Owner');
    assert(!navbarContent.includes("to=\"/admin/login\">Owner / Kitchen Login"), 'Navbar unauthenticated mobile drawer does not contain Owner login');

    console.log('\n====================================================================');
    console.log(`📊 STEP 15A SECURITY SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Fatal error during Step 15A tests:', error);
    process.exit(1);
  }
};

runTests();
