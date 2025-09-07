const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/UserModel');
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');


router.get('/', async (req, res) => {
  try {
  
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// In your userRoutes.js or similar file
router.post('/register', async (req, res) => {
  const startTime = Date.now();
  console.log('Registration started at:', new Date().toISOString());
  
  try {
    const { name, email, password, phone } = req.body;
    console.log('Registration attempt:', { email });
    
    // Check if user already exists
    console.log('Checking for existing user...');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ error: 'User already exists with this email' });
    }
    
    // Hash password
    console.log('Hashing password...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user
    console.log('Creating user...');
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'customer'
    });
    
    console.log('Saving user...');
    await user.save();
    
    // Generate token
    console.log('Generating token...');
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    const endTime = Date.now();
    console.log('Registration completed in:', endTime - startTime, 'ms');
    
    res.status(201).json({ 
      token, 
      user: { 
        id: user._id, 
        email: user.email, 
        name: user.name, 
        role: user.role 
      } 
    });
    
  } catch (error) {
    const endTime = Date.now();
    console.error('Registration error after', endTime - startTime, 'ms:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});


router.post('/register-admin', async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected. Please try again later.',
        status: 'database_error'
      });
    }

    const { name, email, password, secretKey } = req.body;

    // Check if any admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Admin account already exists. Only one admin is allowed.',
        status: 'admin_exists'
      });
    }

    // Validate secret key
    if (secretKey !== 'ADMIN_SETUP_2024') {
      return res.status(400).json({
        success: false,
        error: 'Invalid admin secret key',
        status: 'invalid_secret'
      });
    }

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required',
        status: 'missing_fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email',
        status: 'user_exists'
      });
    }

    // Create the one and only admin user
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const adminUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      emailVerified: true
    });

    await adminUser.save();

    // ✅ This will now work since generateAuthToken method exists
    const token = adminUser.generateAuthToken();

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      },
      token
    });

  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      status: 'server_error'
    });
  }
});

router.route('/')
  .get(protect, authorize('admin'), getAllUsers)
  .post(protect, authorize('admin'), createUser);

router.route('/:id')
  .get(protect, authorize('admin'), getUser)
  .put(protect, authorize('admin'), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

router.put('/:id/role', protect, authorize('admin'), updateUserRole);


router.get('/users', async (req, res) => {
  try {
    const users = await User.find(); 
    console.log('Fetched users:', users); 
    res.json(users); 
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
