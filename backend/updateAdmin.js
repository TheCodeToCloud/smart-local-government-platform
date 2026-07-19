/**
 * Script to create or update the admin user
 * Run: node updateAdmin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
  console.error('❌  Error: ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME must be set in .env');
  process.exit(1);
}

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅  Connected to MongoDB');

    // Remove old admin with old email if it exists
    const oldAdmin = await User.findOne({ email: 'alokguptagupta82@gmail.com' });
    if (oldAdmin) {
      await User.deleteOne({ email: 'alokguptagupta82@gmail.com' });
      console.log('🗑️  Removed old admin: alokguptagupta82@gmail.com');
    }

    // Check if new admin already exists
    let admin = await User.findOne({ email: ADMIN_EMAIL });

    if (admin) {
      // Update existing user to admin and reset password
      admin.role = 'admin';
      admin.password = ADMIN_PASSWORD;
      admin.fullName = ADMIN_NAME;
      await admin.save();
      console.log('='.repeat(50));
      console.log('✅  Admin user UPDATED successfully!');
    } else {
      // Create new admin user
      admin = await User.create({
        fullName: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        phone: '9800000000',
        role: 'admin',
        isActive: true,
      });
      console.log('='.repeat(50));
      console.log('🎉  Admin user CREATED successfully!');
    }

    console.log(`👤  Name     : ${admin.fullName}`);
    console.log(`📧  Email    : ${admin.email}`);
    console.log(`🔑  Role     : ${admin.role}`);
    console.log('='.repeat(50));
    console.log('Login at: http://localhost:5173/login');

  } catch (err) {
    console.error('❌  Error:', err.message);
  } finally {
    await mongoose.connection.close();
  }
};

run();
