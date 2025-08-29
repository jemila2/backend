const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employee',
    required: [true, 'Payroll must belong to an employee']
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: [true, 'Year is required']
  },
  basicSalary: {
    type: Number,
    required: [true, 'Basic salary is required']
  },
  allowances: {
    type: Number,
    default: 0
  },
  deductions: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    required: [true, 'Net salary is required']
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'paid'],
    default: 'pending'
  },
  paymentDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});


payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });


payrollSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'employee',
    select: 'name email position'
  });
  next();
});

const Payroll = mongoose.model('Payroll', payrollSchema);

module.exports = Payroll;