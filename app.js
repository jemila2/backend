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

// ✅ CRITICAL FIX: Trust proxy MUST be at the very top!
app.set('trust proxy', 1);

// Check required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
requiredEnvVars.forEach(env => {
  if (!process.env[env]) {
    console.error(`❌ FATAL: Missing required environment variable: ${env}`);
    process.exit(1);
  }
});

// Database connection function
const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;
    if (mongoUri.includes('mongodb+srv://') && mongoUri.includes(':')) {
      mongoUri = mongoUri.replace(/:(\d+)\//, '/');
    }
    
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    return false;
  }
};

// Enhanced CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://jemila2.github.io',
      'https://jemila2.github.io/cdtheclientt',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173'
    ];
    
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('github.io')) {
      callback(null, true);
    } else {
      console.warn('⚠️ CORS blocked request from origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

// ================= MIDDLEWARE SETUP =================
// Security middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('combined'));
}
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request Body:', req.body);
  }
  next();
});

// Fix for duplicate API paths - improved version
app.use((req, res, next) => {
  let originalUrl = req.originalUrl;
  
  // Fix duplicate /api/api/ patterns
  if (originalUrl.startsWith('/api/api/')) {
    const newUrl = originalUrl.replace('/api/api/', '/api/');
    console.log(`Redirecting duplicate API: ${originalUrl} -> ${newUrl}`);
    req.url = newUrl;
  }
  
  // Also handle cases where it might start with api/api without leading slash
  if (originalUrl.startsWith('api/api/')) {
    const newUrl = originalUrl.replace('api/api/', 'api/');
    console.log(`Redirecting duplicate API: ${originalUrl} -> ${newUrl}`);
    req.url = '/' + newUrl;
  }
  
  next();
});

// ✅ FIXED: Rate limiting with proper proxy configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: 'Too many requests from this IP, please try again later',
  validate: { 
    trustProxy: true,
    xForwardedForHeader: true
  },
  trustProxy: true,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// ================= TEMPORARY TEST ROUTES =================
// Add these test routes to verify everything works
app.post('/api/users/register', (req, res) => {
  console.log('✅ TEST Registration received:', req.body);
  res.json({
    success: true,
    message: 'TEST: Registration endpoint working!',
    user: {
      id: 'test-' + Date.now(),
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      role: 'customer'
    }
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint is working!',
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
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
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
      test: '/api/test'
    }
  });
});

// ================= ERROR HANDLING =================
// 404 handler for undefined API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `API endpoint ${req.originalUrl} not found!`,
    availableEndpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      test: '/api/test'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`❌ Server Error: ${err.message}`);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

// ================= SERVER STARTUP =================
const PORT = process.env.PORT || 10000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    const dbConnected = await connectDB();
    
    if (!dbConnected) {
      console.log('⚠️ Starting server in degraded mode (no database connection)');
    }
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log('Environment:', {
        NODE_ENV: process.env.NODE_ENV || 'development',
        DB: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
      });
      console.log('✅ Test endpoints available:');
      console.log('   GET  /api/health');
      console.log('   GET  /api/test');
      console.log('   POST /api/users/register');
    });

    process.on('SIGTERM', () => {
      console.log('⚠️ SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        console.log('✅ Process terminated!');
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
