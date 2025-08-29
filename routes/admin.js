
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

const User = require('../models/UserModel');
const Order = require('../models/OrderModel');
const Task = require('../models/Task');

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  getAllTasks,
  createTask,
} = require('../controllers/adminController');

const { getAllOrders } = require('../controllers/orderController');

router.get('/admins/count', async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    res.json({ count: adminCount });
  } catch (error) {
    console.error('Error counting admins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register-admin', async (req, res) => {
  try {
    const { name, email, password, secretKey } = req.body;
    
    if (!name || !email || !password || !secretKey) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const expectedSecretKey = process.env.ADMIN_SECRET_KEY || 'ADMIN_SETUP_2024';
    if (secretKey !== expectedSecretKey) {
      return res.status(403).json({ error: 'Invalid admin secret key' });
    }
    
    // Check if we already have an admin
    const existingAdminCount = await User.countDocuments({ role: 'admin' });
    if (existingAdminCount > 0) {
      return res.status(403).json({ error: 'Admin already exists. Cannot create additional admin accounts.' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create new admin user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'admin'
    });
    
    await newUser.save();
    
    console.log('New admin user created:', { id: newUser._id, email: newUser.email });
    
    res.status(201).json({
      message: 'Admin account created successfully',
      user: { 
        id: newUser._id, 
        name: newUser.name, 
        email: newUser.email, 
        role: newUser.role 
      }
    });
  } catch (error) {
    console.error('Error creating admin account:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.use(protect);
router.use(authorize('admin'));

router.route('/users')
  .get(getAllUsers)
  .post(createUser);

router.route('/users/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

router.put('/users/:id/role', updateUserRole);

router.route('/tasks')
  .get(getAllTasks)
  .post(createTask);

router.get('/orders', getAllOrders);

router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter
    let filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      count: users.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: users
    });
  } catch (err) {
    console.error('Admin users fetch error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch users' 
    });
  }
});


router.get('/tasks', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
   
    let filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.assignee) {
      filter.assignee = req.query.assignee;
    }

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Task.countDocuments(filter);

    res.json({
      success: true,
      count: tasks.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: tasks
    });
  } catch (err) {
    console.error('Admin tasks fetch error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tasks' 
    });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.search) {
      filter.$or = [
        { _id: { $regex: req.query.search, $options: 'i' } },
        { 'customer.name': { $regex: req.query.search, $options: 'i' } },
        { 'customer.email': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: orders
    });
  } catch (err) {
    console.error('Admin orders fetch error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch orders' 
    });
  }
});


router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (err) {
    console.error('Order status update error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update order status' 
    });
  }
});

router.get('/dashboard/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalTasks,
      pendingTasks
    ] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'completed' }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'pending' })
    ]);

    res.json({
      success: true,
      data: {
        users: totalUsers,
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          completed: completedOrders
        },
        tasks: {
          total: totalTasks,
          pending: pendingTasks
        }
      }
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard statistics' 
    });
  }
});

module.exports = router;