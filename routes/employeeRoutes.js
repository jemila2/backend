

const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const Employee = require("../models/Employee");
const Task = require('../models/Task');
const {
  getEmployeeTasks,
  getAllEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  getAllTasks
} = require('../controllers/employeeController');

const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: `Access denied. Requires role: ${roles.join(' or ')}` 
      });
    }
    next();
  };
};

router.get('/tasks', getAllTasks);


router.get('/employee/:employeeId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.employeeId)) {
      return res.status(400).json({ message: 'Invalid employee ID' });
    }

    const tasks = await Task.find({ 
      assignee: req.params.employeeId 
    }).lean();

    console.log(`Found ${tasks.length} tasks for ${req.params.employeeId}`);
    res.json(tasks);
  } catch (err) {
    console.error('Error in employee tasks endpoint:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


const validateEmployeeId = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID format'
      });
    }

    // Verify employee exists if not creating
    if (req.method !== 'POST') {
      const employee = await Employee.exists({ _id: req.params.id });
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during validation'
    });
  }
};

const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  }
});



router.get('/:id/stats', protect, async (req, res) => {
  try {
    // Input validation
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID is required'
      });
    }

    const stats = await getEmployeeStats(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {
        pending: stats.pendingCount,
        completed: stats.completedCount,
        inProgress: stats.inProgressCount
      }
    });
    
  } catch (error) {
    console.error('Stats endpoint error:', {
      message: error.message,
      stack: error.stack,
      params: req.params
    });

    const statusCode = error.message.includes('not found') ? 404 : 500;
    const errorMessage = error.message.includes('not found') 
      ? error.message 
      : 'Failed to load employee statistics';

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});


router.get('/my-tasks', protect, async (req, res) => {
  try {
    console.log(`Fetching tasks for user ${req.user._id}`);
    
    const tasks = await Task.find({ assignee: req.user._id })
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email');

    console.log(`Found ${tasks.length} tasks`);
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: err.message });
  }
});

router.route('/')
  .get(protect, checkRole('admin', 'manager'), apiLimiter, getAllEmployees)
  .post(protect, checkRole('admin'), apiLimiter, createEmployee);

router.route('/:id')
  .get(protect, validateEmployeeId, apiLimiter, getEmployee)
  .put(protect, validateEmployeeId, checkRole('admin'), apiLimiter, updateEmployee)
  .delete(protect, validateEmployeeId, checkRole('admin'), apiLimiter, deleteEmployee);


router.route('/:id/tasks').get(protect, validateEmployeeId, apiLimiter, async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const query = { employee: req.params.id };
      
      if (status) query.status = status;

      const tasks = await Task.find(query)
        .select('-__v')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ dueDate: 1 })
        .populate('employee', 'name email position')
        .lean();

      const count = await Task.countDocuments(query);

      res.status(200).json({
        success: true,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        count,
        data: tasks
      });

    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tasks',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });



router.get('/:id/orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ employee: req.params.id });
    res.status(200).json({
      success: true,
      data: orders // Ensure this is always an array
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

router.patch('/orders/:id/complete', protect, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'completed' },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to complete order'
    });
  }
});



router.get('/:id/stats', protect, async (req, res) => {
  try {
    const stats = await getEmployeeStats(req.params.id);
    res.status(200).json({
      success: true,
      data: {
        pending: stats.pendingCount || 0,
        completed: stats.completedCount || 0,
        inProgress: stats.inProgressCount || 0
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load employee statistics'
    });
  }
});


router.get('/:id/verify', protect, validateEmployeeId, apiLimiter, async (req, res) => {
  try {
    const [employee, tasks] = await Promise.all([
      Employee.findById(req.params.id)
        .select('-__v -password')
        .lean(),
      Task.find({ employee: req.params.id })
        .select('status dueDate')
        .lean()
    ]);

    const taskStats = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        employee,
        taskStats,
        overdueTasks: tasks.filter(t => 
          t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
        ).length
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


module.exports = router;