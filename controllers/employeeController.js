const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Task = require('../models/Task');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const bcrypt = require('bcryptjs');



exports.getEmployeeStats = async (employeeId) => {
  try {
    // 1. Validate ID format
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new Error('Invalid employee ID format');
    }

    // 2. Verify employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // 3. Get task counts with proper error handling
    const stats = await Task.aggregate([
      {
        $match: { 
          employee: mongoose.Types.ObjectId(employeeId),
          status: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // 4. Initialize default counts
    const result = {
      pendingCount: 0,
      completedCount: 0,
      inProgressCount: 0
    };

    // 5. Transform results
    stats.forEach(stat => {
      if (stat.status === 'pending') result.pendingCount = stat.count;
      if (stat.status === 'completed') result.completedCount = stat.count;
      if (stat.status === 'inProgress') result.inProgressCount = stat.count;
    });

    return result;
  } catch (error) {
    console.error('Error in getEmployeeStats:', {
      error: error.message,
      stack: error.stack,
      employeeId
    });
    throw error;
  }
};
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getEmployeeTasks = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const tasks = await Task.find({ 
      assignee: req.user._id 
    })
    .populate('assignee', 'name email')
    .populate('createdBy', 'name email')
    .sort({ dueDate: 1 })
    .lean();

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Error in getEmployeeTasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
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

exports.getAllEmployees = async (req, res, next) => {
  const features = new APIFeatures(Employee.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  
  const employees = await features.query;

  res.status(200).json({
    status: 'success',
    results: employees.length,
    data: {
      employees
    }
  });
}
exports.getEmployee = async (req, res, next) => {
  const employee = await Employee.findById(req.params.id);

  if (!employee) {
    return next(new AppError('No employee found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      employee
    }
  });
}

exports.createEmployee = async (req, res, next) => {
  // Hash password if provided
  if (req.body.password) {
    req.body.password = await bcrypt.hash(req.body.password, 12);
  }

  const newEmployee = await Employee.create(req.body);
  
  // Remove password from output
  newEmployee.password = undefined;

  res.status(201).json({
    status: 'success',
    data: {
      employee: newEmployee
    }
  });
}
exports.updateEmployee = async (req, res, next) => {
  // 1) Filter out unwanted fields
  const filteredBody = filterObj(
    req.body,
    'name',
    'email',
    'phone',
    'address',
    'position',
    'salary',
    'emergencyContact',
    'bankDetails',
    'status',
    'leaveBalance',
    'password'
  );

  // 2) If password is being updated, hash it
  if (filteredBody.password) {
    filteredBody.password = await bcrypt.hash(filteredBody.password, 12);
  }

  const updatedEmployee = await Employee.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    {
      new: true,
      runValidators: true
    }
  );

  if (!updatedEmployee) {
    return next(new AppError('No employee found with that ID', 404));
  }

  // Remove password from output
  updatedEmployee.password = undefined;

  res.status(200).json({
    status: 'success',
    data: {
      employee: updatedEmployee
    }
  });
}
exports.deleteEmployee = async (req, res, next) => {
  const employee = await Employee.findByIdAndDelete(req.params.id);

  if (!employee) {
    return next(new AppError('No employee found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
};
