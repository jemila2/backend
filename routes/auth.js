

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getAllUsers,
  forgotPassword,
  verifyResetToken,
  resetPassword
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/UserModel');
const Task = require('../models/Task');

router.post('/register', register);
router.post('/login', login);

router.post('/forgot-password' );
router.get('/verify-reset-token/:token');
router.post('/reset-password');

router.get('/users', async (req, res) => {
  try {
    const users = await User.find(); // Make sure this returns data
    console.log('Fetched users:', users); // Debug log
    res.json(users); // Ensure you're sending response
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});


router.get('/:id/tasks', protect, async (req, res) => {
  // Prevent caching of task data
  res.setHeader('Cache-Control', 'no-store');
  
  // ... rest of your task fetching logic
});


router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    // Set headers to prevent caching
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json({
      success: true,
      data: users
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});


router.get('/me', protect, (req, res) => {
  // Set headers to prevent caching
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
      // Include other needed fields
    }
  });
});

router.put('/update', protect, updateProfile);
router.put('/change-password', protect, changePassword);


router.get('/tasks', protect, authorize('admin'), async (req, res) => {
  try {
    const tasks = await Task.find().populate('assignee', 'name email');
    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

router.put('/:id/role', protect, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['customer', 'employee', 'admin'];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

module.exports = router;