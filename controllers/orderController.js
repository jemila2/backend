
const mongoose = require('mongoose');
const Order = require('../models/OrderModel');
const Customer = require('../models/CustomerModel');

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('user', 'name email')
      .populate('services.service');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
      
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const createOrder = async (req, res) => {
  try {
    console.log('Raw request body:', req.body);

    // Required fields validation
    const requiredFields = {
      customerId: 'Customer ID',
      items: 'Items array',
      pickupAddress: 'Pickup address',
      deliveryAddress: 'Delivery address',
      pickupDate: 'Pickup date',
      deliveryDate: 'Delivery date'
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([field]) => !req.body[field])
      .map(([_, name]) => name);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    // Validate items array
    if (!Array.isArray(req.body.items)) {
      return res.status(400).json({
        success: false,
        message: 'Items must be an array'
      });
    }

    // Validate dates
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(req.body.pickupDate) || !dateRegex.test(req.body.deliveryDate)) {
      return res.status(400).json({
        success: false,
        message: 'Dates must be in YYYY-MM-DD format'
      });
    }

    // Create order
    const order = new Order({
      customer: req.body.customerId,
      items: req.body.items,
      notes: req.body.notes || '',
      pickupAddress: req.body.pickupAddress,
      deliveryAddress: req.body.deliveryAddress,
      pickupDate: new Date(req.body.pickupDate),
      deliveryDate: new Date(req.body.deliveryDate),
      total: req.body.total || calculateTotal(req.body.items),
      status: 'pending'
    });

    const savedOrder = await order.save();
    res.status(201).json({ success: true, order: savedOrder });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
      validationErrors: error.errors
    });
  }
};
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('user', 'name email');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ createdBy: req.user.id })
      .populate('customer');
    res.json(orders);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


const getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    }).populate('customer');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { status },
      { new: true, runValidators: true }
    ).populate('customer');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const syncOrderStatus = async (orderId) => {
  try {
    // Get all tasks for this order
    const tasks = await Task.find({ orderId });
    
    if (tasks.length === 0) {
      // No tasks for this order, keep current status
      return;
    }
    
    // Check if all tasks are completed
    const allTasksCompleted = tasks.every(task => task.status === 'completed');
    
    // Get the current order
    const order = await Order.findById(orderId);
    
    if (allTasksCompleted && order.status !== 'completed') {
      // Update order status to completed
      await Order.findByIdAndUpdate(orderId, { status: 'completed' });
      console.log(`Order ${orderId} automatically marked as completed`);
    } else if (!allTasksCompleted && order.status === 'completed') {
      // Revert order status to processing
      await Order.findByIdAndUpdate(orderId, { status: 'processing' });
      console.log(`Order ${orderId} reverted to processing (tasks incomplete)`);
    }
  } catch (err) {
    console.error('Error syncing order status:', err);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrder,
  deleteOrder,
  getAllOrders
};