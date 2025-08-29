const express = require('express');
const payrollController = require('../controllers/payrollController');
const authController = require('../controllers/authController');

const router = express.Router();



router
  .route('/')
  .get(payrollController.getAllPayrolls)
  .post(payrollController.processPayroll);

router
  .route('/:id/pay')
  .patch(payrollController.markAsPaid);

module.exports = router;