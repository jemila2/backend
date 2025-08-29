

const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Order = require('../models/OrderModel');
const authMiddleware = require('../middleware/authMiddleware');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

const verifyToken = (req, res, next) => {
  console.log('Authorization header:', req.headers.authorization);
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('No token provided');
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized - No token provided' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized - Invalid token' 
      });
    }
    console.log('Decoded token:', decoded);
    req.userId = decoded.id;
    req.userRole = decoded.role; // Assuming role is included in the token
    next();
  });
};



const syncOrderStatus = async (orderId) => {
  try {
    const tasks = await Task.find({ orderId });
    
    if (tasks.length === 0) return;
    
    const allTasksCompleted = tasks.every(task => task.status === 'completed');
    const order = await Order.findById(orderId);
    
    if (allTasksCompleted && order.status !== 'completed') {
      await Order.findByIdAndUpdate(orderId, { status: 'completed' });
      console.log(`Order ${orderId} automatically completed`);
    } else if (!allTasksCompleted && order.status === 'completed') {
      await Order.findByIdAndUpdate(orderId, { status: 'processing' });
      console.log(`Order ${orderId} reverted to processing`);
    }
  } catch (err) {
    console.error('Error syncing order status:', err);
  }
};

router.get('/orders/:orderId/tasks', async (req, res) => {
  try {
    const tasks = await Task.find({ orderId: req.params.orderId })
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email');
    
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', protect, async (req, res) => {
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

// ADD TASK CREATION ENDPOINT
router.post('/:orderId/tasks', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, description, assignee, dueDate, priority } = req.body;
    
    const task = new Task({
      title,
      description,
      assignee,
      orderId: req.params.orderId, // Link to order
      dueDate,
      priority,
      createdBy: req.userId
    });
    
    const savedTask = await task.save();
    res.status(201).json({ success: true, data: savedTask });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// In your orderRoute.js
// router.post('/', async (req, res) => {
//   try {
//     const {
//       customerId,
//       items,
//       notes,
//       pickupAddress,
//       deliveryAddress,
//       pickupDate,
//       deliveryDate,
//       deliveryOption,
//       total,
//       status
//     } = req.body;

//     console.log('Received order data:', req.body); // DEBUG LOG

//     // Validate required fields
//     if (!customerId) {
//       return res.status(400).json({
//         success: false,
//         message: 'Customer ID is required'
//       });
//     }

//     if (!deliveryOption) {
//       return res.status(400).json({
//         success: false,
//         message: 'Delivery option is required (delivery or pickup)'
//       });
//     }

//     if (!pickupAddress || !pickupAddress.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Pickup address is required'
//       });
//     }

//     if (!pickupDate) {
//       return res.status(400).json({
//         success: false,
//         message: 'Pickup date is required'
//       });
//     }

//     // Validate based on delivery option
//     if (deliveryOption === 'delivery') {
//       if (!deliveryAddress || !deliveryAddress.trim()) {
//         return res.status(400).json({
//           success: false,
//           message: 'Delivery address is required for delivery orders'
//         });
//       }
//       if (!deliveryDate) {
//         return res.status(400).json({
//           success: false,
//           message: 'Delivery date is required for delivery orders'
//         });
//       }
//     }

//     const order = new Order({
//       customerId,
//       items,
//       notes: notes || '',
//       pickupAddress,
//       deliveryAddress: deliveryOption === 'delivery' ? deliveryAddress : '',
//       pickupDate: new Date(pickupDate),
//       deliveryDate: deliveryOption === 'delivery' ? new Date(deliveryDate) : null,
//       deliveryOption,
//       total,
//       status: status || 'pending'
//     });

//     const savedOrder = await order.save();
    
//     res.status(201).json({
//       success: true,
//       data: savedOrder
//     });

//   } catch (error) {
//     console.error('Order creation error:', error);
    
//     if (error.name === 'ValidationError') {
//       const errors = Object.values(error.errors).map(err => ({
//         field: err.path,
//         message: err.message
//       }));
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: 'Server error creating order'
//     });
//   }
// });


// Get single order by ID
router.get('/:orderId', verifyToken, async (req, res) => {
  // ... your existing implementation
});

// UPDATE ORDER STATUS ENDPOINT
router.put('/:id/status', async (req, res) => {
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

// Get all orders (admin)
router.get('/admin/orders', protect, authorize('admin'), async (req, res) => {
  // ... your existing implementation
});

// Update your backend route
router.post('/', verifyToken, async (req, res) => {
  try {
    const { 
    customerId,
      items,
      notes,
      pickupAddress,
      deliveryAddress,
      pickupDate,
      deliveryDate,
      deliveryOption,
      total,
      status
    } = req.body;

    // Input validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least one service item'
      });
    }

    const order = new Order({
      user: req.userId,
       customerId,
      items,            
      notes,
      pickupAddress,
      deliveryAddress,
      pickupDate,
      deliveryDate,
      total,
      deliveryOption,
      status: 'pending',
      status
    });

    const savedOrder = await order.save();
    
    res.status(201).json({
      success: true,
      data: savedOrder
    });
  } catch (err) {
    console.error('Order creation failed:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});


// router.get('/customer/:customerId', async (req, res) => {
//   try {
//     // Convert string ID to ObjectId for proper querying
//     const customerId = new mongoose.Types.ObjectId(req.params.customerId);
    
//     const orders = await Order.find({ user: customerId })
//       .sort({ createdAt: -1 }) // Newest first
//       .lean();

//     if (!orders.length) {
//       return res.status(200).json({
//         success: true,
//         message: 'No orders found for this customer',
//         data: []
//       });
//     }

//     res.json({
//       success: true,
//       count: orders.length,
//       data: orders
//     });

//   } catch (error) {
//     console.error('Error fetching orders:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch orders'
//     });
//   }
// });



// In your backend route handler
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // Disable caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const orders = await Order.find({ customerId })
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching orders'
    });
  }
});


router.get('/', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .populate('services.service', 'name price')
      .lean();
    
    res.json({ 
      success: true,
      count: orders.length,
      data: orders 
    });
  } catch (err) {
    console.error('Order fetch error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Server error fetching orders'
    });
  }
});

router.get('/summary',  async (req, res) => {
  try {
    // Get counts for different order statuses
    const [pendingCount, completedCount, totalCount] = await Promise.all([
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'completed' }),
      Order.countDocuments({}) // Total orders
    ]);

    res.json({
      success: true,
      data: {
        pending: pendingCount,
        completed: completedCount,
        total: totalCount
      }
    });
  } catch (error) {
    console.error('Order summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order summary'
    });
  }
});

router.get('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid order ID' });
  }})



router.get('/my-orders', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .populate('services.service', 'name price');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
});


router.get('/admin/orders', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('=== ADMIN ORDERS REQUEST ===');
    console.log('Query params:', req.query);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    let filter = {};
    
    // Status filter
    if (req.query.status && req.query.status !== '') {
      filter.status = req.query.status;
      console.log('Status filter applied:', req.query.status);
    }
    
    // Search filter
    if (req.query.search && req.query.search !== '') {
      filter.$or = [
        { _id: { $regex: req.query.search, $options: 'i' } },
        { 'items.name': { $regex: req.query.search, $options: 'i' } }
      ];
      console.log('Search filter applied:', req.query.search);
    }

    console.log('Final filter object:', filter);

    // Fetch orders with user population
    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);

    console.log('Orders found:', orders.length);
    console.log('Total orders in DB:', total);
    orders.forEach(order => {
      console.log(`Order ${order._id}: user=${order.user ? order.user._id : 'null'}, status=${order.status}`);
    });

    // Transform orders to match frontend expectations
    const transformedOrders = orders.map(order => ({
      ...order.toObject(),
      customer: order.user ? {
        _id: order.user._id,
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone
      } : null
    }));

    res.json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: transformedOrders
    });

  } catch (err) {
    console.error('Admin orders fetch error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch orders'
    });
  }
});


router.post('/', verifyToken, async (req, res) => {
  try {
    console.log('=== ORDER CREATION REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User ID:', req.userId);

    const { 
      items,
      notes,
      pickupAddress,
      deliveryAddress,
      pickupDate,
      deliveryDate,
      total 
    } = req.body;

    // Input validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('Validation failed: No items provided');
      return res.status(400).json({
        success: false,
        error: 'Please provide at least one service item'
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.name || !item.price || !item.type) {
        console.log('Validation failed: Invalid item structure', item);
        return res.status(400).json({
          success: false,
          error: 'Each item must have name, price, and type'
        });
      }
    }

    // Date validation
    const now = new Date();
    const pickup = new Date(pickupDate);
    const delivery = new Date(deliveryDate);

    if (pickup <= now) {
      console.log('Validation failed: Pickup date must be in future');
      return res.status(400).json({
        success: false,
        error: 'Pickup date must be in the future'
      });
    }

    if (delivery <= pickup) {
      console.log('Validation failed: Delivery date must be after pickup');
      return res.status(400).json({
        success: false,
        error: 'Delivery date must be after pickup date'
      });
    }

    const order = new Order({
      user: req.userId,
      items,
      notes: notes || '',
      pickupAddress,
      deliveryAddress,
      pickupDate: pickup,
      deliveryDate: delivery,
      total,
      status: 'pending',
      paymentStatus: 'unpaid'
    });

    console.log('Order object created:', order);

    const savedOrder = await order.save();
    console.log('Order saved successfully:', savedOrder._id);
    
    res.status(201).json({
      success: true,
      data: savedOrder
    });
  } catch (err) {
    console.error('ORDER CREATION ERROR:', err);
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    
    // Handle specific MongoDB errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid data format'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});


router.put('/:id/status', protect, async (req, res) => {
  
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({
      assignedEmployee: req.user._id, // Or req.query.employeeId
      status: { $in: ['pending', 'in-progress'] } // Only show active orders
    })
    .populate('customer', 'name email')
    .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});


router.patch('/:id/complete', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'completed',
        completedAt: new Date(),
        completedBy: req.user.id 
      },
      { new: true }
    ).populate('customer', 'name email');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Add any post-completion logic here (notifications, etc.)
    
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/all', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});


router.put('/:id/status', async (req, res) => {
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


router.get('/:orderId', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('user', 'name email')
      .populate('services.service', 'name price description');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if the requesting user owns the order or is admin
    if (order.user._id.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden - You can only access your own orders'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Failed to fetch order:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
});

module.exports = router;