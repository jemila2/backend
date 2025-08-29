const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const User = require('../models/UserModel');

router.get('/', async (req, res) => {
  try {
  
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error' });
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