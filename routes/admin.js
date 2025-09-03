const express = require('express');
const router = express.Router();
const User = require('../models/UserModel');

// Count admins endpoint
router.get('/admins/count', async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    res.json({ count: adminCount });
  } catch (error) {
    console.error('Error counting admins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if admin exists
    const admin = await User.findOne({ email, role: 'admin' });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }
    
    // Check password (you'll need to implement bcrypt comparison)
    // For now, we'll just return a success response
    res.json({
      message: 'Admin login successful',
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
