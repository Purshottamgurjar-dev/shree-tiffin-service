import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

dotenv.config();

export const seedOwnerUser = async () => {
  try {
    const ownerEmail = (process.env.OWNER_EMAIL || 'owner@shreetiffin.com').toLowerCase().trim();
    const ownerPassword = process.env.OWNER_PASSWORD || 'Owner@12345';
    const ownerName = process.env.OWNER_NAME || 'Shree Kitchen Owner';
    const ownerPhone = process.env.OWNER_PHONE || '9876543210';

    // Check if an owner account already exists
    const existingOwner = await User.findOne({ 
      $or: [{ email: ownerEmail }, { role: 'owner' }] 
    });

    if (existingOwner) {
      console.log(`[Seed] Owner account already exists (${existingOwner.email}). Skipping creation.`);
      return existingOwner;
    }

    // Create owner
    const owner = await User.create({
      name: ownerName,
      email: ownerEmail,
      phone: ownerPhone,
      password: ownerPassword,
      role: 'owner',
      isActive: true,
    });

    console.log(`[Seed] Successfully created owner account: ${owner.email}`);
    return owner;
  } catch (error) {
    console.error(`[Seed Error] Failed to seed owner: ${error.message}`);
    throw error;
  }
};

// If run directly from CLI (e.g. node utils/seedOwner.js)
if (process.argv[1]?.endsWith('seedOwner.js')) {
  (async () => {
    try {
      await connectDB();
      await seedOwnerUser();
      console.log('[Seed] Seeding completed.');
      process.exit(0);
    } catch (err) {
      console.error('[Seed Error]', err);
      process.exit(1);
    }
  })();
}
