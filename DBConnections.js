

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // ❌ REMOVE THIS LINE (problematic fallback):
    // const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Laundry';
    
    // ✅ REPLACE WITH THIS:
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    console.log('Attempting MongoDB connection to:', 
      MONGODB_URI.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://username:password@'));
    
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority'
    });

    console.log('✅ MongoDB Connected Successfully:', conn.connection.host);
    
    // MongoDB connection events
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to DB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ Mongoose disconnected from DB');
    });

    return mongoose;
  } catch (err) {
    console.error('❌ MongoDB Connection Failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
