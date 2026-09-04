/**
 * test-step11-production.js
 * Automated Test Suite for Step 11: Production Deployment, Environment Separation, Observability & Final QA
 * Project: Shree Tiffin Service ("Ghar Jaisa Khana, Har Din.")
 * 
 * Strict Database Guard: Targets `shree_tiffin_service_test` on dedicated port 5001
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { validateTestDatabase } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Enforce test environment and load .env.test
process.env.NODE_ENV = 'test';
dotenv.config({ path: path.join(__dirname, '.env.test') });

const PORT = process.env.TEST_PORT || process.env.PORT || 5001;
const BASE_URL = `http://localhost:${PORT}/api`;
const ROOT_URL = `http://localhost:${PORT}`;

export const runStep11Tests = async () => {
  console.log('\n========================================================================');
  console.log('🚀 RUNNING STEP 11 AUTOMATED TEST SUITE: PRODUCTION & DEPLOYMENT QA');
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
    // -------------------------------------------------------------------
    // 1. DATABASE ISOLATION & PRODUCTION SAFETY GUARD
    // -------------------------------------------------------------------
    console.log('--- 1. DATABASE SAFETY GUARD & TEST ISOLATION ---');
    assert(process.env.NODE_ENV === 'test', 'NODE_ENV is strictly set to "test"');

    let refusedProd = false;
    try {
      validateTestDatabase('mongodb+srv://user:pass@cluster.mongodb.net/shree_tiffin_service');
    } catch (err) {
      refusedProd = err.message.includes('REFUSING TO RUN TESTS');
    }
    assert(refusedProd, 'Safety guard strictly refuses tests against production DB "shree_tiffin_service"');

    let allowedTestDb = false;
    try {
      validateTestDatabase('mongodb+srv://user:pass@cluster.mongodb.net/shree_tiffin_service_test');
      allowedTestDb = true;
    } catch {
      allowedTestDb = false;
    }
    assert(allowedTestDb, 'Safety guard permits connection to dedicated test DB "shree_tiffin_service_test"');

    // -------------------------------------------------------------------
    // 2. OBSERVABILITY: HEALTH & READINESS ENDPOINTS
    // -------------------------------------------------------------------
    console.log('\n--- 2. OBSERVABILITY: HEALTH & READINESS ENDPOINTS ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200, 'GET /api/health responds with 200 OK');
    assert(healthJson.status === 'online', 'Health endpoint reports service status "online"');
    assert(healthJson.database === 'connected', 'Health endpoint reports database status "connected"');
    assert(typeof healthJson.uptimeSeconds === 'number' && healthJson.uptimeSeconds >= 0, 'Health endpoint includes valid server uptime in seconds');
    assert(healthJson.appName === 'Shree Tiffin Service API', 'Health endpoint contains official appName');
    assert(healthJson.tagline === 'Ghar Jaisa Khana, Har Din.', 'Health endpoint contains official tagline');
    assert(typeof healthJson.memory?.rssMb === 'number', 'Health endpoint provides safe memory usage metrics');

    // Readiness endpoint
    const readyRes = await fetch(`${BASE_URL}/ready`);
    const readyJson = await readyRes.json();
    assert(readyRes.status === 200, 'GET /api/ready responds with 200 OK');
    assert(readyJson.ready === true, 'Readiness probe reports ready: true');
    assert(readyJson.database === 'connected', 'Readiness probe confirms database is connected');

    const healthReadyRes = await fetch(`${BASE_URL}/health/ready`);
    const healthReadyJson = await healthReadyRes.json();
    assert(healthReadyRes.status === 200 && healthReadyJson.ready === true, 'GET /api/health/ready responds with 200 OK and ready: true');

    // -------------------------------------------------------------------
    // 3. SECURITY HEADERS, CSP & TRACEABILITY
    // -------------------------------------------------------------------
    console.log('\n--- 3. SECURITY HEADERS & TRACEABILITY ---');
    const headers = healthRes.headers;
    assert(headers.get('x-content-type-options') === 'nosniff', 'X-Content-Type-Options is nosniff');
    assert(headers.get('x-frame-options') === 'DENY', 'X-Frame-Options is DENY');
    assert(headers.get('x-xss-protection') === '1; mode=block', 'X-XSS-Protection is 1; mode=block');
    assert(headers.get('referrer-policy') === 'strict-origin-when-cross-origin', 'Referrer-Policy is strict-origin-when-cross-origin');

    const csp = headers.get('content-security-policy') || '';
    assert(csp.includes('checkout.razorpay.com'), 'CSP whitelists Razorpay checkout gateway');
    assert(csp.includes('tile.openstreetmap.org'), 'CSP whitelists Leaflet OSM map tiles');

    // Request ID header traceability
    const reqId = headers.get('x-request-id');
    assert(typeof reqId === 'string' && reqId.length > 0, `X-Request-Id header is attached for traceability: ${reqId}`);

    // Custom incoming request ID is preserved
    const customReqId = 'test-trace-uuid-12345';
    const customTraceRes = await fetch(`${BASE_URL}/health`, {
      headers: { 'X-Request-Id': customReqId },
    });
    assert(customTraceRes.headers.get('x-request-id') === customReqId, 'Preserves incoming X-Request-Id across middleware chain');

    // -------------------------------------------------------------------
    // 4. SECRET SANITIZATION & SENSITIVE DATA PROTECTION
    // -------------------------------------------------------------------
    console.log('\n--- 4. SECRET LEAKAGE & SENSITIVE DATA AUDIT ---');
    const healthStr = JSON.stringify(healthJson);
    assert(!healthStr.includes('JWT_SECRET'), 'No JWT secret in health response');
    assert(!healthStr.includes('RAZORPAY_KEY_SECRET'), 'No Razorpay secret in health response');
    assert(!healthStr.includes('mongodb+srv://'), 'No database connection string in health response');
    assert(!healthStr.includes('password'), 'No passwords in health response');

    // Error response sanitization (no stack trace leaked)
    const notFoundRes = await fetch(`${BASE_URL}/non-existent-route-xyz-404`);
    const notFoundJson = await notFoundRes.json();
    assert(notFoundRes.status === 404, 'Unhandled endpoint responds with 404 Not Found');
    assert(notFoundJson.success === false, 'Error response reports success: false');
    assert(!JSON.stringify(notFoundJson).includes('    at '), 'Error response suppresses internal stack traces');

    // -------------------------------------------------------------------
    // 5. PRODUCTION DOCUMENTATION AUDIT
    // -------------------------------------------------------------------
    console.log('\n--- 5. PRODUCTION DOCUMENTATION AUDIT ---');
    const rootDir = path.join(__dirname, '..');
    const backupDocPath = path.join(rootDir, 'docs', 'PRODUCTION-BACKUP-RECOVERY.md');
    const deployDocPath = path.join(rootDir, 'docs', 'DEPLOYMENT.md');
    const checklistDocPath = path.join(rootDir, 'docs', 'PRODUCTION-CHECKLIST.md');
    const serverEnvExample = path.join(__dirname, '.env.example');
    const clientEnvExample = path.join(rootDir, 'client', '.env.example');

    assert(fs.existsSync(backupDocPath), 'docs/PRODUCTION-BACKUP-RECOVERY.md exists');
    assert(fs.existsSync(deployDocPath), 'docs/DEPLOYMENT.md exists');
    assert(fs.existsSync(checklistDocPath), 'docs/PRODUCTION-CHECKLIST.md exists');
    assert(fs.existsSync(serverEnvExample), 'server/.env.example exists');
    assert(fs.existsSync(clientEnvExample), 'client/.env.example exists');

    // Verify .env.example contains no real credentials
    const serverEnvContent = fs.readFileSync(serverEnvExample, 'utf8');
    assert(!serverEnvContent.includes('mongodb+srv://user:pass@'), 'server/.env.example uses clean placeholders');
    assert(serverEnvContent.includes('RAZORPAY_KEY_ID'), 'server/.env.example documents Razorpay configuration');

    // Verify .gitignore ignores all .env files
    const gitignorePath = path.join(rootDir, '.gitignore');
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    assert(gitignoreContent.includes('.env') && gitignoreContent.includes('!.env.example'), '.gitignore ignores .env files while tracking .env.example');

    // -------------------------------------------------------------------
    // 6. SPA ROUTING & CLIENT PRODUCTION BUILD VERIFICATION
    // -------------------------------------------------------------------
    console.log('\n--- 6. SPA ROUTING & PRODUCTION BUILD ARTIFACTS ---');
    const clientDistIndex = path.join(rootDir, 'client', 'dist', 'index.html');
    const clientDistRedirects = path.join(rootDir, 'client', 'dist', '_redirects');

    assert(fs.existsSync(clientDistIndex), 'client/dist/index.html production bundle exists');
    assert(fs.existsSync(clientDistRedirects), 'client/dist/_redirects SPA routing rule exists');

    if (fs.existsSync(clientDistRedirects)) {
      const redirectsContent = fs.readFileSync(clientDistRedirects, 'utf8');
      assert(redirectsContent.includes('/index.html') && redirectsContent.includes('200'), '_redirects contains valid SPA rewrite: /* /index.html 200');
    }

    // -------------------------------------------------------------------
    // 7. BUSINESS LOGIC INTEGRITY & REGRESSION CHECKS
    // -------------------------------------------------------------------
    console.log('\n--- 7. BUSINESS LOGIC & CORE SYSTEM INTEGRITY ---');
    // Public settings
    const settingsRes = await fetch(`${BASE_URL}/settings`);
    const settingsJson = await settingsRes.json();
    assert(settingsRes.status === 200, 'GET /api/settings responds with 200 OK');
    assert(settingsJson.data?.businessInfo?.tagline === 'Ghar Jaisa Khana, Har Din.', 'Public settings preserves official tagline');
    assert(typeof settingsJson.data?.isOpenNow === 'boolean', 'Public settings computes dynamic isOpenNow boolean');
    assert(typeof settingsJson.data?.delivery?.deliveryFee === 'number', 'Public settings provides deliveryFee');

    // Peak times endpoint (Step 9 regression)
    const ownerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@shreetiffin.com', password: 'Owner@12345' }),
    });
    const ownerLoginJson = await ownerLoginRes.json();
    assert(ownerLoginRes.status === 200 && !!ownerLoginJson.token, 'Owner successfully authenticates with seeded credentials');
    const ownerToken = ownerLoginJson.token;

    const peakTimesRes = await fetch(`${BASE_URL}/analytics/peak-times`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const peakTimesJson = await peakTimesRes.json();
    assert(peakTimesRes.status === 200, 'GET /api/analytics/peak-times returns 200 OK');
    assert(Array.isArray(peakTimesJson.data?.hours) && peakTimesJson.data.hours.length === 24, 'Analytics preserves 24-hour distribution');

    // Password reset single-use token security (Step 10 regression)
    const timestamp = Date.now();
    const customerEmail = `prod_test_${timestamp}@test.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Prod QA Customer',
        email: customerEmail,
        password: 'CustomerPassword@123',
        phone: '9876543299',
      }),
    });
    assert(regRes.status === 201, 'Customer registers successfully for token QA');

    const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: customerEmail }),
    });
    const forgotJson = await forgotRes.json();
    assert(forgotRes.status === 200 && typeof forgotJson.resetToken === 'string', 'Forgot password generates single-use reset token');

    const resetRes = await fetch(`${BASE_URL}/auth/reset-password/${forgotJson.resetToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'UpdatedSecurePassword@123' }),
    });
    assert(resetRes.status === 200, 'Password reset succeeds with valid token');

    const replayResetRes = await fetch(`${BASE_URL}/auth/reset-password/${forgotJson.resetToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'AnotherPassword@123' }),
    });
    assert(replayResetRes.status === 400, 'Token replay rejected: single-use token invalidated after use');

    // Notification unread count
    const customerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: customerEmail, password: 'UpdatedSecurePassword@123' }),
    });
    const customerToken = (await customerLoginRes.json()).token;
    const notifsRes = await fetch(`${BASE_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(notifsRes.status === 200, 'GET /api/notifications/unread-count responds with 200 OK');

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
    } catch {
      // ignore
    }

    // -------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------
    console.log('\n========================================================================');
    console.log(`📊 STEP 11 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================\n');

    return { passed, failed };
  } catch (error) {
    console.error('Fatal test error in Step 11:', error);
    return { passed, failed: failed + 1 };
  }
};

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('test-step11-production.js')) {
  runStep11Tests().then(({ failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}
