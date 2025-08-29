

// const path = require('path');
// const fs = require('fs');
// require('dotenv').config({ path: path.resolve(__dirname, '.env') });
// const express = require('express');
// const mongoose = require('mongoose');
// const connectDB = require('./DBConnections');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const mongoSanitize = require('express-mongo-sanitize');
// const hpp = require('hpp');
// const xss = require('xss-clean');
// const cookieParser = require('cookie-parser');
// const morgan = require('morgan');
// const jwt = require('jsonwebtoken');

// const app = express();
// const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
// requiredEnvVars.forEach(env => {
//   if (!process.env[env]) {
//     console.error(` FATAL: Missing required environment variable: ${env}`);
//     process.exit(1);
//   }
// });

// const corsOptions = {
//   origin: function (origin, callback) {
//     const allowedOrigins = ['https://jemila2.github.io',
//        'http://localhost:5173',
//       'http://localhost:3000',];
//     if (!origin || allowedOrigins.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   }, // <- This closing bracket was missing
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//   allowedHeaders: [
//     'Content-Type', 
//     'Authorization', 
//     'Cache-Control',
//     'X-Requested-With',
//     'Accept',
//     'Origin'
//   ],
//   credentials: true,
//   optionsSuccessStatus: 200,
//   preflightContinue: false
// };
// app.use(express.static(path.join(__dirname, 'client/build')));
// app.use(cors(corsOptions));
// app.options('*', cors(corsOptions));
// app.use(helmet());
// app.use(mongoSanitize());
// app.use(xss());
// app.use(hpp());

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, 
//   max: 100, 
//   message: 'Too many requests from this IP, please try again later'
// });
// app.use('/api', limiter);
// app.use(express.json({
//   limit: '10mb',
//   verify: (req, res, buf) => {
//     try {
//       JSON.parse(buf.toString());
//     } catch (e) {
//       res.status(400).json({ error: 'Invalid JSON' });
//       throw new Error('Invalid JSON');
//     }
//   }
// }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// app.use(cookieParser());

// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
//   app.use((req, res, next) => {
//     console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
//     if (req.method === 'POST' || req.method === 'PUT') {
//       console.log('Request Body:', req.body);
//     }
//     next();
//   });
// }

// connectDB().then(() => {
//   console.log(' MongoDB connected successfully');
// }).catch(err => {
//   console.error(' MongoDB connection error:', err);
//   process.exit(1);
// });

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
// app.use('/api/auth', require('./routes/auth'));


// app.use('/api/employee-requests', employeeRequestsRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/users', authRoutes);
// app.use('/api/tasks', taskRoutes);
// app.use('/api/employees', employeeRoutes);
// app.use('/api/payments', paymentRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/employee-orders', employeeOrdersRouter);
// app.use('/api/suppliers', supplierRoutes);
// app.use('/api/purchase-orders', purchaseOrderRoutes);
// app.use('/api/payroll', payrollRoutes);
// app.use('/api/customers', customerRoutes);
// app.use('/api/invoices', invoiceRoutes);
// app.get('/api/data', (req, res) => {
//   res.json({ message: 'API response' });
// });

// // For any request that doesn't match API or static files, send React app
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
// });
// if (process.env.NODE_ENV === 'development') {
//   app.use((req, res, next) => {
//     res.set('Cache-Control', 'no-store');
//     next();
//   });
// }

// const uploadsDir = path.join(__dirname, 'uploads/invoices');
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }
// app.get('/api/health', (req, res) => {
//   res.status(200).json({
//     status: 'OK',
//     timestamp: new Date().toISOString(),
//     database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
//     memoryUsage: process.memoryUsage()
//   });
// });

// app.all('*', (req, res) => {
//   res.status(404).json({
//     status: 'fail',
//     message: `Can't find ${req.originalUrl} on this server!`
//   });
// });

// app.use((err, req, res, next) => {
//   if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
//     return res.status(400).json({ error: 'Invalid JSON body' });
//   }

//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || 'error';

//   console.error(` Error ${err.statusCode}: ${err.message}`);
//   if (process.env.NODE_ENV === 'development') {
//     console.error(err.stack);
//   }

//   res.status(err.statusCode).json({
//     status: err.status,
//     message: err.message,
//     ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
//   });
// });

// const PORT = process.env.PORT || 3001;
// const server = app.listen(PORT, () => {
//   console.log(` Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
//   console.log('Environment:', {
//     NODE_ENV: process.env.NODE_ENV,
//     DB: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
//   });
// });

// process.on('unhandledRejection', err => {
//   console.error('UNHANDLED REJECTION!  Shutting down...');
//   console.error(err.name, err.message);
//   server.close(() => {
//     process.exit(1);
//   });
// });

// process.on('uncaughtException', err => {
//   console.error('UNCAUGHT EXCEPTION!  Shutting down...');
//   console.error(err.name, err.message);
//   server.close(() => {
//     process.exit(1);
//   });
// });

// process.on('SIGTERM', () => {
//   console.log(' SIGTERM RECEIVED. Shutting down gracefully');
//   server.close(() => {
//     console.log(' Process terminated!');
//   });
// });




const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./DBConnections');
const cors = require('cors');                            
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');

const app = express();

// Check required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
requiredEnvVars.forEach(env => {
  if (!process.env[env]) {
    console.error(` FATAL: Missing required environment variable: ${env}`);
    process.exit(1);
  }
});

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://jemila2.github.io',
      'http://localhost:5173',
      // 'http://localhost:3000',
      'http://localhost:3001' // Add your backend port for development
    ];
    
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS blocked request from origin:', origin);
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
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Middleware setup
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
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

// Database connection
connectDB().then(() => {
  console.log(' MongoDB connected successfully');
}).catch(err => {
  console.error(' MongoDB connection error:', err);
  process.exit(1);
});

// Serve static files from React build (must come before routes)
app.use(express.static(path.join(__dirname, 'client/build')));

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

// API Routes (must come before the catch-all route)
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
app.get('/api/data', (req, res) => {
  res.json({ message: 'API response' });
});
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    memoryUsage: process.memoryUsage()
  });
});

// Test endpoint
app.get('/api/data', (req, res) => {
  res.json({ message: 'API response' });
});

// CATCH-ALL ROUTE - Must come after all API routes but before 404 handler
app.get('*', (req, res) => {
  // Check if the request is for an API endpoint
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      status: 'fail',
      message: `API endpoint ${req.originalUrl} not found`
    });
  }
  
  // For non-API requests, serve the React app
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Development caching
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
}

// File uploads directory setup
const uploadsDir = path.join(__dirname, 'uploads/invoices');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
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

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  console.error(` Error ${err.statusCode}: ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(` Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    DB: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Process event handlers
process.on('unhandledRejection', err => {
  console.error('UNHANDLED REJECTION!  Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION!  Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log(' SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log(' Process terminated!');
  });
});
