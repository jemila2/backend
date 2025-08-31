
// const express = require('express');
// const router = express.Router();
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const {
//   register,
//   login,
//   getMe,
//   updateProfile,
//   changePassword,
//   getAllUsers,
//   forgotPassword,
//   verifyResetToken,
//   resetPassword
// } = require('../controllers/authController');
// const { protect, authorize } = require('../middleware/authMiddleware');
// const User = require('../models/UserModel');
// const Task = require('../models/Task');

// router.post('/register', register);
// router.post('/login', login);

// router.post('/forgot-password' );
// router.get('/verify-reset-token/:token');
// router.post('/reset-password');

// router.get('/users', async (req, res) => {
//   try {
//     const users = await User.find(); // Make sure this returns data
//     console.log('Fetched users:', users); // Debug log
//     res.json(users); // Ensure you're sending response
//   } catch (err) {
//     console.error('Error:', err);
//     res.status(500).json({ error: err.message });
//   }
// });


// router.get('/:id/tasks', protect, async (req, res) => {
//   // Prevent caching of task data
//   res.setHeader('Cache-Control', 'no-store');
  
//   // ... rest of your task fetching logic
// });


// router.get('/', async (req, res) => {
//   try {
//     const users = await User.find().select('-password');
    
//     // Set headers to prevent caching
//     res.set({
//       'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
//       'Pragma': 'no-cache',
//       'Expires': '0'
//     });
    
//     res.json({
//       success: true,
//       data: users
//     });
//   } catch (err) {
//     console.error('Error fetching users:', err);
//     res.status(500).json({
//       success: false,
//       error: 'Server error'
//     });
//   }
// });


// router.get('/me', protect, (req, res) => {
//   // Set headers to prevent caching
//   res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
//   res.setHeader('Pragma', 'no-cache');
//   res.setHeader('Expires', '0');
  
//   res.status(200).json({
//     success: true,
//     user: {
//       _id: req.user._id,
//       name: req.user.name,
//       email: req.user.email,
//       role: req.user.role
//       // Include other needed fields
//     }
//   });
// });

// router.put('/update', protect, updateProfile);
// router.put('/change-password', protect, changePassword);


// router.get('/tasks', protect, authorize('admin'), async (req, res) => {
//   try {
//     const tasks = await Task.find().populate('assignee', 'name email');
//     res.json({
//       success: true,
//       count: tasks.length,
//       data: tasks
//     });
//   } catch (err) {
//     console.error('Error fetching tasks:', err);
//     res.status(500).json({
//       success: false,
//       error: 'Server Error'
//     });
//   }
// });

// router.get('/:id', protect, authorize('admin'), async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id).select('-password');
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         error: 'User not found'
//       });
//     }
//     res.json({
//       success: true,
//       data: user
//     });
//   } catch (err) {
//     console.error('Error fetching user:', err);
//     res.status(500).json({
//       success: false,
//       error: 'Server Error'
//     });
//   }
// });

// router.put('/:id/role', protect, authorize('admin'), async (req, res) => {
//   try {
//     const { role } = req.body;
//     const validRoles = ['customer', 'employee', 'admin'];
    
//     if (!validRoles.includes(role)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid role'
//       });
//     }

//     const user = await User.findByIdAndUpdate(
//       req.params.id,
//       { role },
//       { new: true, runValidators: true }
//     ).select('-password');

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         error: 'User not found'
//       });
//     }

//     res.json({
//       success: true,
//       data: user
//     });
//   } catch (err) {
//     console.error('Error updating user role:', err);
//     res.status(500).json({
//       success: false,
//       error: 'Server Error'
//     });
//   }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const Admin = require('../models/');
const User = require('../models/UserModel');

// Admin registration
router.post('/admin/register-admin', async (req, res) => {
  try {
    const { name, email, password, secretKey } = req.body;

    // Check admin secret key
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({
        status: 'fail',
        message: 'Invalid admin secret key'
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        status: 'fail',
        message: 'Admin already exists with this email'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin
    const admin = new Admin({
      name,
      email,
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();

    // Generate token
    const token = jwt.sign(
      { userId: admin._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      status: 'success',
      message: 'Admin created successfully',
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists as admin
    let user = await Admin.findOne({ email });
    let role = 'admin';

    // If not admin, check if regular user
    if (!user) {
      user = await User.findOne({ email });
      role = 'user';
    }

    // If no user found
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Handle preflight requests for auth routes
router.options('/admin/register-admin', (req, res) => {
  res.status(200).end();
});

router.options('/login', (req, res) => {
  res.status(200).end();
});

module.exports = router;