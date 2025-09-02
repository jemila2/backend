
const mongoose = require('mongoose');


const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGODB_URI;
    
    // Clean up any malformed URI (fix common issues)
    if (mongoURI.includes('laundrycluster.xxbljuz.mongodb.net/Laundry?retryWrites=true&w=majoritylaundrycluster')) {
      mongoURI = 'mongodb+srv://jemilaabubakar9_db_user:gU3K9qKZlRbBfyIX@laundrycluster.xxbljuz.mongodb.net/Laundry?retryWrites=true&w=majority';
    }
    
    console.log(`Attempting MongoDB connection...`);
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increase to 30 seconds
      socketTimeoutMS: 45000,
      bufferCommands: false, // Disable buffering
      bufferMaxEntries: 0,
    });
    
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    console.error(`Connection URI: ${process.env.MONGODB_URI?.replace(/:[^:]*@/, ':********@')}`);
    
    if (error.message.includes('auth failed')) {
      console.log('💡 Authentication failed. Check your MongoDB username and password.');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('💡 DNS lookup failed. Check your MongoDB URI hostname.');
    } else if (error.message.includes('timed out')) {
      console.log('💡 Connection timed out. Check your network or MongoDB cluster status.');
    }
    
    return false;
  }
};

module.exports = connectDB;


// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Laundry', {
//       serverSelectionTimeoutMS: 5000,
//       socketTimeoutMS: 45000
//     });
    
//     // MongoDB connection events
//     mongoose.connection.on('connected', () => {
//       console.log('✅ Mongoose connected to DB');
//     });

//     mongoose.connection.on('error', (err) => {
//       console.error('❌ Mongoose connection error:', err.message);
//     });

//     mongoose.connection.on('disconnected', () => {
//       console.warn('⚠️ Mongoose disconnected from DB');
//     });

//     return mongoose;
//   } catch (err) {
//     console.error('❌ MongoDB Connection Failed:', err.message);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;
