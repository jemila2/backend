
const Invoice = require('../models/InvoiceModel');
const Customer = require('../models/CustomerModel');
const { generateInvoicePDF } = require('../pdfService');
const path = require('path');
const fs = require('fs');

exports.createInvoice = async (req, res) => {
  try {
    
    const items = req.body.items.map(item => ({
      ...item,
      total: item.quantity * item.price
    }));
    
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * (req.body.taxRate || 0) / 100;
    const grandTotal = subtotal + tax - (req.body.discount || 0);
    
    const invoiceData = {
      ...req.body,
      items,
      subtotal,
      tax,
      grandTotal,
      issuedBy: req.user._id
    };
    
    const invoice = new Invoice(invoiceData);
    await invoice.save();
    
    // Add to customer
    await Customer.findByIdAndUpdate(
      req.body.customer,
      { $push: { invoices: invoice._id } }
    );
    
    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('customer');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    const uploadsDir = path.join(__dirname, '../uploads/invoices');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, `${invoice.invoiceNumber}.pdf`);
    await generateInvoicePDF(invoice, invoice.customer, filePath);
    
    res.download(filePath);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getSupplierInventory = async (req, res) => {
  try {
    // Your logic here
    res.status(200).json({ success: true, data: [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.restockInventory = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const updatedItem = await Inventory.findOneAndUpdate(
      { _id: productId },
      { $inc: { stock: quantity } },
      { new: true }
    );

    res.status(200).json({ 
      success: true, 
      message: 'Inventory restocked',
      data: updatedItem
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};