/**
 * cleanup-e2e-data.js
 * Safe, multi-factor production data cleanup script for Step 18.
 * Shree Tiffin Service — "Ghar Jaisa Khana, Har Din."
 *
 * Usage:
 *   Dry run (read-only audit):
 *     node server/scripts/cleanup-e2e-data.js --dry-run
 *
 *   Confirmed execution:
 *     node server/scripts/cleanup-e2e-data.js --confirm
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: './server/.env' });

const TARGET_DB_NAME = 'shree_tiffin_service';
const E2E_EMAIL_DOMAIN = '@shreetiffin-verification.com';
const E2E_NAME_MARKER = 'STS E2E Test Customer';

const runCleanup = async () => {
  const isDryRun = !process.argv.includes('--confirm');
  const hasConfirm = process.argv.includes('--confirm');

  console.log('====================================================================');
  console.log('🧹 SHREE TIFFIN SERVICE — PRODUCTION E2E DATA CLEANUP');
  console.log('   "Ghar Jaisa Khana, Har Din."');
  console.log(`   Execution Mode: ${isDryRun ? '🔍 DRY RUN (Read-Only Audit — 0 Modifications)' : '🚨 CONFIRMED EXECUTION'}`);
  console.log('====================================================================\n');

  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('❌ SAFETY ERROR: No MONGO_URI configured in environment.');
      process.exit(1);
    }

    // Connect to database
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const dbName = mongoose.connection.name;

    // Safety Guard 1: Verify exact database name
    if (dbName !== TARGET_DB_NAME) {
      console.error(`❌ SAFETY ABORT: Connected database is "${dbName}". Cleanup MUST ONLY run against "${TARGET_DB_NAME}".`);
      await mongoose.disconnect();
      process.exit(1);
    }
    console.log(`🔒 Target Database Verified: "${dbName}"`);

    // Step 1: Identify E2E test customers using strict multi-factor criteria
    // Rule: email must end with @shreetiffin-verification.com AND name must contain E2E test marker
    const testCustomers = await db.collection('users').find({
      role: 'customer',
      email: { $regex: `@shreetiffin-verification\\.com$`, $options: 'i' },
      name: { $regex: E2E_NAME_MARKER, $options: 'i' },
    }).toArray();

    console.log(`\n1. Identified E2E Test Customers: ${testCustomers.length}`);
    testCustomers.forEach((c) => {
      const maskedEmail = c.email.replace(/(.{3})(.*)(@.*)/, '$1***$3');
      console.log(`   - User ID: ${c._id} | Email: ${maskedEmail} | Name: ${c.name} | Created: ${c.createdAt}`);
    });

    if (testCustomers.length === 0) {
      console.log('\n✅ No matching temporary E2E test customer records found. Database is already clean.');
      await mongoose.disconnect();
      return;
    }

    const testUserIds = testCustomers.map((c) => c._id);
    const testUserIdStrings = testUserIds.map((id) => id.toString());

    // Step 2: Identify addresses belonging strictly to test customers
    const testAddresses = await db.collection('addresses').find({
      $or: [
        { user: { $in: testUserIds } },
        { user: { $in: testUserIdStrings } },
      ],
    }).toArray();
    console.log(`\n2. Identified E2E Delivery Addresses: ${testAddresses.length}`);
    testAddresses.forEach((a) => {
      console.log(`   - Address ID: ${a._id} | User: ${a.user} | City: ${a.city} | Label: ${a.label}`);
    });
    const testAddressIds = testAddresses.map((a) => a._id);

    // Step 3: Identify carts belonging strictly to test customers
    const testCarts = await db.collection('carts').find({
      $or: [
        { user: { $in: testUserIds } },
        { user: { $in: testUserIdStrings } },
      ],
    }).toArray();
    console.log(`\n3. Identified E2E Carts: ${testCarts.length}`);
    testCarts.forEach((cart) => {
      console.log(`   - Cart ID: ${cart._id} | User: ${cart.user} | Items: ${cart.items?.length || 0}`);
    });
    const testCartIds = testCarts.map((c) => c._id);

    // Step 4: Identify orders belonging strictly to test customers
    const testOrders = await db.collection('orders').find({
      $or: [
        { user: { $in: testUserIds } },
        { user: { $in: testUserIdStrings } },
      ],
    }).toArray();
    console.log(`\n4. Identified E2E Orders: ${testOrders.length}`);
    testOrders.forEach((o) => {
      console.log(`   - Order ID: ${o._id} | #${o.orderNumber} | Total: ₹${o.total} | Status: ${o.orderStatus} | Method: ${o.paymentMethod}`);
    });
    const testOrderIds = testOrders.map((o) => o._id);
    const testOrderIdStrings = testOrderIds.map((id) => id.toString());

    // Step 5: Identify payments belonging strictly to test orders
    const testPayments = await db.collection('payments').find({
      $or: [
        { order: { $in: testOrderIds } },
        { order: { $in: testOrderIdStrings } },
        { user: { $in: testUserIds } },
        { user: { $in: testUserIdStrings } },
      ],
    }).toArray();
    console.log(`\n5. Identified E2E Payments: ${testPayments.length}`);
    testPayments.forEach((p) => {
      console.log(`   - Payment ID: ${p._id} | Order: ${p.order} | Amount: ₹${p.amount} | Gateway: ${p.gateway} | Status: ${p.status}`);
    });
    const testPaymentIds = testPayments.map((p) => p._id);

    // Step 6: Identify notifications belonging strictly to test customers
    const testNotifications = await db.collection('notifications').find({
      $or: [
        { user: { $in: testUserIds } },
        { user: { $in: testUserIdStrings } },
      ],
    }).toArray();
    console.log(`\n6. Identified E2E Notifications: ${testNotifications.length}`);
    const testNotificationIds = testNotifications.map((n) => n._id);

    // Summary of candidate records
    console.log('\n====================================================================');
    console.log('📋 CANDIDATE CLEANUP SUMMARY:');
    console.log(`   Notifications to remove: ${testNotificationIds.length}`);
    console.log(`   Payments to remove:      ${testPaymentIds.length}`);
    console.log(`   Orders to remove:        ${testOrderIds.length}`);
    console.log(`   Addresses to remove:     ${testAddressIds.length}`);
    console.log(`   Carts to remove:         ${testCartIds.length}`);
    console.log(`   Users to remove:         ${testUserIds.length}`);
    console.log('====================================================================\n');

    if (isDryRun) {
      console.log('🔍 DRY RUN COMPLETE: 0 database modifications were made.');
      console.log('   To permanently remove these temporary verification records, run:');
      console.log('   node server/scripts/cleanup-e2e-data.js --confirm\n');
      await mongoose.disconnect();
      return;
    }

    // Safety Guard 2: Must have explicit --confirm
    if (!hasConfirm) {
      console.error('❌ SAFETY ABORT: Destructive execution requires --confirm flag.');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('🚨 EXECUTING CONFIRMED DEPENDENT CLEANUP IN SAFE ORDER...');

    // Delete Notifications first
    if (testNotificationIds.length > 0) {
      const res = await db.collection('notifications').deleteMany({ _id: { $in: testNotificationIds } });
      console.log(`  ✅ Deleted ${res.deletedCount} notifications.`);
    }

    // Delete Payments belonging exclusively to E2E orders
    if (testPaymentIds.length > 0) {
      const res = await db.collection('payments').deleteMany({ _id: { $in: testPaymentIds } });
      console.log(`  ✅ Deleted ${res.deletedCount} payments.`);
    }

    // Delete Orders belonging exclusively to E2E customer
    if (testOrderIds.length > 0) {
      const res = await db.collection('orders').deleteMany({ _id: { $in: testOrderIds } });
      console.log(`  ✅ Deleted ${res.deletedCount} orders.`);
    }

    // Delete Addresses belonging exclusively to E2E customer
    if (testAddressIds.length > 0) {
      const res = await db.collection('addresses').deleteMany({ _id: { $in: testAddressIds } });
      console.log(`  ✅ Deleted ${res.deletedCount} addresses.`);
    }

    // Delete Carts belonging exclusively to E2E customer
    if (testCartIds.length > 0) {
      const res = await db.collection('carts').deleteMany({ _id: { $in: testCartIds } });
      console.log(`  ✅ Deleted ${res.deletedCount} carts.`);
    }

    // Delete E2E Customers
    if (testUserIds.length > 0) {
      const res = await db.collection('users').deleteMany({ _id: { $in: testUserIds } });
      console.log(`  ✅ Deleted ${res.deletedCount} test customer accounts.`);
    }

    console.log('\n🎉 E2E TEST DATA CLEANUP SUCCESSFULLY COMPLETED.');
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Cleanup execution failed:', err.message);
    process.exit(1);
  }
};

runCleanup();
