/**
 * test-runner.js
 * Master Automated Test Orchestrator for Shree Tiffin Service
 * Enforces test isolation against `shree_tiffin_service_test` on dedicated port 5001
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { validateTestDatabase } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Enforce test environment and load .env.test
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.TEST_PORT = '5001';
process.env.TEST_URL = 'http://localhost:5001/api';
process.env.DOTENV_CONFIG_PATH = '.env.test';

dotenv.config({ path: path.join(__dirname, '.env.test') });

// 2. Strict Safety Guard: Refuse to run against production database
try {
  validateTestDatabase(process.env.MONGO_URI);
} catch (err) {
  console.error('\n❌ SAFETY CHECK ABORTED:');
  console.error(err.message);
  process.exit(1);
}

const TEST_FILES = [
  { name: 'Step 2: Authentication System', file: 'test-auth.js' },
  { name: 'Step 3: Meal Management System', file: 'test-meals.js' },
  { name: 'Step 4: Cart & Shopping System', file: 'test-cart.js' },
  { name: 'Step 5: Address System', file: 'test-addresses.js' },
  { name: 'Step 5: Checkout Validation', file: 'test-checkout.js' },
  { name: 'Step 6: Order Lifecycle', file: 'test-orders.js' },
  { name: 'Step 7: Payment System', file: 'test-payments.js' },
  { name: 'Step 8: Owner Operations & Delivery', file: 'test-step8-owner-delivery.js' },
  { name: 'Step 9: Owner Analytics & Business Reporting', file: 'test-step9-analytics.js' },
  { name: 'Step 10: Notifications, Business Settings & System Hardening', file: 'test-step10-production-hardening.js' },
  { name: 'Step 11: Production Deployment, Environment Separation, Observability & Final QA', file: 'test-step11-production.js' },
  { name: 'Step 12: Production Deployment & Verification', file: 'test-step12-deployment.js' },
  { name: 'Step 13: Production Payment UX + Mobile Responsiveness Hardening', file: 'test-step13-mobile-upi-hardening.js' },
  { name: 'Step 13A: Razorpay Credential + Real Test Gateway Verification', file: 'test-step13a-razorpay-verification.js' },
  { name: 'Step 15A: Owner Security & Client Onboarding Hardening', file: 'test-step15a-security.js' },
  { name: 'Step 16: Interactive Map & 15 KM Delivery Radius System', file: 'test-map-delivery-radius.js' }
];

// Helper to wait for server health and active database connection
const waitForHealth = async (url, maxRetries = 60, delayMs = 500) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.database === 'connected' || data.status === 'online') {
          // Give 2s for seedOwnerUser and seedMeals to settle in MongoDB Atlas
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return true;
        }
      }
    } catch {
      // ignore connection refused while server is booting
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
};

// Run a single test script in a child process
const runTestScript = (scriptName) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const child = spawn('node', [scriptName], {
      cwd: __dirname,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PORT: '5001',
        TEST_PORT: '5001',
        TEST_URL: 'http://localhost:5001/api',
        DOTENV_CONFIG_PATH: '.env.test'
      },
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      resolve({ code, duration });
    });

    child.on('error', (err) => {
      console.error(`Failed to execute ${scriptName}:`, err);
      resolve({ code: 1, duration: 0 });
    });
  });
};

const main = async () => {
  console.log('\n========================================================================');
  console.log('🧪 SHREE TIFFIN SERVICE — MASTER TEST RUNNER');
  console.log('   "Ghar Jaisa Khana, Har Din."');
  console.log('========================================================================');
  console.log(`🔒 Target Environment: NODE_ENV=${process.env.NODE_ENV}`);
  console.log(`🗄️  Target Database:    ${process.env.MONGO_URI ? process.env.MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'Undefined'}`);
  console.log(`🌐 Test Server URL:    ${process.env.TEST_URL}`);
  console.log('========================================================================\n');

  // 3. Start isolated test server
  console.log('⏳ Starting isolated test server on port 5001...');
  const testServer = spawn('node', ['server.js'], {
    cwd: __dirname,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: '5001',
      TEST_PORT: '5001',
      TEST_URL: 'http://localhost:5001/api',
      DOTENV_CONFIG_PATH: '.env.test'
    },
    stdio: ['inherit', 'pipe', 'pipe']
  });

  testServer.stdout.on('data', (data) => {
    // un-comment if needed for debugging
  });

  testServer.stderr.on('data', (data) => {
    process.stderr.write(`[Test Server Error] ${data}`);
  });

  let serverStarted = false;
  try {
    serverStarted = await waitForHealth('http://localhost:5001/api/health', 60, 500);
  } catch (err) {
    serverStarted = false;
  }

  if (!serverStarted) {
    console.error('❌ Test server failed to boot on port 5001 within timeout!');
    try { testServer.kill(); } catch {}
    process.exit(1);
  }

  console.log('✅ Test server is LIVE and healthy on port 5001.\n');

  // 3.5. Ensure clean default business settings in test database
  try {
    const ownerLogin = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@shreetiffin.com', password: 'Owner@12345' }),
    });
    if (ownerLogin.ok) {
      const { token } = await ownerLogin.json();
      await fetch('http://localhost:5001/api/settings/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          delivery: { deliveryFee: 0, minimumOrderValue: 0, deliveryRadius: 15 },
          ordering: { isAcceptingOrders: true },
        }),
      });
      console.log('🧹 Initialized clean default business settings for regression tests.\n');
    }
  } catch (resetErr) {
    // Non-fatal
  }

  const results = [];
  let allPassed = true;

  // 4. Run each test suite sequentially
  for (const test of TEST_FILES) {
    console.log(`\n▶️  RUNNING: ${test.name} (${test.file})...`);
    console.log('------------------------------------------------------------------------');
    const { code, duration } = await runTestScript(test.file);
    const passed = code === 0;
    if (!passed) allPassed = false;
    results.push({ ...test, passed, code, duration });
    console.log(`------------------------------------------------------------------------`);
    console.log(`${passed ? '✅' : '❌'} FINISHED: ${test.name} in ${duration}s (Exit code: ${code})\n`);
  }

  // 5. Cleanup test server process
  console.log('🛑 Shutting down isolated test server...');
  try {
    testServer.kill('SIGTERM');
  } catch (e) {
    // ignore
  }

  // 6. Print Summary Report
  console.log('\n========================================================================');
  console.log('📊 MASTER TEST SUMMARY REPORT');
  console.log('========================================================================');
  results.forEach((r, idx) => {
    const status = r.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`  ${idx + 1}. [${status}] ${r.name.padEnd(38)} (${r.duration}s)`);
  });
  console.log('========================================================================');

  if (allPassed) {
    console.log('🎉 ALL TEST SUITES PASSED CLEANLY ON TEST DATABASE (shree_tiffin_service_test)!');
    console.log('========================================================================\n');
    process.exit(0);
  } else {
    console.error('❌ SOME TEST SUITES FAILED! Check outputs above.');
    console.log('========================================================================\n');
    process.exit(1);
  }
};

main().catch((err) => {
  console.error('Unexpected error during test execution:', err);
  process.exit(1);
});
