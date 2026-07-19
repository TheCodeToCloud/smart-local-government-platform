const mongoose = require('mongoose');

/**
 * Connects to MongoDB with an exponential backoff retry strategy.
 * Retries up to MAX_RETRIES times before crashing the process.
 * This prevents the app from dying immediately if MongoDB is briefly
 * unreachable during startup (e.g., Atlas cold start, network blip).
 */
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000; // 1 second base, doubles each time

const connectDB = async (attempt = 1) => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error('❌ MONGODB_URI is not defined in environment variables. Aborting.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);

    // ── Runtime reconnection event handlers ─────────────────────────────────
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Mongoose will attempt to reconnect automatically...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    // ── Graceful shutdown ────────────────────────────────────────────────────
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🛑 MongoDB connection closed due to app termination (SIGINT).');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await mongoose.connection.close();
      console.log('🛑 MongoDB connection closed due to app termination (SIGTERM).');
      process.exit(0);
    });

  } catch (error) {
    console.error(`❌ MongoDB Connection Failed (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`);

    if (attempt >= MAX_RETRIES) {
      console.error('❌ All MongoDB connection attempts exhausted. Shutting down.');
      process.exit(1);
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1);
    console.log(`⏳ Retrying MongoDB connection in ${delayMs / 1000}s...`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    return connectDB(attempt + 1);
  }
};

module.exports = { connectDB };
