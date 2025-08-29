
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please specify an assignee']
  },
  orderId: {  
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Task must be associated with an order']
  },
  dueDate: {
    type: Date,
    required: [true, 'Please specify a due date']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true
  }
}, {
  timestamps: true
});

// ADD THIS MIDDLEWARE to sync order status
taskSchema.post('save', async function() {
  try {
    const Order = mongoose.model('Order');
    const order = await Order.findById(this.orderId);
    
    if (order) {
      const Task = mongoose.model('Task');
      const tasks = await Task.find({ orderId: this.orderId });
      
      const allTasksCompleted = tasks.every(task => task.status === 'completed');
      const anyTasksInProgress = tasks.some(task => task.status === 'in-progress');
      
      if (allTasksCompleted && order.status !== 'completed') {
        order.status = 'completed';
        await order.save();
        console.log(`Order ${order._id} automatically completed`);
      } else if (anyTasksInProgress && order.status === 'pending') {
        order.status = 'processing';
        await order.save();
        console.log(`Order ${order._id} moved to processing`);
      } else if (!allTasksCompleted && order.status === 'completed') {
        order.status = 'processing';
        await order.save();
        console.log(`Order ${order._id} reverted to processing`);
      }
    }
  } catch (err) {
    console.error('Error updating order status:', err);
  }
});

// Also handle updates
taskSchema.post('findOneAndUpdate', async function(result) {
  try {
    if (result) {
      const Order = mongoose.model('Order');
      const order = await Order.findById(result.orderId);
      
      if (order) {
        const Task = mongoose.model('Task');
        const tasks = await Task.find({ orderId: result.orderId });
        
        const allTasksCompleted = tasks.every(task => task.status === 'completed');
        const anyTasksInProgress = tasks.some(task => task.status === 'in-progress');
        
        if (allTasksCompleted && order.status !== 'completed') {
          order.status = 'completed';
          await order.save();
        } else if (anyTasksInProgress && order.status === 'pending') {
          order.status = 'processing';
          await order.save();
        } else if (!allTasksCompleted && order.status === 'completed') {
          order.status = 'processing';
          await order.save();
        }
      }
    }
  } catch (err) {
    console.error('Error in task post-update hook:', err);
  }
});

module.exports = mongoose.model('Task', taskSchema);