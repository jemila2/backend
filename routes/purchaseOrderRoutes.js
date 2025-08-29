// routes/purchaseOrderRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrder
} = require('../controllers/purchaseOrderController');

router.post('/', protect, authorize('admin'), createPurchaseOrder);
router.get('/', protect, authorize('admin'), getPurchaseOrders);
router.get('/:id', protect, authorize('admin'), getPurchaseOrder);

module.exports = router;