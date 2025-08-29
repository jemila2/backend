// models/Payment.js
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    required: true,
    default: 'pending'
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'cash', 'other'],
    required: true
  },
  reference: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


PaymentSchema.index({ paymentDate: -1 });
PaymentSchema.index({ customer: 1, status: 1 });

PaymentSchema.virtual('amountFormatted').get(function() {
  return `$${this.amount.toFixed(2)}`;
});

module.exports = mongoose.model('Payment', PaymentSchema);