

const User = require('../models/UserModel');
const Task = require('../models/Task');

const Order = require('../models/OrderModel'); 
exports.getAllOrders = async (req, res) => {
    try {
      
        const orders = await Order.find().populate('user', 'name email');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// exports.getAllOrders = async (req, res) => {
//   try {
//     let orders = await Order.find({})
//       .sort({ createdAt: -1 })
//       .lean(); // Use lean() for better performance

//     // Manually populate customer data if needed
//     orders = await Promise.all(orders.map(async (order) => {
//       if (order.customer) {
//         try {
//           const customer = await User.findById(order.customer).select('name email phone').lean();
//           return {
//             ...order,
//             customer: customer || { name: 'Unknown', email: '', phone: '' }
//           };
//         } catch (error) {
//           console.error('Error populating customer:', error);
//           return {
//             ...order,
//             customer: { name: 'Error loading customer', email: '', phone: '' }
//           };
//         }
//       }
//       return order;
//     }));

//     res.status(200).json({
//       success: true,
//       count: orders.length,
//       data: orders
//     });
//   } catch (error) {
//     console.error('Error fetching orders:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while fetching orders'
//     });
//   }
// };

// controllers/adminController.js
exports.createTask = async (req, res) => {
  try {
    const { title, description, assignee, dueDate, priority, status } = req.body;
    
    // Validate required fields
    if (!title || !assignee || !dueDate) {
      return res.status(400).json({ 
        success: false,
        error: 'Title, assignee, and due date are required' 
      });
    }

    const task = new Task({
      title,
      description,
      assignee,
      dueDate,
      priority: priority || 'medium',
      status: status || 'pending',
      createdBy: req.user.id
    });

    await task.save();
    
    res.status(201).json({
      success: true,
      data: task
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
};
exports.getAllUsers = async (req, res) => {
  try {
    console.log('[DEBUG] Entering getAllUsers controller');
    
    const users = await User.find({})
      .select('-password -__v')
      .lean();
    
    console.log(`[DEBUG] Found ${users.length} users in DB`);
    console.log('[DEBUG] Sample user:', users[0] || 'No users found');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('[ERROR] in getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
/**
 * @desc    Get user by ID (admin only)
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -__v -resetToken -resetTokenExpire');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
};

/**
 * @desc    Create new user (admin only)
 * @route   POST /api/admin/users
 * @access  Private/Admin
 */
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'customer' // Default to customer if not specified
    });

    // Remove sensitive data before sending response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while creating user'
    });
  }
};

/**
 * @desc    Update user (admin only)
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
exports.updateUser = async (req, res) => {
  try {
    const updates = {
      name: req.body.name,
      email: req.body.email,
      contact: req.body.contact,
      address: req.body.address,
      username: req.body.username
    };

    // Only update role if provided and current user is admin
    if (req.body.role && req.user.role === 'admin') {
      updates.role = req.body.role;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate field value entered'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
};

/**
 * @desc    Update user role (admin only)
 * @route   PUT /api/admin/users/:id/role
 * @access  Private/Admin
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['customer', 'employee', 'admin'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Valid roles are: ${validRoles.join(', ')}`
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user role'
    });
  }
};

/**
 * @desc    Delete user (admin only)
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
};

/**
 * @desc    Get all tasks (admin only)
 * @route   GET /api/admin/tasks
 * @access  Private/Admin
 */
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignee', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tasks'
    });
  }
};


