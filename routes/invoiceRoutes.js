
const express = require('express');
const router = express.Router();
const Invoice = require('../models/InvoiceModel');
const Customer = require('../models/CustomerModel');
router.post('/invoices', async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();
    
    await Customer.findByIdAndUpdate(
      req.body.customer,
      { $push: { invoices: invoice._id } }
    );
    
    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


router.get('/', async (req, res) => {
  try {
    const invoices = await Invoice.find().populate('customer');
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/customer/:customerId', async (req, res) => {
  try {
    const invoices = await Invoice.find({ customer: req.params.customerId });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;