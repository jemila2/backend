// const express = require('express');
// const router = express.Router();
// const {
//   getAllUsers,
//   getUser,
//   createUser,
//   updateUser,
//   deleteUser,
//   updateUserRole
// } = require('../controllers/userController');
// const { protect, authorize } = require('../middleware/authMiddleware');

// const User = require('../models/UserModel');

// router.get('/', async (req, res) => {
//   try {
  
//     const users = await User.find().select('-password');
//     res.json(users);
//   } catch (err) {
//     console.error('Error fetching users:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });


// router.route('/')
//   .get(protect, authorize('admin'), getAllUsers)
//   .post(protect, authorize('admin'), createUser);

// router.route('/:id')
//   .get(protect, authorize('admin'), getUser)
//   .put(protect, authorize('admin'), updateUser)
//   .delete(protect, authorize('admin'), deleteUser);

// router.put('/:id/role', protect, authorize('admin'), updateUserRole);


// router.get('/users', async (req, res) => {
//   try {
//     const users = await User.find(); 
//     console.log('Fetched users:', users); 
//     res.json(users); 
//   } catch (err) {
//     console.error('Error:', err);
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;



// In routes/userRoutes.js or similar
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/UserMode');

// User registration endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'customer'
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
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
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
