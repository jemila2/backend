// const mongoose = require('mongoose');
// const orderSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   items: [{
//     serviceId: { type: Number, required: true },
//     name: { type: String, required: true },
//     price: { type: Number, required: true },
//     quantity: { type: Number, default: 1 },
//     type: { type: String, required: true }
//   }],
//   notes: String,
//   pickupAddress: String,
//   deliveryAddress: String,
//   pickupDate: Date,
//   deliveryDate: Date,
//   total: { type: Number, required: true },
//   status: { type: String, default: 'pending' }
// }, { timestamps: true });

//  module.exports = mongoose.model('Order', orderSchema);

// const mongoose = require('mongoose');

// const orderSchema = new mongoose.Schema({
//   user: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'User', 
//     required: true 
//   },
//   items: [{
//     serviceId: { 
//       type: Number, 
//       required: true 
//     }, // Original numeric ID field
//     service: { 
//       type: mongoose.Schema.Types.ObjectId, 
//       ref: 'Service' // New reference to Service model
//     },
//     name: { 
//       type: String, 
//       required: true 
//     },
//     price: { 
//       type: Number, 
//       required: true,
//       min: 0 // Ensure price isn't negative
//     },
//     quantity: { 
//       type: Number, 
//       default: 1,
//       min: 1 // Ensure at least 1 item
//     },
//     type: { 
//       type: String, 
//       required: true,
//       enum: ['laundry', 'drycleaning', 'ironing', 'special'] // Allowed service types
//     }
//   }],
//   notes: {
//     type: String,
//     default: '',
//     maxlength: 500 // Limit note length
//   },
//   pickupAddress: {
//     type: String,
//     required: true
//   },
//   deliveryAddress: {
//     type: String,
//     required: true
//   },
//   pickupDate: {
//     type: Date,
//     required: true,
//     validate: {
//       validator: function(value) {
//         // Ensure pickup date is in the future
//         return value > new Date();
//       },
//       message: 'Pickup date must be in the future'
//     }
//   },
//   deliveryDate: {
//     type: Date,
//     required: true,
//     validate: {
//       validator: function(value) {
//         // Ensure delivery date is after pickup date
//         return value > this.pickupDate;
//       },
//       message: 'Delivery date must be after pickup date'
//     }
//   },
//   total: {
//     type: Number,
//     required: true,
//     min: 0 // Ensure total isn't negative
//   },
//   status: {
//     type: String,
//     default: 'pending',
//     enum: ['pending', 'processing', 'completed', 'cancelled'] // Allowed statuses
//   },
//   paymentStatus: {
//     type: String,
//     default: 'unpaid',
//     enum: ['unpaid', 'paid', 'refunded'] // Payment status tracking
//   },
//   assignedTo: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User' // Staff member assigned to handle order
//   }
// }, { 
//   timestamps: true, // Adds createdAt and updatedAt
//   strictPopulate: false, // Allows populating non-existent fields
//   toJSON: { virtuals: true }, // Include virtuals when converting to JSON
//   toObject: { virtuals: true } // Include virtuals when converting to objects
// });

// // Virtual for formatted dates
// orderSchema.virtual('formattedPickupDate').get(function() {
//   return this.pickupDate.toLocaleDateString();
// });

// orderSchema.virtual('formattedDeliveryDate').get(function() {
//   return this.deliveryDate.toLocaleDateString();
// });

// // Calculate total automatically (alternative to manual total)
// orderSchema.pre('save', function(next) {
//   if (this.isModified('items')) {
//     this.total = this.items.reduce((sum, item) => {
//       return sum + (item.price * item.quantity);
//     }, 0);
//   }
//   next();
// });

// // Indexes for better query performance
// orderSchema.index({ user: 1 });
// orderSchema.index({ status: 1 });
// orderSchema.index({ pickupDate: 1 });
// orderSchema.index({ deliveryDate: 1 });

// module.exports = mongoose.model('Order', orderSchema);


// const mongoose = require('mongoose');

// const orderSchema = new mongoose.Schema({
//   user: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'User', 
//     required: true 
//   },
//   items: [{
//     serviceId: { 
//       type: Number, 
//       required: true 
//     },
//     // Only include service reference if you have a Service model
//     // service: { 
//     //   type: mongoose.Schema.Types.ObjectId, 
//     //   ref: 'Service' 
//     // },
//     name: { 
//       type: String, 
//       required: true 
//     },
//     price: { 
//       type: Number, 
//       required: true,
//       min: 0
//     },
//     quantity: { 
//       type: Number, 
//       default: 1,
//       min: 1
//     },
//     type: { 
//       type: String, 
//       required: true,
//       enum: ['laundry', 'drycleaning', 'ironing', 'special']
//     }
//   }],
//   notes: {
//     type: String,
//     default: '',
//     maxlength: 500
//   },
//   pickupAddress: {
//     type: String,
//     required: true
//   },
//   deliveryAddress: {
//     type: String,
//     required: true
//   },
//   pickupDate: {
//     type: Date,
//     required: true,
//     validate: {
//       validator: function(value) {
//         return value > new Date();
//       },
//       message: 'Pickup date must be in the future'
//     }
//   },
//   deliveryDate: {
//     type: Date,
//     required: true,
//     validate: {
//       validator: function(value) {
//         return value > this.pickupDate;
//       },
//       message: 'Delivery date must be after pickup date'
//     }
//   },
//   total: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   supplier: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Supplier'
//   },
//   supplierOrderId: String, // Supplier's reference number
//   supplierStatus: {
//     type: String,
//     enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
//     default: 'pending'
//   },
//     tasks: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Task'
//   }],
//   status: {
//     type: String,
//     default: 'pending',
//     enum: ['pending', 'processing', 'completed', 'cancelled']
//   },
//   paymentStatus: {
//     type: String,
//     default: 'unpaid',
//     enum: ['unpaid', 'paid', 'refunded']
//   },
//   assignedTo: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   }
// }, { 
//   timestamps: true,
//   strictPopulate: false,
//   toJSON: { 
//     virtuals: true,
//     transform: function(doc, ret) {
//       // Remove sensitive/unecessary fields when converting to JSON
//       delete ret.__v;
//       return ret;
//     }
//   },
//   toObject: { virtuals: true }
// });

// // Safe date formatting virtuals
// orderSchema.virtual('formattedPickupDate').get(function() {
//   return this.pickupDate ? this.pickupDate.toLocaleDateString() : null;
// });

// orderSchema.virtual('formattedDeliveryDate').get(function() {
//   return this.deliveryDate ? this.deliveryDate.toLocaleDateString() : null;
// });

// // Add duration virtual
// orderSchema.virtual('durationDays').get(function() {
//   if (!this.pickupDate || !this.deliveryDate) return null;
//   const diffTime = Math.abs(this.deliveryDate - this.pickupDate);
//   return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
// });

// // Auto calculate total
// orderSchema.pre('save', function(next) {
//   if (this.isModified('items')) {
//     this.total = this.items.reduce((sum, item) => {
//       return sum + (item.price * item.quantity);
//     }, 0);
//   }
//   next();
// });

// // Add pre-hook for date validation
// orderSchema.pre('save', function(next) {
//   if (this.isModified('pickupDate') || this.isModified('deliveryDate')) {
//     if (this.deliveryDate <= this.pickupDate) {
//       throw new Error('Delivery date must be after pickup date');
//     }
//   }
//   next();
// });

// // Indexes
// orderSchema.index({ user: 1 });
// orderSchema.index({ status: 1 });
// orderSchema.index({ pickupDate: 1 });
// orderSchema.index({ deliveryDate: 1 });
// orderSchema.index({ 'assignedTo': 1, 'status': 1 }); 

// // Add this method to your Order schema
// orderSchema.methods.updateStatusBasedOnTasks = async function() {
//   try {
//     // Populate tasks if they're not already populated
//     await this.populate('tasks');
    
//     if (this.tasks.length === 0) {
//       // No tasks, keep current status
//       return;
//     }
    
//     const allTasksCompleted = this.tasks.every(task => task.status === 'completed');
//     const anyTasksInProgress = this.tasks.some(task => task.status === 'in-progress');
    
//     if (allTasksCompleted && this.status !== 'completed') {
//       this.status = 'completed';
//       await this.save();
//       console.log(`Order ${this._id} automatically marked as completed`);
//     } else if (anyTasksInProgress && this.status === 'pending') {
//       this.status = 'processing';
//       await this.save();
//       console.log(`Order ${this._id} moved to processing`);
//     } else if (!allTasksCompleted && this.status === 'completed') {
//       this.status = 'processing';
//       await this.save();
//       console.log(`Order ${this._id} reverted to processing (tasks incomplete)`);
//     }
//   } catch (err) {
//     console.error('Error updating order status:', err);
//   }
// };

// module.exports = mongoose.model('Order', orderSchema);



const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  items: [{
    serviceId: { 
      type: Number, 
      required: true 
    },
    name: { 
      type: String, 
      required: true 
    },
    price: { 
      type: Number, 
      required: true,
      min: 0
    },
    quantity: { 
      type: Number, 
      default: 1,
      min: 1
    },
    type: { 
      type: String, 
      required: true,
      enum: ['laundry', 'drycleaning', 'ironing', 'special']
    }
  }],
  notes: {
    type: String,
    default: '',
    maxlength: 500
  },
  pickupAddress: {
    type: String,
    required: true
  },
  deliveryAddress: {
    type: String,
    default: ''
  },
  pickupDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Pickup date must be in the future'
    }
  },
  deliveryDate: {
    type: Date,
    default: null,
    validate: {
      validator: function(value) {
        // Only validate if deliveryDate exists and deliveryOption is 'delivery'
        if (!value) return true; // Null is allowed
        return value > this.pickupDate;
      },
      message: 'Delivery date must be after pickup date'
    }
  },
  deliveryOption: {
    type: String,
    required: true,
    enum: ['delivery', 'pickup']
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  supplierOrderId: String,
  supplierStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'processing', 'completed', 'cancelled']
  },
  paymentStatus: {
    type: String,
    default: 'unpaid',
    enum: ['unpaid', 'paid', 'refunded']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true,
  strictPopulate: false,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Safe date formatting virtuals
orderSchema.virtual('formattedPickupDate').get(function() {
  return this.pickupDate ? this.pickupDate.toLocaleDateString() : null;
});

orderSchema.virtual('formattedDeliveryDate').get(function() {
  return this.deliveryDate ? this.deliveryDate.toLocaleDateString() : null;
});

// Add duration virtual
orderSchema.virtual('durationDays').get(function() {
  if (!this.pickupDate || !this.deliveryDate) return null;
  const diffTime = Math.abs(this.deliveryDate - this.pickupDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Auto calculate total
orderSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.total = this.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  }
  next();
});

// Add pre-hook for date validation
orderSchema.pre('save', function(next) {
  // Only validate delivery date if it exists and delivery option is 'delivery'
  if (this.deliveryOption === 'delivery' && this.deliveryDate && this.deliveryDate <= this.pickupDate) {
    const err = new Error('Delivery date must be after pickup date');
    return next(err);
  }
  
  // For pickup orders, ensure deliveryDate is null
  if (this.deliveryOption === 'pickup') {
    this.deliveryDate = null;
    this.deliveryAddress = '';
  }
  
  next();
});

// Indexes
orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ pickupDate: 1 });
orderSchema.index({ deliveryDate: 1 });
orderSchema.index({ 'assignedTo': 1, 'status': 1 }); 
orderSchema.index({ deliveryOption: 1 });

// Add this method to your Order schema
orderSchema.methods.updateStatusBasedOnTasks = async function() {
  try {
    // Populate tasks if they're not already populated
    await this.populate('tasks');
    
    if (this.tasks.length === 0) {
      // No tasks, keep current status
      return;
    }
    
    const allTasksCompleted = this.tasks.every(task => task.status === 'completed');
    const anyTasksInProgress = this.tasks.some(task => task.status === 'in-progress');
    
    if (allTasksCompleted && this.status !== 'completed') {
      this.status = 'completed';
      await this.save();
      console.log(`Order ${this._id} automatically marked as completed`);
    } else if (anyTasksInProgress && this.status === 'pending') {
      this.status = 'processing';
      await this.save();
      console.log(`Order ${this._id} moved to processing`);
    } else if (!allTasksCompleted && this.status === 'completed') {
      this.status = 'processing';
      await this.save();
      console.log(`Order ${this._id} reverted to processing (tasks incomplete)`);
    }
  } catch (err) {
    console.error('Error updating order status:', err);
  }
};

module.exports = mongoose.model('Order', orderSchema);