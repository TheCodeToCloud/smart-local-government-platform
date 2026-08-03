/**
 * Quick script to make a user an officer
 * Run: node makeOfficer.js <email>
 * Example: node makeOfficer.js officer@smartgov.com
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const email = process.argv[2];

if (!email) {
  console.log('❌  Usage: node makeOfficer.js <email>');
  console.log('   Example: node makeOfficer.js officer@example.com');
  process.exit(1);
}

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅  Connected to MongoDB');

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      console.log(`❌  User with email "${email}" not found!`);
      process.exit(1);
    }

    if (user.role === 'officer') {
      console.log(`ℹ️   "${user.fullName}" is already an officer!`);
      process.exit(0);
    }

    user.role = 'officer';
    await user.save();

    console.log('='.repeat(50));
    console.log(`🎉  SUCCESS! Officer role granted!`);
    console.log(`👤  Name  : ${user.fullName}`);
    console.log(`📧  Email : ${user.email}`);
    console.log(`🔑  Role  : ${user.role}`);
    console.log('='.repeat(50));
    console.log('Now login at your website frontend /login');
    console.log('Officer panel: /officer');

  } catch (err) {
    console.error('❌  Error:', err.message);
  } finally {
    await mongoose.connection.close();
  }
};

run();
