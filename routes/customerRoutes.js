
const express = require('express');
const router = express.Router();
const {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats
} = require('../controllers/customerController');

const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', 
  protect, 
  authorize('admin', 'staff'), 
  createCustomer
);

router.get('/', 
  protect, 
  authorize('admin', 'staff'), 
  getCustomers
);

router.get('/:id', 
  protect, 
  authorize('admin', 'staff', 'customer'), 
  getCustomer
);

router.get('/:id/stats', 
  protect, 
  authorize('admin', 'staff'), 
  getCustomerStats
);

router.put('/:id', 
  protect,
  authorize('admin', 'staff', 'customer'), 
  updateCustomer
);

router.delete('/:id', 
  protect, 
  authorize('admin'), 
  deleteCustomer
);

module.exports = router;