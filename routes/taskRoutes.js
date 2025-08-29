// const express = require('express');
// const router = express.Router();
// const Task = require('../models/Task');
// const { protect } = require('../middleware/authMiddleware');

// // Create a new task
// router.post('/', protect, async (req, res) => {
//   try {
//     const { title, description, assignee, dueDate, priority } = req.body;
    
//     // Basic validation
//     if (!title || !assignee || !dueDate) {
//       return res.status(400).json({ error: 'Missing required fields' });
//     }

//     const newTask = new Task({
//       title,
//       description,
//       assignee,
//       assignedBy: req.user._id, // The logged-in user who's assigning
//       dueDate: new Date(dueDate),
//       priority: priority || 'medium'
//     });

//     await newTask.save();
    
//     res.status(201).json(newTask);
//   } catch (error) {
//     console.error('Task creation error:', error);
//     res.status(500).json({ 
//       error: 'Failed to create task',
//       details: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// });

// // Get all tasks for current user
// router.get('/my-tasks', protect, async (req, res) => {
//   try {
//     const tasks = await Task.find({ assignee: req.user._id })
//       .sort({ dueDate: 1 });
    
//     res.json(tasks);
//   } catch (error) {
//     console.error('Error fetching tasks:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });



// module.exports = router;


const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createTask,
  assignTask,
  getAssignedTasks,
  getEmployeeTasks,
  updateTask,
  getAllTasks
} = require('../controllers/taskController');

const Task = require('../models/Task');

// Enhanced task status update endpoint
router.patch('/:id/status', protect, async (req, res) => {
  try {
    console.log('Received status update request:', {
      taskId: req.params.id,
      newStatus: req.body.status,
      userId: req.user._id
    });

    // Validate input
    const validStatuses = ['pending', 'in-progress', 'completed'];
    if (!validStatuses.includes(req.body.status)) {
      console.log('Invalid status value received:', req.body.status);
      return res.status(400).json({ 
        success: false,
        error: 'Invalid status value' 
      });
    }

    // Verify task exists and belongs to requesting user
    const task = await Task.findOne({
      _id: req.params.id,
      assignee: req.user._id
    });

    if (!task) {
      console.log('Task not found or not assigned to user');
      return res.status(404).json({ 
        success: false,
        error: 'Task not found or not assigned to you' 
      });
    }

    // Update task status
    task.status = req.body.status;
    task.updatedAt = new Date();
    
    // Save with validation
    const updatedTask = await task.save();

    console.log('Successfully updated task:', updatedTask._id);
    res.json({
      success: true,
      data: updatedTask
    });

  } catch (error) {
    console.error('Task status update error:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      params: req.params
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to update task status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// In your task routes file
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'in-progress', 'completed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid status value' 
      });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, assignee: req.user._id },
      { status },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ 
        success: false,
        error: 'Task not found or not assigned to you' 
      });
    }

    // The middleware in the Task model will automatically update the order status
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// In your task routes
router.put('/tasks/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    // Update the task
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Sync the order status if this task is associated with an order
    if (task.orderId) {
      await syncOrderStatus(task.orderId);
    }
    
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add this to your routes file
router.patch('/tasks/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    console.log('Updating task status:', { id, status, user: req.user._id });

    // Validate task ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid task ID format' 
      });
    }

    // Validate status
    const validStatuses = ['pending', 'in-progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status. Must be: pending, in-progress, or completed' 
      });
    }

    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { 
        status,
        updatedAt: new Date(),
        updatedBy: req.user._id 
      },
      { new: true, runValidators: true }
    ).populate('assignee', 'name email');

    if (!updatedTask) {
      return res.status(404).json({ 
        success: false,
        message: 'Task not found' 
      });
    }

    res.json({
      success: true,
      message: 'Task status updated successfully',
      data: updatedTask
    });

  } catch (err) {
    console.error('Task status update error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error updating task status',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// In your tasks router
router.get('/employee/:employeeId', authorize, async (req, res) => {
  try {
    const tasks = await Task.find({
      $or: [
        { assignee: req.params.employeeId },
        { assigneeId: req.params.employeeId }
      ]
    }).populate('assignee', 'name email');
    
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});
router.route('/assign')
  .post(protect, authorize('admin', 'manager'), assignTask);

router.route('/assigned')
  .get(protect, getAssignedTasks);

router.route('/my-tasks')
  .get(protect, getEmployeeTasks);

router.route('/:id').put(protect, updateTask);


router.route('/')
  .post(protect, createTask)
  .get(protect, authorize('admin', 'manager'), getAllTasks);

router.post('/', async (req, res) => {
  try {
    const { title, description, assignee, orderId, dueDate,  order_id, priority } = req.body;
    
    const task = new Task({
      title,
      description,
      assignee,
      orderId, 
      order_id,
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

module.exports = router;