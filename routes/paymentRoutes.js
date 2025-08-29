
const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, dateFrom, dateTo, search } = req.query;
  
    const query = {};
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.paymentDate = {};
      if (dateFrom) query.paymentDate.$gte = new Date(dateFrom);
      if (dateTo) query.paymentDate.$lte = new Date(dateTo);
    }
    if (search) {
      query.$or = [
        { paymentId: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } }
      ];
    }

    const payments = await Payment.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('customer', 'name email');

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      count: payments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      payments
    });
    
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

module.exports = router;