
const Customer = require('../models/CustomerModel');
const Order = require('../models/OrderModel');
exports.createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer with this email already exists' 
      });
    }

    const customer = await Customer.create({
      name,
      email,
      phone,
      address,
      joinDate: new Date()
    });

    // Send welcome email
    await sendWelcomeEmail(email, name);

    res.status(201).json({ 
      success: true, 
      data: customer 
    });

  } catch (err) {
    console.error('Error creating customer:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Server error creating customer' 
    });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Customer.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: customers
    });

  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Server error fetching customers' 
    });
  }
};

exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Customer not found' 
      });
    }

    // Get customer's orders with pagination
    const orders = await Order.find({ user: req.params.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        ...customer.toObject(),
        orders
      }
    });

  } catch (err) {
    console.error('Error fetching customer:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Server error fetching customer' 
    });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    if (email) {
      const existingCustomer = await Customer.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      if (existingCustomer) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email already in use by another customer' 
        });
      }
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, address },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Customer not found' 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: customer 
    });

  } catch (err) {
    console.error('Error updating customer:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Server error updating customer' 
    });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Customer not found' 
      });
    }

    // Delete customer's orders first
    await Order.deleteMany({ user: req.params.id });

    // Then delete the customer
    await customer.remove();

    res.status(200).json({ 
      success: true, 
      data: {} 
    });

  } catch (err) {
    console.error('Error deleting customer:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Server error deleting customer' 
    });
  }
};

exports.getCustomerStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.params.id) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$total" },
          avgOrderValue: { $avg: "$total" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalOrders: 0,
        totalSpent: 0,
        avgOrderValue: 0
      }
    });

  } catch (err) {
    console.error('Error getting customer stats:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Server error getting customer stats' 
    });
  }
};