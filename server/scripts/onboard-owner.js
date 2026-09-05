/**
 * onboard-owner.js
 * Secure Client Owner Onboarding CLI Tool for Shree Tiffin Service
 * "Ghar Jaisa Khana, Har Din."
 *
 * Usage:
 *   node server/scripts/onboard-owner.js --email owner@realbusiness.com --password "SecurePass@2026" --name "Ram Sharma" --phone "9826012345" [--deactivate-demo]
 *
 * Can also be configured via environment variables:
 *   ONBOARD_OWNER_EMAIL, ONBOARD_OWNER_PASSWORD, ONBOARD_OWNER_NAME, ONBOARD_OWNER_PHONE, DEACTIVATE_DEMO_OWNER
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--email' && args[i + 1]) {
      params.email = args[++i];
    } else if (arg === '--password' && args[i + 1]) {
      params.password = args[++i];
    } else if (arg === '--name' && args[i + 1]) {
      params.name = args[++i];
    } else if (arg === '--phone' && args[i + 1]) {
      params.phone = args[++i];
    } else if (arg === '--deactivate-demo') {
      params.deactivateDemo = true;
    }
  }

  // Fallback to environment variables if not passed in CLI
  return {
    email: (params.email || process.env.ONBOARD_OWNER_EMAIL || '').trim().toLowerCase(),
    password: params.password || process.env.ONBOARD_OWNER_PASSWORD || '',
    name: (params.name || process.env.ONBOARD_OWNER_NAME || '').trim(),
    phone: (params.phone || process.env.ONBOARD_OWNER_PHONE || '').trim().replace(/[\s-]/g, ''),
    deactivateDemo: params.deactivateDemo || process.env.DEACTIVATE_DEMO_OWNER === 'true',
  };
}

function validateInputs({ email, password, name, phone }) {
  if (!name || name.length < 2) {
    throw new Error('Owner name must be at least 2 characters long.');
  }

  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!email || !emailRegex.test(email)) {
    throw new Error('A valid owner email address is required.');
  }

  if (!phone || phone.length < 10 || phone.length > 15 || !/^\+?\d+$/.test(phone)) {
    throw new Error('A valid owner phone number (10 to 15 digits) is required.');
  }

  if (!password || password.length < 8) {
    throw new Error('Owner password must be at least 8 characters long for production security.');
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  if (!hasUpper || !hasLower || !hasDigit) {
    throw new Error('Owner password must contain at least one uppercase letter, one lowercase letter, and one number.');
  }
}

async function runOnboarding() {
  console.log('============================================================');
  console.log('🛡️  SHREE TIFFIN SERVICE — SECURE OWNER ONBOARDING TOOL');
  console.log('    "Ghar Jaisa Khana, Har Din."');
  console.log('============================================================\n');

  const config = parseArgs();

  try {
    validateInputs(config);
  } catch (validationErr) {
    console.error(`❌ Validation Error: ${validationErr.message}`);
    console.log('\nUsage:');
    console.log('  node server/scripts/onboard-owner.js --email <email> --password <password> --name <name> --phone <phone> [--deactivate-demo]\n');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to database...');
    await connectDB();

    // Check if account with email already exists
    let user = await User.findOne({ email: config.email });

    if (user) {
      console.log(`ℹ️  Found existing account for ${config.email}. Upgrading/updating owner credentials...`);
      user.name = config.name;
      user.phone = config.phone;
      user.password = config.password; // Mongoose pre-save hook handles bcrypt hashing
      user.role = 'owner';
      user.isActive = true;
      await user.save();
      console.log(`✅ Owner account updated successfully: ${user.email} (Role: ${user.role})`);
    } else {
      user = await User.create({
        name: config.name,
        email: config.email,
        phone: config.phone,
        password: config.password, // Mongoose pre-save hook handles bcrypt hashing
        role: 'owner',
        isActive: true,
      });
      console.log(`✅ New owner account provisioned successfully: ${user.email} (Role: ${user.role})`);
    }

    // Safely deactivate previous demo owner account if requested and different from new owner
    if (config.deactivateDemo && config.email !== 'owner@shreetiffin.com') {
      const demoOwner = await User.findOne({ email: 'owner@shreetiffin.com' });
      if (demoOwner && demoOwner.isActive) {
        demoOwner.isActive = false;
        await demoOwner.save();
        console.log('🔒 Demo owner account (owner@shreetiffin.com) has been safely deactivated (0 data deleted).');
      }
    }

    console.log('\n------------------------------------------------------------');
    console.log('🎉 ONBOARDING COMPLETE:');
    console.log(`   Owner Name:  ${user.name}`);
    console.log(`   Owner Email: ${user.email}`);
    console.log(`   Status:      Active (Verified Owner Role)`);
    console.log(`   Private URL: Access via /admin/login`);
    console.log('------------------------------------------------------------\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error(`💥 Onboarding failed: ${err.message}`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

runOnboarding();
