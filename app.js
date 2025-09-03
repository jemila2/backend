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

// Trust proxy - set this FIRST
app.set('trust proxy', 1);

// Simplified CORS Configuration
app.use(cors({
  origin: [
    'https://jemila2.github.io',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true
}));

// Middleware setup
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: 'Too many requests from this IP, please try again later',
  validate: false // Disable validation to prevent warnings
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Debugging middleware - log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request Body:', req.body);
  }
  next();
});

// Handle duplicate API prefix
app.use('/api/api', (req, res, next) => {
  console.log('Handling duplicate API prefix:', req.originalUrl);
  req.url = req.url.replace('/api', '');
  next();
});

// MongoDB Connection
const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGODB_URI;
    // Clean up MongoDB URI if needed
    if (mongoURI.includes('laundrycluster.xxbljuz.mongodb.net/Laundry?retryWrites=true&w=majoritylaundrycluster')) {
      mongoURI = mongoURI.replace('laundrycluster.xxbljuz.mongodb.net/Laundry?retryWrites=true&w=majoritylaundrycluster', 
        'laundrycluster.xxbljuz.mongodb.net/Laundry?retryWrites=true&w=majority');
    }
    
    console.log(`Attempting MongoDB connection to: ${mongoURI.replace(/:[^:]*@/, ':********@')}`);
    
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    return false;
  }
};

// BASIC ROUTES - Add these simple routes first to test
app.post('/api/users/register', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // For now, just return a success response without database operations
    res.status(201).json({
      success: true,
      message: 'User registered successfully (test mode)',
      data: {
        user: {
          id: 'test-id',
          name,
          email,
          phone,
          role: 'customer'
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Simple test response
    res.json({
      success: true,
      message: 'Login successful (test mode)',
      data: {
        user: {
          id: 'test-id',
          name: 'Test User',
          email,
          role: 'customer'
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Backend API server is running',
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      register: '/api/users/register',
      login: '/api/users/login'
    }
  });
});

// Serve static files if directory exists (AFTER API routes)
const buildPath = path.join(__dirname, 'client/build');
const cdclientBuildPath = path.join(__dirname, 'cdclient/build');

let staticPath = null;
if (fs.existsSync(buildPath)) {
  staticPath = buildPath;
  console.log('✅ Serving static files from client/build');
  app.use(express.static(staticPath));
} else if (fs.existsSync(cdclientBuildPath)) {
  staticPath = cdclientBuildPath;
  console.log('✅ Serving static files from cdclient/build');
  app.use(express.static(staticPath));
} else {
  console.log('ℹ️ Client build directory not found. API-only mode.');
}

// Handle client-side routing for all other routes (should be last)
if (staticPath) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// 404 handler for undefined API routes
app.all('/api/*', (req, res) => {
  console.log(`404: API endpoint not found: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found!`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Database connection and server startup
async function startServer() {
  try {
    const dbConnected = await connectDB();
    
    const PORT = process.env.PORT || 10000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log('Environment:', {
        NODE_ENV: process.env.NODE_ENV || 'development',
        DB: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
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
