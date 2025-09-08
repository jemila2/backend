// // const express = require('express');
// // const bcrypt = require('bcryptjs');
// // const mongoose = require('mongoose');
// // const jwt = require('jsonwebtoken');
// // const router = express.Router();
// // const { protect, authorize } = require('../middleware/authMiddleware');

// // const User = require('../models/UserModel');
// // const Order = require('../models/OrderModel');
// // const Task = require('../models/Task');

// // const {
// //   getAllUsers,
// //   getUserById,
// //   createUser,
// //   updateUser,
// //   deleteUser,
// //   updateUserRole,
// //   getAllTasks,
// //   createTask
// // } = require('../controllers/adminController');

// // const { getAllOrders } = require('../controllers/orderController');

// // // ✅ PUBLIC ROUTES (must come BEFORE auth middleware)
// // // ==================================================

// // // ✅ Check if admin exists - PUBLIC
// // router.get('/admin-exists', async (req, res) => {
// //   try {
// //     console.log('Checking if admin exists...');
// //     const adminCount = await User.countDocuments({ role: 'admin' });
// //     console.log('Admin count:', adminCount);
    
// //     res.json({
// //       success: true,
// //       adminExists: adminCount > 0,
// //       count: adminCount
// //     });
// //   } catch (error) {
// //     console.error('Error checking admin existence:', error);
// //     res.status(500).json({
// //       success: false,
// //       error: 'Failed to check admin existence'
// //     });
// //   }
// // });

// // // ✅ Register first admin - PUBLIC
// // router.post('/register-admin', async (req, res) => {
// //   try {
// //     console.log('Admin registration attempt:', req.body);
    
// //     // Check database connection
// //     if (mongoose.connection.readyState !== 1) {
// //       return res.status(503).json({
// //         success: false,
// //         error: 'Database not connected. Please try again later.',
// //         status: 'database_error'
// //       });
// //     }

// //     const { name, email, password, secretKey } = req.body;

// //     // ✅ CRITICAL: Check if any admin already exists
// //     const existingAdmin = await User.findOne({ role: 'admin' });
// //     if (existingAdmin) {
// //       console.log('Admin already exists:', existingAdmin.email);
// //       return res.status(400).json({
// //         success: false,
// //         error: 'Admin account already exists. Only one admin is allowed.',
// //         status: 'admin_exists'
// //       });
// //     }

// //     // ✅ FIXED: Use environment variable for secret key
// //     const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'ADMIN_SETUP_2024';
// //     if (secretKey !== ADMIN_SECRET_KEY) {
// //       return res.status(400).json({
// //         success: false,
// //         error: 'Invalid admin secret key',
// //         status: 'invalid_secret'
// //       });
// //     }

// //     // Validate required fields
// //     if (!name || !email || !password) {
// //       return res.status(400).json({
// //         success: false,
// //         error: 'Name, email, and password are required',
// //         status: 'missing_fields'
// //       });
// //     }

// //     // Check if user already exists
// //     const existingUser = await User.findOne({ email });
// //     if (existingUser) {
// //       return res.status(400).json({
// //         success: false,
// //         error: 'User already exists with this email',
// //         status: 'user_exists'
// //       });
// //     }

// //     // Create the one and only admin user
// //     const hashedPassword = await bcrypt.hash(password, 12);
    
// //     const adminUser = new User({
// //       name,
// //       email,
// //       password: hashedPassword,
// //       role: 'admin',
// //       isVerified: true,
// //       emailVerified: true
// //     });

// //     await adminUser.save();
// //     console.log('New admin created:', adminUser.email);

// //     // Generate token
// //     const token = jwt.sign(
// //       { 
// //         userId: adminUser._id, 
// //         role: adminUser.role,
// //         email: adminUser.email 
// //       },
// //       process.env.JWT_SECRET || 'fallback_secret_key_for_development',
// //       { expiresIn: '24h' }
// //     );

// //     res.status(201).json({
// //       success: true,
// //       message: 'Admin account created successfully',
// //       user: {
// //         id: adminUser._id,
// //         name: adminUser.name,
// //         email: adminUser.email,
// //         role: adminUser.role
// //       },
// //       token
// //     });

// //   } catch (error) {
// //     console.error('Admin registration error:', error);
// //     res.status(500).json({
// //       success: false,
// //       error: 'Internal server error',
// //       status: 'server_error'
// //     });
// //   }
// // });

// // // ✅ Get admin count - PUBLIC
// // router.get('/admins/count', async (req, res) => {
// //   try {
// //     const adminCount = await User.countDocuments({ role: 'admin' });
// //     res.json({ 
// //       success: true,
// //       count: adminCount 
// //     });
// //   } catch (error) {
// //     console.error('Error counting admins:', error);
// //     res.status(500).json({ 
// //       success: false,
// //       error: 'Internal server error' 
// //     });
// //   }
// // });

// // // ✅ HEALTH CHECK - PUBLIC
// // router.get('/health', async (req, res) => {
// //   res.json({ 
// //     status: 'OK', 
// //     message: 'Admin routes are working',
// //     timestamp: new Date().toISOString()
// //   });
// // });

// // // ✅ AUTH MIDDLEWARE (applies to all routes below this line)
// // // ==================================================
// // router.use(protect);
// // router.use(authorize('admin'));

// // // ✅ PROTECTED ROUTES (require admin authentication)
// // // ==================================================

// // // User management
// // router.route('/users')
// //   .get(getAllUsers)
// //   .post(createUser);

// // router.route('/users/:id')
// //   .get(getUserById)
// //   .put(updateUser)
// //   .delete(deleteUser);

// // router.put('/users/:id/role', updateUserRole);

// // // Task management
// // router.route('/tasks')
// //   .get(getAllTasks)
// //   .post(createTask);

// // // Order management
// // router.get('/orders', getAllOrders);

// // // Additional admin functionality
// // router.get('/users-list', async (req, res) => {
// //   try {
// //     const page = parseInt(req.query.page) || 1;
// //     const limit = parseInt(req.query.limit) || 10;
// //     const skip = (page - 1) * limit;
    
// //     // Build filter
// //     let filter = {};
// //     if (req.query.role) {
// //       filter.role = req.query.role;
// //     }
// //     if (req.query.search) {
// //       filter.$or = [
// //         { name: { $regex: req.query.search, $options: 'i' } },
// //         { email: { $regex: req.query.search, $options: 'i' } }
// //       ];
// //     }

// //     const users = await User.find(filter)
// //       .select('-password')
// //       .sort({ createdAt: -1 })
// //       .skip(skip)
// //       .limit(limit);

// //     const total = await User.countDocuments(filter);

// //     res.json({
// //       success: true,
// //       count: users.length,
// //       total,
// //       pages: Math.ceil(total / limit),
// //       currentPage: page,
// //       data: users
// //     });
// //   } catch (err) {
// //     console.error('Admin users fetch error:', err);
// //     res.status(500).json({ 
// //       success: false, 
// //       error: 'Failed to fetch users' 
// //     });
// //   }
// // });

// // router.get('/tasks-list', async (req, res) => {
// //   try {
// //     const page = parseInt(req.query.page) || 1;
// //     const limit = parseInt(req.query.limit) || 10;
// //     const skip = (page - 1) * limit;
    
// //     let filter = {};
// //     if (req.query.status) {
// //       filter.status = req.query.status;
// //     }
// //     if (req.query.assignee) {
// //       filter.assignee = req.query.assignee;
// //     }

// //     const tasks = await Task.find(filter)
// //       .populate('assignee', 'name email')
// //       .sort({ createdAt: -1 })
// //       .skip(skip)
// //       .limit(limit);

// //     const total = await Task.countDocuments(filter);

// //     res.json({
// //       success: true,
// //       count: tasks.length,
// //       total,
// //       pages: Math.ceil(total / limit),
// //       currentPage: page,
// //       data: tasks
// //     });
// //   } catch (err) {
// //     console.error('Admin tasks fetch error:', err);
// //     res.status(500).json({ 
// //       success: false, 
// //       error: 'Failed to fetch tasks' 
// //     });
// //   }
// // });

// // router.get('/orders-list', async (req, res) => {
// //   try {
// //     const page = parseInt(req.query.page) || 1;
// //     const limit = parseInt(req.query.limit) || 10;
// //     const skip = (page - 1) * limit;
    
// //     let filter = {};
// //     if (req.query.status) {
// //       filter.status = req.query.status;
// //     }
// //     if (req.query.search) {
// //       filter.$or = [
// //         { _id: { $regex: req.query.search, $options: 'i' } },
// //         { 'customer.name': { $regex: req.query.search, $options: 'i' } },
// //         { 'customer.email': { $regex: req.query.search, $options: 'i' } }
// //       ];
// //     }

// //     const orders = await Order.find(filter)
// //       .populate('user', 'name email phone')
// //       .sort({ createdAt: -1 })
// //       .skip(skip)
// //       .limit(limit);

// //     const total = await Order.countDocuments(filter);

// //     res.json({
// //       success: true,
// //       count: orders.length,
// //       total,
// //       pages: Math.ceil(total / limit),
// //       currentPage: page,
// //       data: orders
// //     });
// //   } catch (err) {
// //     console.error('Admin orders fetch error:', err);
// //     res.status(500).json({ 
// //       success: false, 
// //       error: 'Failed to fetch orders' 
// //     });
// //   }
// // });

// // router.put('/orders/:id/status', async (req, res) => {
// //   try {
// //     const { status } = req.body;
// //     const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    
// //     if (!validStatuses.includes(status)) {
// //       return res.status(400).json({
// //         success: false,
// //         error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
// //       });
// //     }

// //     const order = await Order.findByIdAndUpdate(
// //       req.params.id,
// //       { status },
// //       { new: true, runValidators: true }
// //     ).populate('user', 'name email phone');

// //     if (!order) {
// //       return res.status(404).json({
// //         success: false,
// //         error: 'Order not found'
// //       });
// //     }

// //     res.json({
// //       success: true,
// //       data: order
// //     });
// //   } catch (err) {
// //     console.error('Order status update error:', err);
// //     res.status(500).json({ 
// //       success: false, 
// //       error: 'Failed to update order status' 
// //     });
// //   }
// // });

// // router.get('/dashboard/stats', async (req, res) => {
// //   try {
// //     const [
// //       totalUsers,
// //       totalOrders,
// //       pendingOrders,
// //       completedOrders,
// //       totalTasks,
// //       pendingTasks
// //     ] = await Promise.all([
// //       User.countDocuments(),
// //       Order.countDocuments(),
// //       Order.countDocuments({ status: 'pending' }),
// //       Order.countDocuments({ status: 'completed' }),
// //       Task.countDocuments(),
// //       Task.countDocuments({ status: 'pending' })
// //     ]);

// //     res.json({
// //       success: true,
// //       data: {
// //         users: totalUsers,
// //         orders: {
// //           total: totalOrders,
// //           pending: pendingOrders,
// //           completed: completedOrders
// //         },
// //         tasks: {
// //           total: totalTasks,
// //           pending: pendingTasks
// //         }
// //       }
// //     });
// //   } catch (err) {
// //     console.error('Dashboard stats error:', err);
// //     res.status(500).json({ 
// //       success: false, 
// //       error: 'Failed to fetch dashboard statistics' 
// //     });
// //   }
// // });

// // // ✅ Export the router
// // module.exports = router;




// const express = require('express');
// const bcrypt = require('bcryptjs');
// const mongoose = require('mongoose');
// const jwt = require('jsonwebtoken');
// const router = express.Router();

// const User = require('../models/UserModel');

// // ✅ PUBLIC ROUTES (no middleware needed here)
// // ==================================================

// // ✅ Check if admin exists - PUBLIC
// router.get('/admin-exists', async (req, res) => {
//   try {
//     console.log('Checking if admin exists...');
//     const adminCount = await User.countDocuments({ role: 'admin' });
//     console.log('Admin count:', adminCount);
    
//     res.json({
//       success: true,
//       adminExists: adminCount > 0,
//       count: adminCount
//     });
//   } catch (error) {
//     console.error('Error checking admin existence:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to check admin existence'
//     });
//   }
// });

// // ✅ Register first admin - PUBLIC
// router.post('/register-admin', async (req, res) => {
//   try {
//     console.log('Admin registration attempt:', req.body);
    
//     // Check database connection
//     if (mongoose.connection.readyState !== 1) {
//       return res.status(503).json({
//         success: false,
//         error: 'Database not connected. Please try again later.',
//         status: 'database_error'
//       });
//     }

//     const { name, email, password, secretKey } = req.body;

//     // ✅ CRITICAL: Check if any admin already exists
//     const existingAdmin = await User.findOne({ role: 'admin' });
//     if (existingAdmin) {
//       console.log('Admin already exists:', existingAdmin.email);
//       return res.status(400).json({
//         success: false,
//         error: 'Admin account already exists. Only one admin is allowed.',
//         status: 'admin_exists'
//       });
//     }

//     // Validate secret key - use environment variable
//     const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'ADMIN_SETUP_2024';
//     if (secretKey !== ADMIN_SECRET_KEY) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid admin secret key',
//         status: 'invalid_secret'
//       });
//     }

//     // Validate required fields
//     if (!name || !email || !password) {
//       return res.status(400).json({
//         success: false,
//         error: 'Name, email, and password are required',
//         status: 'missing_fields'
//       });
//     }

//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         error: 'User already exists with this email',
//         status: 'user_exists'
//       });
//     }

//     // Create the one and only admin user
//     const hashedPassword = await bcrypt.hash(password, 12);
    
//     const adminUser = new User({
//       name,
//       email,
//       password: hashedPassword,
//       role: 'admin',
//       isVerified: true,
//       emailVerified: true
//     });

//     await adminUser.save();
//     console.log('New admin created:', adminUser.email);

//     // Generate token
//     const token = jwt.sign(
//       { 
//         userId: adminUser._id, 
//         role: adminUser.role,
//         email: adminUser.email 
//       },
//       process.env.JWT_SECRET || 'fallback_secret_key_for_development',
//       { expiresIn: '24h' }
//     );

//     res.status(201).json({
//       success: true,
//       message: 'Admin account created successfully',
//       user: {
//         id: adminUser._id,
//         name: adminUser.name,
//         email: adminUser.email,
//         role: adminUser.role
//       },
//       token
//     });

//   } catch (error) {
//     console.error('Admin registration error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Internal server error',
//       status: 'server_error'
//     });
//   }
// });

// // ✅ Get admin count - PUBLIC
// router.get('/admins/count', async (req, res) => {
//   try {
//     const adminCount = await User.countDocuments({ role: 'admin' });
//     res.json({ 
//       success: true,
//       count: adminCount 
//     });
//   } catch (error) {
//     console.error('Error counting admins:', error);
//     res.status(500).json({ 
//       success: false,
//       error: 'Internal server error' 
//     });
//   }
// });

// // ✅ HEALTH CHECK - PUBLIC
// router.get('/health', async (req, res) => {
//   res.json({ 
//     status: 'OK', 
//     message: 'Admin routes are working',
//     timestamp: new Date().toISOString()
//   });
// });

// // ✅ Export the router - NO MIDDLEWARE HERE!
// module.exports = router;





const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/UserModel');

// ✅ PUBLIC ROUTES (no middleware)
router.get('/admin-exists', async (req, res) => {
  try {
    console.log('Checking if admin exists...');
    const adminCount = await User.countDocuments({ role: 'admin' });
    console.log('Admin count:', adminCount);
    
    res.json({
      success: true,
      adminExists: adminCount > 0,
      count: adminCount
    });
  } catch (error) {
    console.error('Error checking admin existence:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check admin existence'
    });
  }
});

router.post('/register-admin', async (req, res) => {
  try {
    console.log('Admin registration attempt:', req.body);
    
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Database not connected',
        status: 'database_error'
      });
    }

    const { name, email, password, secretKey } = req.body;

    // Check if admin exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Admin account already exists',
        status: 'admin_exists'
      });
    }

    // Validate secret key
    const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'ADMIN_SETUP_2024';
    if (secretKey !== ADMIN_SECRET_KEY) {
      return res.status(400).json({
        success: false,
        error: 'Invalid admin secret key',
        status: 'invalid_secret'
      });
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required',
        status: 'missing_fields'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email',
        status: 'user_exists'
      });
    }

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

    const token = jwt.sign(
      { 
        userId: adminUser._id, 
        role: adminUser.role,
        email: adminUser.email 
      },
      process.env.JWT_SECRET || 'fallback_secret_key_for_development',
      { expiresIn: '24h' }
    );

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

router.get('/health', async (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Admin routes are working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

