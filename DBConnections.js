
const mongoose = require('mongoose');

const connect_db = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Laundry', {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    
    // MongoDB connection events
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to DB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('Mongoose disconnected from DB');
    });

    return mongoose;
  } catch (err) {
    console.error(' Error in database connection:', err);
    throw err;
  }
};

module.exports = connect_db;
