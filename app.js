
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { createClient } = require('redis');

const app = express();

// ✅ FIX: Proper trust proxy setting for rate limiting
app.set('trust proxy', 1);

// Check required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI', 'REDIS_HOST', 'REDIS_PASSWORD']; 
requiredEnvVars.forEach(env => {
  if (!process.env[env]) {
    console.error(`❌ FATAL: Missing required environment variable: ${env}`);
    process.exit(1);
  }
});

// --- REDIS CLIENT SETUP ---
const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD,
});

// Handle connection errors
redisClient.on('error', (err) => console.log('❌ Redis Client Error:', err.message));
redisClient.on('connect', () => console.log('🟡 Attempting to connect to Redis...'));
redisClient.on('ready', () => console.log('✅ Redis Client Connected and Ready!'));

// --- DATABASE CONNECTION FUNCTION ---
const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;
    if (mongoUri.includes('mongodb+srv://') && mongoUri.includes(':')) {
      mongoUri = mongoUri.replace(/:(\d+)\//, '/');
    }
    
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      w: 'majority'
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    return false;
  }
};

// --- REDIS CONNECTION FUNCTION ---
const connectRedis = async () => {
  try {
    await redisClient.connect();
    // Test the connection
    await redisClient.set('server_start_time', new Date().toISOString());
    console.log('✅ Redis connection test successful.');
    return true;
  } catch (error) {
    console.error('❌ Redis Connection Failed:', error.message);
    return false;
  }
};

// Make the redisClient available to your entire app
app.set('redisClient', redisClient);

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://jemila2.github.io',
      'https://jemila2.github.io/cdclient-1',
      'http://localhost:3000',
      'http://localhost:10000',
      'http://localhost:5173',
      'https://cdclient-1.onrender.com',
      'https://laundrypro-backend-production.up.railway.app'
    ];
    
    if (!origin || 
        allowedOrigins.includes(origin) || 
        origin.includes('localhost') || 
        origin.includes('github.io') || 
        origin.includes('render.com') ||
        /^(http:\/\/)(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.).*$/.test(origin) ||
        process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn('⚠️ CORS blocked request from origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS middleware early
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Logging middleware
app.use(morgan('combined'));
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Fix for duplicate API paths
app.use((req, res, next) => {
  let originalUrl = req.originalUrl;
  if (originalUrl.startsWith('/api/api/')) {
    const newUrl = originalUrl.replace('/api/api/', '/api/');
    console.log(`Redirecting duplicate API: ${originalUrl} -> ${newUrl}`);
    return res.redirect(308, newUrl);
  }
  next();
});

// ✅ FIXED: Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/api/health' || 
           req.path === '/api/admin/admin-exists' ||
           req.path === '/api/admin/register-admin' ||
           req.path.startsWith('/api/auth/') ||
           req.path === '/mobile-access';
  }
});
app.use('/api', limiter);

// ================= TEMPORARY TEST ROUTES =================
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint is working!',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

app.get('/api/test-admin', (req, res) => {
  res.json({
    success: true,
    message: 'Admin test endpoint is working!',
    public: true,
    timestamp: new Date().toISOString()
  });
});

// ================= ROUTES =================
// Import routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employeeRoutes');
const orderRoutes = require('./routes/orderRoute');
const adminRoutes = require('./routes/admin');
const employeeOrdersRouter = require('./routes/employeeOrders');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const customerRoutes = require('./routes/customerRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');
const employeeRequestsRoutes = require('./routes/employeeRequests');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employee-requests', employeeRequestsRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employee-orders', employeeOrdersRouter);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);

// ================= HEALTH CHECK =================
app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  const redisStatus = redisClient.isReady ? 'Connected' : 'Disconnected';

  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    redis: redisStatus,
    memory: process.memoryUsage(),
    nodeVersion: process.version
  });
});

// ================= MOBILE ACCESS ROUTE =================
app.get('/mobile-access', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Mobile Access</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
        h1 { color: #333; }
        .container { max-width: 500px; margin: 0 auto; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Mobile Access Point</h1>
        <p>This endpoint is designed for mobile applications.</p>
        <p>Server status: <strong>OK</strong></p>
      </div>
    </body>
    </html>
  `);
});

// ================= ROOT ENDPOINT =================
app.get('/', (req, res) => {
  res.json({
    message: 'Backend API server is running',
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      admin: '/api/admin',
      test: '/api/test',
      testAdmin: '/api/test-admin',
      mobile: '/mobile-access'
    }
  });
});

// ================= ERROR HANDLING =================
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint ${req.originalUrl} not found!`,
    availableEndpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      admin: '/api/admin',
      test: '/api/test',
      mobile: '/mobile-access'
    }
  });
});

app.use((err, req, res, next) => {
  console.error(`❌ Server Error: ${err.message}`);
  console.error(err.stack);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ================= SERVER STARTUP =================
const PORT = process.env.PORT || 10000;

// Store server reference for graceful shutdown
let server;

const startServer = async () => {
  try {
    console.log('🔶 Starting server initialization...');
    
    // 1. Connect to MongoDB
    console.log('🟡 Connecting to MongoDB...');
    const dbConnected = await connectDB();
    
    // 2. Connect to Redis
    console.log('🟡 Connecting to Redis...');
    const redisConnected = await connectRedis();

    if (!dbConnected) {
      console.log('⚠️ Starting server in degraded mode (no database connection)');
    }
    if (!redisConnected) {
      console.log('⚠️ Starting server in degraded mode (no Redis connection)');
    }
    
    // 3. Start the Express server only after both connection attempts
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log('Environment:', process.env.NODE_ENV || 'development');
      console.log('Database:', mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected');
      console.log('Redis:', redisClient.isReady ? 'Connected' : 'Disconnected');
      console.log('✅ Test endpoints available:');
      console.log('   GET  /api/health');
      console.log('   GET  /api/test');
      console.log('   GET  /api/test-admin');
      console.log('   GET  /api/admin/admin-exists');
      console.log('   GET  /mobile-access');
    });

    // ================= GRACEFUL SHUTDOWN HANDLERS =================
    // SIGTERM handler for graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('⚠️ SIGTERM received. Shutting down gracefully...');
      
      // Close the server to stop accepting new connections
      server.close(async () => {
        console.log('✅ HTTP server closed.');
        
        // Close Redis connection
        if (redisClient.isOpen) {
          await redisClient.quit();
          console.log('✅ Redis connection closed.');
        }
        
        // Close MongoDB connection
        if (mongoose.connection.readyState === 1) {
          await mongoose.connection.close(false);
          console.log('✅ MongoDB connection closed.');
        }
        
        console.log('✅ Process terminated gracefully!');
        process.exit(0);
      });
      
      // Force shutdown after 10 seconds if graceful shutdown fails
      setTimeout(() => {
        console.log('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    });

    // SIGINT handler (Ctrl+C)
    process.on('SIGINT', async () => {
      console.log('⚠️ SIGINT received. Shutting down gracefully...');
      
      server.close(async () => {
        if (redisClient.isOpen) {
          await redisClient.quit();
        }
        if (mongoose.connection.readyState === 1) {
          await mongoose.connection.close(false);
        }
        console.log('✅ Process terminated gracefully!');
        process.exit(0);
      });
      
      setTimeout(() => {
        console.log('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      // Don't exit the process in production, just log
      if (process.env.NODE_ENV === 'development') {
        process.exit(1);
      }
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't exit the process in production, just log
      if (process.env.NODE_ENV === 'development') {
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;


// // const path = require('path');
// // const fs = require('fs');
// // require('dotenv').config({ path: path.resolve(__dirname, '.env') });
// // const express = require('express');
// // const mongoose = require('mongoose');
// // const cors = require('cors');
// // const helmet = require('helmet');
// // const rateLimit = require('express-rate-limit');
// // const mongoSanitize = require('express-mongo-sanitize');
// // const hpp = require('hpp');
// // const xss = require('xss-clean');
// // const cookieParser = require('cookie-parser');
// // const morgan = require('morgan');

// // const app = express();

// // // ✅ CRITICAL FIX: Trust proxy MUST be at the very top!
// // app.set('trust proxy', 1);

// // // Check required environment variables
// // const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
// // requiredEnvVars.forEach(env => {
// //   if (!process.env[env]) {
// //     console.error(`❌ FATAL: Missing required environment variable: ${env}`);
// //     process.exit(1);
// //   }
// // });

// // // Database connection function with increased timeout
// // const connectDB = async () => {
// //   try {
// //     let mongoUri = process.env.MONGODB_URI;
// //     if (mongoUri.includes('mongodb+srv://') && mongoUri.includes(':')) {
// //       mongoUri = mongoUri.replace(/:(\d+)\//, '/');
// //     }
    
// //     // Increased timeout options
// //     const conn = await mongoose.connect(mongoUri, {
// //       serverSelectionTimeoutMS: 30000, // 30 seconds
// //       socketTimeoutMS: 45000, // 45 seconds
// //       connectTimeoutMS: 30000, // 30 seconds
// //     });
// //     console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
// //     return true;
// //   } catch (error) {
// //     console.error('❌ MongoDB Connection Failed:', error.message);
// //     return false;
// //   }
// // };

// // // Enhanced CORS Configuration
// // const corsOptions = {
// //   origin: function (origin, callback) {
// //     const allowedOrigins = [
// //       'https://jemila2.github.io',
// //       'https://jemila2.github.io/cdclient-1',
// //       'http://localhost:3000',
// //       'http://localhost:3001',
// //       'http://localhost:5173'
// //     ];
    
// //     // Allow requests with no origin (like mobile apps, Postman, etc.)
// //     if (!origin || allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('github.io')) {
// //       callback(null, true);
// //     } else {
// //       console.warn('⚠️ CORS blocked request from origin:', origin);
// //       callback(new Error('Not allowed by CORS'));
// //     }
// //   },
// //   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
// //   allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
// //   credentials: true,
// //   optionsSuccessStatus: 200
// // };

// // // ================= MIDDLEWARE SETUP =================
// // // Security middleware
// // app.use(helmet());
// // app.use(mongoSanitize());
// // app.use(xss());
// // app.use(hpp());

// // // CORS middleware
// // app.use(cors(corsOptions));
// // app.options('*', cors(corsOptions));

// // // Body parsing middleware
// // app.use(express.json({
// //   limit: '10mb',
// //   verify: (req, res, buf) => {
// //     try {
// //       JSON.parse(buf.toString());
// //     } catch (e) {
// //       res.status(400).json({ error: 'Invalid JSON' });
// //       throw new Error('Invalid JSON');
// //     }
// //   }
// // }));
// // app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// // app.use(cookieParser());

// // // Logging middleware
// // if (process.env.NODE_ENV !== 'production') {
// //   app.use(morgan('combined'));
// // }
// // app.use((req, res, next) => {
// //   console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
// //   if (req.method === 'POST' || req.method === 'PUT') {
// //     console.log('Request Body:', req.body);
// //   }
// //   next();
// // });

// // // Fix for duplicate API paths - improved version
// // app.use((req, res, next) => {
// //   let originalUrl = req.originalUrl;
  
// //   // Fix duplicate /api/api/ patterns
// //   if (originalUrl.startsWith('/api/')) {
// //     const newUrl = originalUrl.replace('/api/');
// //     console.log(`Redirecting duplicate API: ${originalUrl} -> ${newUrl}`);
// //     req.url = newUrl;
// //   }
  
// //   // Also handle cases where it might start with api/api without leading slash
// //   if (originalUrl.startsWith('api/')) {
// //     const newUrl = originalUrl.replace('api/api/', 'api/');
// //     console.log(`Redirecting duplicate API: ${originalUrl} -> ${newUrl}`);
// //     req.url = '/' + newUrl;
// //   }
  
// //   next();
// // });

// // const limiter = rateLimit({
// //   windowMs: 15 * 60 * 1000, // 15 minutes
// //   max: 100, // limit each IP to 100 requests per windowMs
// //   message: 'Too many requests from this IP',
// //   standardHeaders: true, // Use standard headers
// //   legacyHeaders: false, // Disable legacy headers
// //   validate: { 
// //     xForwardedForHeader: false // Add this to fix the error
// //   }
// // });

// // app.use(limiter);

// // // Apply rate limiting to most API routes, but EXCLUDE auth routes
// // app.use('/api', (req, res, next) => {
// //   // Skip rate limiting for auth endpoints
// //   if (req.path.startsWith('/auth/')) {
// //     return next();
// //   }
// //   // Apply rate limiting to all other API endpoints
// //   limiter(req, res, next);
// // });

// // // ================= TEMPORARY TEST ROUTES =================
// // // Add these test routes to verify everything works
// // app.post('/api/users/register', (req, res) => {
// //   console.log('✅ TEST Registration received:', req.body);
// //   res.json({
// //     success: true,
// //     message: 'TEST: Registration endpoint working!',
// //     user: {
// //       id: 'test-' + Date.now(),
// //       name: req.body.name,
// //       email: req.body.email,
// //       phone: req.body.phone,
// //       role: 'customer'
// //     }
// //   });
// // });

// // app.get('/api/test', (req, res) => {
// //   res.json({
// //     success: true,
// //     message: 'Test endpoint is working!',
// //     timestamp: new Date().toISOString()
// //   });
// // });

// // // ================= ROUTES =================
// // // Import routes
// // const authRoutes = require('./routes/auth');
// // const employeeRoutes = require('./routes/employeeRoutes');
// // const orderRoutes = require('./routes/orderRoute');
// // const adminRoutes = require('./routes/admin');
// // const employeeOrdersRouter = require('./routes/employeeOrders');
// // const supplierRoutes = require('./routes/supplierRoutes');
// // const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
// // const payrollRoutes = require('./routes/payrollRoutes');
// // const customerRoutes = require('./routes/customerRoutes');
// // const invoiceRoutes = require('./routes/invoiceRoutes');
// // const paymentRoutes = require('./routes/paymentRoutes');
// // const taskRoutes = require('./routes/taskRoutes');
// // const userRoutes = require('./routes/userRoutes');
// // const employeeRequestsRoutes = require('./routes/employeeRequests');

// // // API Routes
// // app.use('/api/auth', authRoutes);
// // app.use('/api/users', userRoutes);
// // app.use('/api/employee-requests', employeeRequestsRoutes);
// // app.use('/api/tasks', taskRoutes);
// // app.use('/api/employees', employeeRoutes);
// // app.use('/api/payments', paymentRoutes);
// // app.use('/api/orders', orderRoutes);
// // app.use('/api/admin', adminRoutes);
// // app.use('/api/employee-orders', employeeOrdersRouter);
// // app.use('/api/suppliers', supplierRoutes);
// // app.use('/api/purchase-orders', purchaseOrderRoutes);
// // app.use('/api/payroll', payrollRoutes);
// // app.use('/api/customers', customerRoutes);
// // app.use('/api/invoices', invoiceRoutes);

// // // ================= HEALTH CHECK =================
// // app.get('/api/health', (req, res) => {
// //   res.status(200).json({
// //     status: 'OK',
// //     timestamp: new Date().toISOString(),
// //     uptime: process.uptime(),
// //     environment: process.env.NODE_ENV || 'development',
// //     database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
// //   });
// // });

// // // ================= ROOT ENDPOINT =================
// // app.get('/', (req, res) => {
// //   res.json({
// //     message: 'Backend API server is running',
// //     status: 'OK',
// //     timestamp: new Date().toISOString(),
// //     endpoints: {
// //       health: '/api/health',
// //       auth: '/api/auth',
// //       users: '/api/users',
// //       admin: '/api/admin',
// //       test: '/api/test'
// //     }
// //   });
// // });

// // // ================= ERROR HANDLING =================
// // // 404 handler for undefined API routes
// // app.all('/api/*', (req, res) => {
// //   res.status(404).json({
// //     status: 'fail',
// //     message: `API endpoint ${req.originalUrl} not found!`,
// //     availableEndpoints: {
// //       health: '/api/health',
// //       auth: '/api/auth',
// //       users: '/api/users',
// //       test: '/api/test'
// //     }
// //   });
// // });

// // // Error handling middleware
// // app.use((err, req, res, next) => {
// //   console.error(`❌ Server Error: ${err.message}`);
// //   res.status(500).json({
// //     status: 'error',
// //     message: 'Internal server error'
// //   });
// // });

// // // ================= SERVER STARTUP =================
// // const PORT = process.env.PORT || 10000;

// // const startServer = async () => {
// //   try {
// //     // Connect to MongoDB
// //     const dbConnected = await connectDB();
    
// //     if (!dbConnected) {
// //       console.log('⚠️ Starting server in degraded mode (no database connection)');
// //     }
    
// //     const server = app.listen(PORT, '0.0.0.0', () => {
// //       console.log(`🚀 Server running on port ${PORT}`);
// //       console.log('Environment:', {
// //         NODE_ENV: process.env.NODE_ENV || 'development',
// //         DB: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
// //       });
// //       console.log('✅ Test endpoints available:');
// //       console.log('   GET  /api/health');
// //       console.log('   GET  /api/test');
// //       console.log('   POST /api/users/register');
// //     });

// //     // Increase server timeout (if needed)
// //     server.timeout = 0; // 0 means no timeout

// //     process.on('SIGTERM', () => {
// //       console.log('⚠️ SIGTERM RECEIVED. Shutting down gracefully');
// //       server.close(() => {
// //         console.log('✅ Process terminated!');
// //       });
// //     });
// //   } catch (error) {
// //     console.error('❌ Failed to start server:', error);
// //     process.exit(1);
// //   }
// // };

// // // Start the server
// // startServer();






// const path = require('path');
// const fs = require('fs');
// require('dotenv').config({ path: path.resolve(__dirname, '.env') });
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const mongoSanitize = require('express-mongo-sanitize');
// const hpp = require('hpp');
// const xss = require('xss-clean');
// const cookieParser = require('cookie-parser');
// const morgan = require('morgan');

// const app = express();

// // ✅ CRITICAL FIX: Trust proxy for Render.com
// app.set('trust proxy', true);

// // Check required environment variables
// const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
// requiredEnvVars.forEach(env => {
//   if (!process.env[env]) {
//     console.error(`❌ FATAL: Missing required environment variable: ${env}`);
//     process.exit(1);
//   }
// });

// // Database connection function with increased timeout
// const connectDB = async () => {
//   try {
//     let mongoUri = process.env.MONGODB_URI;
//     if (mongoUri.includes('mongodb+srv://') && mongoUri.includes(':')) {
//       mongoUri = mongoUri.replace(/:(\d+)\//, '/');
//     }
    
//     // Increased timeout options
//     const conn = await mongoose.connect(mongoUri, {
//       serverSelectionTimeoutMS: 30000, // 30 seconds
//       socketTimeoutMS: 45000, // 45 seconds
//       connectTimeoutMS: 30000, // 30 seconds,
//       retryWrites: true,
//       w: 'majority'
//     });
//     console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
//     return true;
//   } catch (error) {
//     console.error('❌ MongoDB Connection Failed:', error.message);
//     return false;
//   }
// };

// const corsOptions = {
//   origin: function (origin, callback) {
//     const allowedOrigins = [
//       'https://jemila2.github.io',
//       'https://jemila2.github.io/cdclient-1',
//       'http://localhost:3000',
//       'http://localhost:3001',
//       'http://localhost:5173',
//       'https://cdclient-1.onrender.com'
//     ];
    
//     if (!origin || 
//         allowedOrigins.includes(origin) || 
//         origin.includes('localhost') || 
//         origin.includes('github.io') || 
//         origin.includes('render.com') ||
//         // Allow local network IP addresses (192.168.x.x, 10.x.x.x, 172.16.x.x)
//         /^(http:\/\/)(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.).*$/.test(origin) ||
//         // Allow all origins in development environment
//         process.env.NODE_ENV === 'development') {
//       callback(null, true);
//     } else {
//       console.warn('⚠️ CORS blocked request from origin:', origin);
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
//   credentials: true,
//   optionsSuccessStatus: 200
// };

// // Logging middleware
// app.use(morgan('combined'));
// app.use((req, res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
//   if (req.method === 'POST' || req.method === 'PUT') {
//     console.log('Request Body:', JSON.stringify(req.body, null, 2));
//   }
//   next();
// });

// // Fix for duplicate API paths
// app.use((req, res, next) => {
//   let originalUrl = req.originalUrl;
  
//   // Fix duplicate /api/api/ patterns
//   if (originalUrl.startsWith('/api/api/')) {
//     const newUrl = originalUrl.replace('/api/api/', '/api/');
//     console.log(`Redirecting duplicate API: ${originalUrl} -> ${newUrl}`);
//     return res.redirect(308, newUrl);
//   }
  
//   next();
// });

// // ✅ FIXED: Rate limiting configuration
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP',
//   standardHeaders: true,
//   legacyHeaders: false,
//   skip: (req) => {
//     // Skip rate limiting for health checks and admin endpoints
//     return req.path === '/api/health' || 
//            req.path === '/api/admin/admin-exists' ||
//            req.path === '/api/admin/register-admin' ||
//            req.path.startsWith('/api/auth/') ||
//            req.path === '/mobile-access'; // ✅ ADDED: Skip rate limiting for mobile access page
//   }
// });

// // Apply rate limiting to API routes (except excluded ones)
// app.use('/api', limiter);

// // ================= TEMPORARY TEST ROUTES =================
// // Add these test routes to verify everything works
// app.get('/api/test', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Test endpoint is working!',
//     timestamp: new Date().toISOString(),
//     database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
//   });
// });

// app.get('/api/test-admin', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Admin test endpoint is working!',
//     public: true,
//     timestamp: new Date().toISOString()
//   });
// });

// // ================= ROUTES =================
// // Import routes
// const authRoutes = require('./routes/auth');
// const employeeRoutes = require('./routes/employeeRoutes');
// const orderRoutes = require('./routes/orderRoute');
// const adminRoutes = require('./routes/admin');
// const employeeOrdersRouter = require('./routes/employeeOrders');
// const supplierRoutes = require('./routes/supplierRoutes');
// const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
// const payrollRoutes = require('./routes/payrollRoutes');
// const customerRoutes = require('./routes/customerRoutes');
// const invoiceRoutes = require('./routes/invoiceRoutes');
// const paymentRoutes = require('./routes/paymentRoutes');
// const taskRoutes = require('./routes/taskRoutes');
// const userRoutes = require('./routes/userRoutes');
// const employeeRequestsRoutes = require('./routes/employeeRequests');

// // API Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/employee-requests', employeeRequestsRoutes);
// app.use('/api/tasks', taskRoutes);
// app.use('/api/employees', employeeRoutes);
// app.use('/api/payments', paymentRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/admin', adminRoutes); // ✅ This is where your admin routes are mounted
// app.use('/api/employee-orders', employeeOrdersRouter);
// app.use('/api/suppliers', supplierRoutes);
// app.use('/api/purchase-orders', purchaseOrderRoutes);
// app.use('/api/payroll', payrollRoutes);
// app.use('/api/customers', customerRoutes);
// app.use('/api/invoices', invoiceRoutes);

// // ================= HEALTH CHECK =================
// app.get('/api/health', (req, res) => {
//   res.status(200).json({
//     status: 'OK',
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime(),
//     environment: process.env.NODE_ENV || 'development',
//     database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
//     memory: process.memoryUsage(),
//     nodeVersion: process.version
//   });
// });

// // ================= MOBILE ACCESS ROUTE =================
// // ✅ MOVED: Placed after API routes but before root endpoint
// app.get('/mobile-access', (req, res) => {
//   res.send(`
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>LaundryPro - Mobile Access</title>
//         <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
//         <style>
//             /* CSS styles remain the same as in your code */
//             * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
//             body { background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%); color: #1f2937; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 20px; }
//             /* ... rest of your CSS ... */
//         </style>
//     </head>
//     <body>
//         <!-- HTML content remains the same as in your code -->
//         <div class="container">
//             <div class="header">
//                 <div class="logo">Laundry<span>Pro</span></div>
//                 <p class="subtitle">Access your management portal on mobile</p>
//             </div>
            
//             <!-- ... rest of your HTML ... -->
//         </div>

//         <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
//         <script>
//             // JavaScript code remains the same as in your code
//         </script>
//     </body>
//     </html>
//   `);
// });

// // ================= ROOT ENDPOINT =================
// app.get('/', (req, res) => {
//   res.json({
//     message: 'Backend API server is running',
//     status: 'OK',
//     timestamp: new Date().toISOString(),
//     endpoints: {
//       health: '/api/health',
//       auth: '/api/auth',
//       users: '/api/users',
//       admin: '/api/admin',
//       test: '/api/test',
//       testAdmin: '/api/test-admin',
//       mobile: '/mobile-access' // ✅ ADDED: Include mobile access endpoint
//     }
//   });
// });

// // ================= ERROR HANDLING =================
// // 404 handler for undefined API routes
// app.all('/api/*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     error: `API endpoint ${req.originalUrl} not found!`,
//     availableEndpoints: {
//       health: '/api/health',
//       auth: '/api/auth',
//       users: '/api/users',
//       admin: '/api/admin',
//       test: '/api/test',
//       mobile: '/mobile-access' // ✅ ADDED: Include mobile access endpoint
//     }
//   });
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(`❌ Server Error: ${err.message}`);
//   console.error(err.stack);
  
//   res.status(500).json({
//     success: false,
//     error: 'Internal server error',
//     message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
//   });
// });

// // ================= SERVER STARTUP =================
// const PORT = process.env.PORT || 10000;

// const startServer = async () => {
//   try {
//     // Connect to MongoDB
//     const dbConnected = await connectDB();
    
//     if (!dbConnected) {
//       console.log('⚠️ Starting server in degraded mode (no database connection)');
//     }
    
//     const server = app.listen(PORT, '0.0.0.0', () => {
//       console.log(`🚀 Server running on port ${PORT}`);
//       console.log('Environment:', process.env.NODE_ENV || 'development');
//       console.log('Database:', mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected');
//       console.log('✅ Test endpoints available:');
//       console.log('   GET  /api/health');
//       console.log('   GET  /api/test');
//       console.log('   GET  /api/test-admin');
//       console.log('   GET  /api/admin/admin-exists');
//       console.log('   GET  /mobile-access'); // ✅ ADDED: Log mobile access endpoint
//     });

//     // Handle graceful shutdown
//     process.on('SIGTERM', () => {
//       console.log('⚠️ SIGTERM RECEIVED. Shutting down gracefully');
//       server.close(() => {
//         console.log('✅ Process terminated!');
//       });
//     });
//   } catch (error) {
//     console.error('❌ Failed to start server:', error);
//     process.exit(1);
//   }
// };

// // Start the server
// startServer();

// module.exports = app;
