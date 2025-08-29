
const express = require('express');
const router = express.Router();


// const {
//   createSupplier,
//   getSuppliers,
//   getSupplier,
//   updateSupplier,
//   deleteSupplier,
//   getSupplierProducts,
//   getSupplierOrders
// } = require('../controllers/supplierController');
// const { protect, admin } = require('../middleware/authMiddleware');

// router.route('/')
//   .post(protect, admin, createSupplier)
//   .get(protect, getSuppliers);

// router.route('/:id')
//   .get(protect, getSupplier)
//   .put(protect, admin, updateSupplier)
//   .delete(protect, admin, deleteSupplier);

// router.get('/:id/products', protect, getSupplierProducts);
// router.get('/:id/orders', protect, getSupplierOrders);

module.exports = router;