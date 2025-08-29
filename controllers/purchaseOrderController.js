
const PurchaseOrder = require('../models/PurchaseOrder');

exports.createPurchaseOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json({ success: true, data: po });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getPurchaseOrders = async (req, res) => {
  try {
    const orders = await PurchaseOrder.find().populate('supplier items.product');
    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getPurchaseOrder = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id)
      .populate('supplier items.product');
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};