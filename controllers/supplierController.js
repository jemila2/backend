
const Order = require('../models/OrderModel');
const Supplier = require('../models/SupplierModel');

exports. Inventory = require('../models/InventoryModel');

exports. createSupplier = async (req, res) => {
  try {
    const supplier = new Supplier({
      ...req.body,
      createdBy: req.user._id
    });

    const savedSupplier = await supplier.save();
    res.status(201).json({
      success: true,
      data: savedSupplier
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports. getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().populate('products');
    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.getSupplierInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find({ supplier: req.user._id });
    res.status(200).json({ success: true, data: inventory });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.restockInventory = async (req, res) => {
  try {
    const { items } = req.body; // Expecting array of {productId, quantity}
    
    const updateOperations = items.map(item => ({
      updateOne: {
        filter: { _id: item.productId },
        update: { $inc: { stock: item.quantity } }
      }
    }));

    await Inventory.bulkWrite(updateOperations);
    
    res.status(200).json({ 
      success: true,
      message: 'Inventory updated successfully'
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

exports.getSupplierOrders = async (req, res) => {
  try {
    const orders = await Order.find({ supplier: req.params.id });
    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};