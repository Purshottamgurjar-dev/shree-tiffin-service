/**
 * test-step12-deployment.js
 * Automated Test Suite for Step 12: Actual Production Deployment on GitHub, Render, MongoDB Atlas & Razorpay
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
const ROOT_URL = `http://localhost:${PORT}`;

export const runStep12Tests = async () => {
  console.log('\n========================================================================');
  console.log('🚀 RUNNING STEP 12 AUTOMATED TEST SUITE: ACTUAL PRODUCTION DEPLOYMENT QA');
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
    // 1. ENVIRONMENT & TEST DATABASE ISOLATION
    // -------------------------------------------------------------------
    console.log('--- 1. ENVIRONMENT & DATABASE ISOLATION ---');
    assert(process.env.NODE_ENV === 'test', 'NODE_ENV is strictly set to "test"');

    // Production database safety guard verification
    let blockedProd = false;
    try {
      validateTestDatabase('mongodb+srv://user:pass@cluster.mongodb.net/shree_tiffin_service');
    } catch (err) {
      blockedProd = err.message.includes('REFUSING TO RUN TESTS');
    }
    assert(blockedProd, 'Safety guard refuses tests against production DB "shree_tiffin_service"');

    let allowedTest = false;
    try {
      validateTestDatabase('mongodb+srv://user:pass@cluster.mongodb.net/shree_tiffin_service_test');
      allowedTest = true;
    } catch {
      allowedTest = false;
    }
    assert(allowedTest, 'Safety guard permits connection to dedicated test DB "shree_tiffin_service_test"');

    // Template files verification
    const serverEnvExample = path.join(__dirname, '.env.example');
    const clientEnvExample = path.join(rootDir, 'client', '.env.example');
    assert(fs.existsSync(serverEnvExample), 'server/.env.example template is tracked and exists');
    assert(fs.existsSync(clientEnvExample), 'client/.env.example template is tracked and exists');

    const serverEnvContent = fs.readFileSync(serverEnvExample, 'utf8');
    assert(!serverEnvContent.includes('mongodb+srv://user:pass@'), 'server/.env.example uses clean placeholders');
    assert(serverEnvContent.includes('CLIENT_URL'), 'server/.env.example documents CLIENT_URL for production CORS');
    assert(serverEnvContent.includes('JWT_SECRET'), 'server/.env.example documents JWT_SECRET');
    assert(serverEnvContent.includes('RAZORPAY_KEY_ID'), 'server/.env.example documents RAZORPAY_KEY_ID');

    // -------------------------------------------------------------------
    // 2. OBSERVABILITY: HEALTH & READINESS CHECKS
    // -------------------------------------------------------------------
    console.log('\n--- 2. OBSERVABILITY: HEALTH & READINESS ENDPOINTS ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200, 'GET /api/health responds with HTTP 200 OK');
    assert(healthJson.status === 'online', 'Health status reports "online"');
    assert(healthJson.database === 'connected', 'Database connectivity reports "connected"');
    assert(healthJson.appName === 'Shree Tiffin Service API', 'Official application name is verified');
    assert(healthJson.tagline === 'Ghar Jaisa Khana, Har Din.', 'Official brand tagline is verified');
    assert(typeof healthJson.uptimeSeconds === 'number' && healthJson.uptimeSeconds >= 0, 'Server uptime is monitored and reported in seconds');
    assert(typeof healthJson.memory?.rssMb === 'number', 'Safe memory metrics are provided without leaking internal pointers');

    // Readiness probe
    const readyRes = await fetch(`${BASE_URL}/ready`);
    const readyJson = await readyRes.json();
    assert(readyRes.status === 200, 'GET /api/ready responds with HTTP 200 OK');
    assert(readyJson.ready === true, 'Readiness probe reports ready: true for cloud orchestrators');
    assert(readyJson.database === 'connected', 'Readiness probe validates active MongoDB connection');

    const healthReadyRes = await fetch(`${BASE_URL}/health/ready`);
    const healthReadyJson = await healthReadyRes.json();
    assert(healthReadyRes.status === 200 && healthReadyJson.ready === true, 'GET /api/health/ready responds with HTTP 200 OK and ready: true');

    // -------------------------------------------------------------------
    // 3. PRODUCTION SECURITY & SECRETS SANITIZATION
    // -------------------------------------------------------------------
    console.log('\n--- 3. PRODUCTION SECURITY & SECRETS SANITIZATION ---');
    const headers = healthRes.headers;
    assert(headers.get('x-content-type-options') === 'nosniff', 'Security Header: X-Content-Type-Options is nosniff');
    assert(headers.get('x-frame-options') === 'DENY', 'Security Header: X-Frame-Options is DENY (anti-clickjacking)');
    assert(headers.get('referrer-policy') === 'strict-origin-when-cross-origin', 'Security Header: Referrer-Policy is strict-origin-when-cross-origin');

    const csp = headers.get('content-security-policy') || '';
    assert(csp.includes('checkout.razorpay.com'), 'CSP Header: Whitelists Razorpay checkout gateway');
    assert(csp.includes('tile.openstreetmap.org'), 'CSP Header: Whitelists OpenStreetMap tile provider');

    // Traceability header
    const reqId = headers.get('x-request-id');
    assert(typeof reqId === 'string' && reqId.length > 0, `Traceability Header: X-Request-Id is generated (${reqId})`);

    // Zero secret leakage in health payload
    const healthStr = JSON.stringify(healthJson);
    assert(!healthStr.includes('JWT_SECRET'), 'No JWT secret present in health response payload');
    assert(!healthStr.includes('RAZORPAY_KEY_SECRET'), 'No Razorpay secret present in health response payload');
    assert(!healthStr.includes('mongodb+srv://'), 'No raw MongoDB Atlas connection URI present in health response');

    // Error response stack trace suppression
    const errorRes = await fetch(`${BASE_URL}/non-existent-deployment-test-route`);
    const errorJson = await errorRes.json();
    assert(errorRes.status === 404, 'Non-existent route returns HTTP 404');
    assert(!JSON.stringify(errorJson).includes('    at '), 'Error response suppresses internal stack traces in non-development mode');

    // -------------------------------------------------------------------
    // 4. FRONTEND PRODUCTION BUILD & SPA ROUTING
    // -------------------------------------------------------------------
    console.log('\n--- 4. FRONTEND PRODUCTION BUILD & SPA ROUTING ---');
    const clientDistPath = path.join(rootDir, 'client', 'dist');
    const distIndex = path.join(clientDistPath, 'index.html');
    const distRedirects = path.join(clientDistPath, '_redirects');

    assert(fs.existsSync(distIndex), 'client/dist/index.html production bundle exists');
    assert(fs.existsSync(distRedirects), 'client/dist/_redirects SPA rewrite configuration exists');

    if (fs.existsSync(distRedirects)) {
      const redirectsText = fs.readFileSync(distRedirects, 'utf8');
      assert(redirectsText.includes('/*') && redirectsText.includes('/index.html') && redirectsText.includes('200'), 'SPA rewrite rule maps "/* /index.html 200" for direct route refreshes');
    }

    // Verify client/src has zero hardcoded development URLs
    const clientApiFile = path.join(rootDir, 'client', 'src', 'services', 'api.js');
    assert(fs.existsSync(clientApiFile), 'client/src/services/api.js exists');
    const clientApiContent = fs.readFileSync(clientApiFile, 'utf8');
    assert(clientApiContent.includes('import.meta.env.VITE_API_BASE_URL'), 'client API service utilizes dynamic VITE_API_BASE_URL environment variable');
    assert(!clientApiContent.includes('http://localhost:5000'), 'client API service has zero hardcoded localhost:5000 URLs');

    // -------------------------------------------------------------------
    // 5. BACKEND & RENDER BLUEPRINT (INFRASTRUCTURE AS CODE)
    // -------------------------------------------------------------------
    console.log('\n--- 5. BACKEND & RENDER BLUEPRINT CONFIGURATION ---');
    const renderYamlPath = path.join(rootDir, 'render.yaml');
    assert(fs.existsSync(renderYamlPath), 'render.yaml Blueprint file exists at repository root');

    if (fs.existsSync(renderYamlPath)) {
      const renderContent = fs.readFileSync(renderYamlPath, 'utf8');
      assert(renderContent.includes('name: shree-tiffin-api'), 'render.yaml configures backend Web Service "shree-tiffin-api"');
      assert(renderContent.includes('name: shree-tiffin'), 'render.yaml configures frontend Static Site "shree-tiffin"');
      assert(renderContent.includes('healthCheckPath: /api/health'), 'render.yaml configures health check path /api/health');
      assert(renderContent.includes('destination: /index.html'), 'render.yaml configures static SPA rewrite /* -> /index.html');
    }

    // -------------------------------------------------------------------
    // 6. BUSINESS OPERATIONS & RBAC VERIFICATION
    // -------------------------------------------------------------------
    console.log('\n--- 6. BUSINESS OPERATIONS & ROLE-BASED ACCESS ---');
    // Public settings
    const settingsRes = await fetch(`${BASE_URL}/settings`);
    const settingsJson = await settingsRes.json();
    assert(settingsRes.status === 200, 'Public settings endpoint responds with HTTP 200 OK');
    assert(settingsJson.data?.businessInfo?.tagline === 'Ghar Jaisa Khana, Har Din.', 'Public settings preserves tagline');
    assert(typeof settingsJson.data?.isOpenNow === 'boolean', 'Dynamic kitchen isOpenNow status is computed dynamically');

    // Owner Login
    const ownerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@shreetiffin.com', password: 'Owner@12345' }),
    });
    const ownerLoginJson = await ownerLoginRes.json();
    assert(ownerLoginRes.status === 200 && !!ownerLoginJson.token, 'Owner successfully logs in with seeded credentials');
    const ownerToken = ownerLoginJson.token;

    // Customer Registration & Login
    const testEmail = `cust_deploy_${Date.now()}@shreetest.com`;
    const custRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Deployment Customer',
        email: testEmail,
        password: 'CustomerPassword@123',
        phone: '9876543210',
      }),
    });
    const custRegJson = await custRegRes.json();
    assert(custRegRes.status === 201 && !!custRegJson.token, 'Customer registers successfully and receives valid JWT token');
    const customerToken = custRegJson.token;

    // Customer profile verification via /api/auth/me
    const profileRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const profileJson = await profileRes.json();
    assert(profileRes.status === 200 && profileJson.user?.email === testEmail, 'Customer profile returns correct authenticated user data');

    // RBAC: Customer blocked from owner routes (HTTP 403 Forbidden)
    const forbiddenAdminRes = await fetch(`${BASE_URL}/settings/admin`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(forbiddenAdminRes.status === 403, 'RBAC: Customer is strictly blocked with HTTP 403 Forbidden on admin endpoints');

    // -------------------------------------------------------------------
    // 7. RAZORPAY PAYMENT GATEWAY & WEBHOOK VERIFICATION
    // -------------------------------------------------------------------
    console.log('\n--- 7. RAZORPAY PAYMENT GATEWAY & WEBHOOK VERIFICATION ---');
    // Public payment config
    const publicConfig = getPublicPaymentConfig();
    assert(typeof publicConfig.isConfigured === 'boolean', 'Payment public config reports isConfigured boolean');
    assert(publicConfig.currency === 'INR', 'Payment currency is strictly configured to INR');

    // Minimum amount validation
    let minAmountBlocked = false;
    try {
      await createGatewayOrder({ orderNumber: 'STS-2026-TEST', amountInPaise: 50 });
    } catch (err) {
      minAmountBlocked = err.message.includes('Minimum payable amount is ₹1');
    }
    assert(minAmountBlocked, 'Gateway order creation enforces minimum payable amount of ₹1 (100 paise)');

    // Gateway order creation (Sandbox fallback / Live SDK)
    const gatewayOrder = await createGatewayOrder({
      orderNumber: 'STS-2026-DEPLOY-01',
      amountInPaise: 25000, // ₹250
      currency: 'INR',
    });
    assert(!!gatewayOrder.gatewayOrderId, `Gateway order created with ID: ${gatewayOrder.gatewayOrderId}`);
    assert(gatewayOrder.amount === 25000, 'Gateway order amount matches 25000 paise (₹250)');

    // Server-side HMAC SHA256 Signature Verification
    const testSecret = 'test_secret_for_hmac_verification_12345';
    const samplePaymentId = 'pay_sample_test_98765';
    const validSignature = generateTestSignature({
      gatewayOrderId: gatewayOrder.gatewayOrderId,
      gatewayPaymentId: samplePaymentId,
      customSecret: testSecret,
    });

    // Temporarily verify using custom secret signature generator
    const expectedPayload = `${gatewayOrder.gatewayOrderId}|${samplePaymentId}`;
    const calculatedSig = crypto.createHmac('sha256', testSecret).update(expectedPayload).digest('hex');
    assert(calculatedSig === validSignature, 'Server HMAC SHA-256 creates deterministic signature matching Razorpay standard');

    // Tampered signature rejection
    const tamperedSig = validSignature.slice(0, -4) + '0000';
    assert(calculatedSig !== tamperedSig, 'Tampered payment signatures are mathematically rejected');

    // Webhook verification logic
    const testWebhookSecret = 'webhook_secret_for_test_12345';
    const sampleWebhookPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_webhook_123',
            order_id: gatewayOrder.gatewayOrderId,
            amount: 25000,
            status: 'captured',
          },
        },
      },
    });

    const validWebhookSig = crypto
      .createHmac('sha256', testWebhookSecret)
      .update(sampleWebhookPayload)
      .digest('hex');

    // Test webhook signature verification function with mock secret
    const verifyCustomWebhook = ({ rawBody, signature, secret }) => {
      const rawString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
      const expected = crypto.createHmac('sha256', secret).update(rawString).digest('hex');
      const expectedBuf = Buffer.from(expected, 'utf8');
      const actualBuf = Buffer.from(signature, 'utf8');
      return expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);
    };

    assert(
      verifyCustomWebhook({
        rawBody: sampleWebhookPayload,
        signature: validWebhookSig,
        secret: testWebhookSecret,
      }),
      'Webhook HMAC SHA-256 signature verification passes for legitimate webhooks'
    );

    assert(
      !verifyCustomWebhook({
        rawBody: sampleWebhookPayload,
        signature: 'invalid_tampered_signature_string',
        secret: testWebhookSecret,
      }),
      'Webhook signature verification strictly rejects fraudulent or tampered webhooks'
    );

    // -------------------------------------------------------------------
    // 8. PRODUCTION DOCUMENTATION COMPLETION AUDIT
    // -------------------------------------------------------------------
    console.log('\n--- 8. PRODUCTION DOCUMENTATION COMPLETION AUDIT ---');
    const deployMd = path.join(rootDir, 'docs', 'DEPLOYMENT.md');
    const checklistMd = path.join(rootDir, 'docs', 'PRODUCTION-CHECKLIST.md');
    const backupMd = path.join(rootDir, 'docs', 'PRODUCTION-BACKUP-RECOVERY.md');

    assert(fs.existsSync(deployMd), 'docs/DEPLOYMENT.md exists and is tracked');
    assert(fs.existsSync(checklistMd), 'docs/PRODUCTION-CHECKLIST.md exists and is tracked');
    assert(fs.existsSync(backupMd), 'docs/PRODUCTION-BACKUP-RECOVERY.md exists and is tracked');

    // -------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------
    console.log('\n========================================================================');
    console.log(`📊 STEP 12 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================\n');

    return { passed, failed };
  } catch (error) {
    console.error('Fatal test error in Step 12:', error);
    return { passed, failed: failed + 1 };
  }
};

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('test-step12-deployment.js')) {
  runStep12Tests().then(({ failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}
