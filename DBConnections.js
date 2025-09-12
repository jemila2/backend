const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGODB_URI;
    
    // Clean up any malformed URI (from first function)
    if (mongoURI.includes('laundrycluster.xxbljuz.mongodb.net/Laundry?retryWrites=true&w=majoritylaundrycluster')) {
      mongoURI = mongoURI.replace('laundrycluster.xxbljuz.mongodb.net/Laundry?retryWrites=true&w=majoritylaundrycluster', 
        'laundrycluster.xxbljuz.mongodb.net/Laundry?retryWrites=true&w=majority');
      console.log('🔄 Fixed malformed MongoDB URI');
    }
    
    // Log the connection attempt (with password hidden for security - from second function)
    const safeURI = mongoURI ? mongoURI.replace(/:[^@]*@/, ':********@') : 'Not set';
    console.log(`🔄 Attempting MongoDB connection to: ${safeURI}`);
    
    // Connection options (combined best practices)
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    
    // Detailed error information (from second function)
    if (error.name === 'MongoServerError') {
      console.error('🔐 AUTHENTICATION FAILED: Please check:');
      console.error('1. MongoDB username and password in your .env file');
      console.error('2. Password may need URL encoding if it contains special characters');
      console.error('3. User privileges in MongoDB Atlas');
      
      // Debug: Show the actual connection string (without password)
      const safeURI = process.env.MONGODB_URI ? 
        process.env.MONGODB_URI.replace(/:[^@]*@/, ':2jMSqpYQKuGMR75l@') : 'Not set';
      console.error(`4. Connection string used: ${safeURI}`);
      
    } else if (error.name === 'MongoNetworkError') {
      console.error('🌐 NETWORK ERROR: Please check:');
      console.error('1. Internet connection');
      console.error('2. MongoDB Atlas IP whitelist (add 0.0.0.0/0 temporarily)');
    } else {
      console.error('💡 Other error type:', error.name);
    }
    
    return false;
  }
};

module.exports = connectDB;
