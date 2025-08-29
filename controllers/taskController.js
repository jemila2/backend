


const Task = require('../models/Task');
const User = require('../models/UserModel');
const Employee = require('../models/Employee');
const ErrorResponse = require('../utils/errorResponse');
const mongoose = require('mongoose');
const Order = require('../models/OrderModel');

const createTask = async (req, res) => {
  try {
    const { orderId, title, description, assignee, priority, dueDate, status } = req.body;

    // Validate required fields
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    if (!assignee) {
      return res.status(400).json({
        success: false,
        message: 'Assignee is required'
      });
    }

    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if assignee exists
    const user = await User.findById(assignee);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Assigned user not found'
      });
    }

    const task = new Task({
      orderId,
      title,
      description,
      assignee, // Make sure this matches exactly with your schema field name
      priority,
      dueDate,
      status: status || 'pending',
      createdBy: req.user._id
    });

    const savedTask = await task.save();
    
    // Update the order with task reference
    order.tasks = order.tasks || [];
    order.tasks.push(savedTask._id);
    await order.save();

    // Populate the task with related data
    const populatedTask = await Task.findById(savedTask._id)
      .populate('orderId', 'orderNumber customer')
      .populate('assignee', 'name email') // Make sure this matches your schema
      .populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: populatedTask
    });

  } catch (error) {
    console.error('Error creating task:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error creating task'
    });
  }
};

const getEmployeeTasks = async (req, res) => {
  try {
    console.log('Fetching tasks for:', req.user._id);
    
    // Convert string ID to ObjectId explicitly
    const tasks = await Task.find({ 
      assignee: new mongoose.Types.ObjectId(req.user._id) 
    })
    .populate('assignee', 'name email')
    .populate('createdBy', 'name email');

    console.log('Tasks found:', tasks.length);
    
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
const getAllTasks = async (req, res, next) => {
  try {
    console.log('Fetching tasks for:', req.user.id);
    
    // Base query
    const query = {};
    
    // If admin view requested, get all tasks
    if (req.query.adminView) {
      console.log('Returning all tasks for admin view');
    } else {
      // Otherwise only get tasks for current user
      query.$or = [
        { assignee: req.user.id },
        { createdBy: req.user.id }
      ];
    }

    const tasks = await Task.find(query)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .lean()  // Convert to plain JS objects
      .sort({ createdAt: -1 });

    console.log(`Found ${tasks.length} tasks`);

    // Transform for frontend
    const transformedTasks = tasks.map(task => ({
      ...task,
      // Ensure dates are strings
      dueDate: task.dueDate?.toISOString(),
      createdAt: task.createdAt?.toISOString(),
      updatedAt: task.updatedAt?.toISOString(),
      // Ensure assignee exists
      assignee: task.assignee || { name: 'Unassigned' }
    }));

    res.status(200).json({
      success: true,
      count: transformedTasks.length,
      data: transformedTasks
    });

  } catch (err) {
    console.error('Task fetch error:', err);
    next(new ErrorResponse('Failed to fetch tasks', 500));
  }
}
const assignTask = async (req, res, next) => {
  const { title, description, employeeId, dueDate, priority } = req.body;

  // Validate employee exists
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return next(new ErrorResponse('Employee not found', 404));
  }

  // Create task
  const task = await Task.create({
    title,
    description,
    employee: employeeId,
    assignedBy: req.user.id,
    dueDate,
    priority: priority || 'medium',
    status: 'pending'
  });

  res.status(201).json({
    success: true,
    data: task
  });
}
const getAssignedTasks = async (req, res, next) => {
  const { page = 1, limit = 10, status } = req.query;
  const query = { assignedBy: req.user.id };
  
  if (status) query.status = status;

  const tasks = await Task.find(query)
    .populate('employee', 'name email position')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ dueDate: 1 });

  const count = await Task.countDocuments(query);

  res.status(200).json({
    success: true,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    count,
    data: tasks
  });
}

const updateTask = async (req, res, next) => {
  let task = await Task.findById(req.params.id);

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  // Check permissions
  if (req.user.role !== 'admin' && 
      req.user.role !== 'manager' && 
      task.employee.toString() !== req.user.employeeId?.toString()) {
    return next(new ErrorResponse('Not authorized to update this task', 403));
  }

  // Only allow certain fields to be updated by employees
  const updateFields = req.user.role === 'employee' 
    ? { status: req.body.status, description: req.body.description }
    : req.body;

  task = await Task.findByIdAndUpdate(req.params.id, updateFields, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: task
  });
}


// In your backend task controller
const getAll = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email');
    
    console.log(`Found ${tasks.length} tasks`); // Debug logging
    
    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};


// In your orders controller
const getAllOrders = async (req, res) => {
  try {
    // Disable caching for this endpoint
    res.setHeader('Cache-Control', 'no-store');
    
    const orders = await Order.find()
      .populate('customer', 'name email')
      .populate('employee', 'name email');
    
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};


module.exports = {
  createTask,
  assignTask,
  getAssignedTasks,
  getEmployeeTasks,
  updateTask,
  getAllTasks,
  getAll,
  getAllOrders,
};