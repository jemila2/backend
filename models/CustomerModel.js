
const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
    unique: true,
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
   invoices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  
  strict: 'throw',
  minimize: false, 
  versionKey: false
});

CustomerSchema.pre('save', function(next) {
  if (this.isNew || this.isModified()) {
    this.$unset = this.$unset || {};
    this.$unset.customerId = "";
    delete this._doc.customerId;
  }
  next();
});

// Completely prevent any customerId index creation
CustomerSchema.post('init', function() {
  delete this._doc.customerId;
});

module.exports = mongoose.model('Customer', CustomerSchema);