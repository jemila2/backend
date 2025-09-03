// // const express = require('express');
// // const router = express.Router();
// // const {
// //   getAllUsers,
// //   getUser,
// //   createUser,
// //   updateUser,
// //   deleteUser,
// //   updateUserRole
// // } = require('../controllers/userController');
// // const { protect, authorize } = require('../middleware/authMiddleware');

// // const User = require('../models/UserModel');

// // router.get('/', async (req, res) => {
// //   try {
  
// //     const users = await User.find().select('-password');
// //     res.json(users);
// //   } catch (err) {
// //     console.error('Error fetching users:', err);
// //     res.status(500).json({ error: 'Server error' });
// //   }
// // });


// // router.route('/')
// //   .get(protect, authorize('admin'), getAllUsers)
// //   .post(protect, authorize('admin'), createUser);

// // router.route('/:id')
// //   .get(protect, authorize('admin'), getUser)
// //   .put(protect, authorize('admin'), updateUser)
// //   .delete(protect, authorize('admin'), deleteUser);

// // router.put('/:id/role', protect, authorize('admin'), updateUserRole);


// // router.get('/users', async (req, res) => {
// //   try {
// //     const users = await User.find(); 
// //     console.log('Fetched users:', users); 
// //     res.json(users); 
// //   } catch (err) {
// //     console.error('Error:', err);
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // module.exports = router;



// // In routes/userRoutes.js or similar
// const express = require('express');
// const router = express.Router();
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const User = require('../models/UserMode');

// // User registration endpoint
// router.post('/register', async (req, res) => {
//   try {
//     const { name, email, password, phone } = req.body;
    
//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ error: 'User already exists' });
//     }
    
//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 12);
    
//     // Create user
//     const user = new User({
//       name,
//       email,
//       password: hashedPassword,
//       phone,
//       role: 'customer'
//     });
    
//     await user.save();
    
//     // Generate token
//     const token = jwt.sign(
//       { userId: user._id },
//       process.env.JWT_SECRET,
//       { expiresIn: '24h' }
//     );
    
//     res.status(201).json({
//       success: true,
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role
//       }
//     });
    
//   } catch (error) {
//     console.error('Registration error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// module.exports = router;




const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const { protect, authorize } = require('../middleware/authMiddleware');

// POST /api/users/register - User registration
router.post('/register', async (req, res) => {
  const startTime = Date.now();
  console.log('Registration started at:', new Date().toISOString());
  
  try {
    const { name, email, password, phone } = req.body;
    console.log('Registration attempt:', { email });
    
    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Name, email, and password are required' 
      });
    }
    
    // Check if user already exists
    console.log('Checking for existing user...');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ 
        success: false,
        error: 'User already exists with this email' 
      });
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
      phone: phone || '',
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
      success: true,
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
    res.status(500).json({ 
      success: false,
      error: 'Server error during registration' 
    });
  }
});

// POST /api/users/login - User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error during login' 
    });
  }
});

// GET /api/users/me - Get current user profile
router.get('/me', protect, (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  res.status(200).json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// GET /api/users - Get all users (admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

module.exports = router;

