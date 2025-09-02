

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

const app = express();

// Check required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
requiredEnvVars.forEach(env => {
  if (!process.env[env]) {
    console.error(`❌ FATAL: Missing required environment variable: ${env}`);
    process.exit(1);
  }
});

// Enhanced CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://jemila2.github.io/cdtheclientt/',
      'https://cdclient-6.onrender.com',
      'https://cdclient.vercel.app',
      'https://jemila2.github.io',
      'http://localhost:5173',
      'http://localhost:3001',
      'http://localhost:3000'
    ];
    
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('⚠️ CORS blocked request from origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Cache-Control',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware setup
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST' || req.method === 'PUT') {
      console.log('Request Body:', req.body);
    }
    next();
  });
}

// Serve static files from React build (if exists)
const buildPath = path.join(__dirname, 'client/build');
const cdclientBuildPath = path.join(__dirname, 'cdclient/build');

// Check which build directory exists
let staticPath = null;
if (fs.existsSync(buildPath)) {
  staticPath = buildPath;
  console.log('✅ Serving static files from client/build');
} else if (fs.existsSync(cdclientBuildPath)) {
  staticPath = cdclientBuildPath;
  console.log('✅ Serving static files from cdclient/build');
} else {
  console.log('ℹ️ Client build directory not found. API-only mode.');
}



// MongoDB Connection with improved error handling
const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGODB_URI;
    if (mongoURI.includes('laundrycluster.xxbljuz.mongodb.net/Laundry?retryWrites=true&w=majoritylaundrycluster')) {
      mongoURI = mongoURI.replace('laundrycluster.xxbljuz.mongodb.net/Laundry?retryWrites=true&w=majoritylaundrycluster', 
        'laundrycluster.xxbljuz.mongodb.net/Laundry?retryWrites=true&w=majority');
    }
    
    console.log(`Attempting MongoDB connection to: ${mongoURI.replace(/:[^:]*@/, ':********@')}`);
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    
    // Provide specific troubleshooting advice
    if (error.message.includes('ECONNREFUSED') || error.message.includes('querySrv')) {
      console.log('💡 Troubleshooting tips:');
      console.log('1. Check if your MongoDB Atlas cluster is running');
      console.log('2. Verify your connection string in the .env file');
      console.log('3. Check your network connection');
      console.log('4. Ensure your IP is whitelisted in MongoDB Atlas');
    }
    
    return false;
  }
};

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
app.use('/api/employee-requests', employeeRequestsRoutes);
app.use('/api/users', userRoutes);
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };
  
  res.status(200).json({
    status: 'OK',
    database: statusMap[dbStatus] || 'Unknown',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint
app.get('/api/test-cors', (req, res) => {
  res.json({
    message: 'CORS test successful!',
    timestamp: new Date().toISOString(),
    allowedOrigins: [
      'https://cdclient-6.onrender.com',
      'https://cdclient.vercel.app',
      'https://jemila2.github.io',
      'http://localhost:5173',
      'http://localhost:3001'
    ]
  });
});

// Add this to your server.js
app.get('/api/debug/db', (req, res) => {
  const states = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };
  
  res.json({
    dbState: states[mongoose.connection.readyState],
    readyState: mongoose.connection.readyState,
    dbHost: mongoose.connection.host,
    dbName: mongoose.connection.name
  });
});

// Root endpoint - FIX FOR "Cannot GET /" ERROR
app.get('/', (req, res) => {
  if (staticPath) {
    // If we have static files, serve the index.html
    res.sendFile(path.join(staticPath, 'index.html'));
  } else {
    // API-only mode response
    res.json({
      message: 'Backend API server is running',
      status: 'OK',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        admin: '/api/admin',
        users: '/api/users'
      }
    });
  }
});

// Serve static files if directory exists
if (staticPath) {
  app.use(express.static(staticPath));
  
  // Handle client-side routing for all other routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

 

// 404 handler for undefined API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `API endpoint ${req.originalUrl} not found!`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      status: 'fail',
      message: 'CORS policy: Request not allowed'
    });
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  console.error(`❌ Error ${err.statusCode}: ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// File uploads directory setup
const uploadsDir = path.join(__dirname, 'uploads/invoices');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}



// Database connection and server startup
async function startServer() {
  try {
    // Connect to MongoDB first
    const dbConnected = await connectDB();
    
    if (!dbConnected && process.env.NODE_ENV === 'production') {
      console.error('❌ Cannot start server without database connection in production');
      process.exit(1);
    }
    
    // Then start the server
    const PORT = process.env.PORT || 3001;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log('Environment:', {
        NODE_ENV: process.env.NODE_ENV,
        DB: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
      });
      
      if (!dbConnected) {
        console.log('⚠️ Server running in degraded mode (no database connection)');
      }
    });

    // Process event handlers
    process.on('unhandledRejection', err => {
      console.error('❌ UNHANDLED REJECTION! Shutting down...');
      console.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('uncaughtException', err => {
      console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
      console.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('SIGTERM', () => {
      console.log('⚠️ SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        console.log('✅ Process terminated!');
        mongoose.connection.close();
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
