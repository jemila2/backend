const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.processPayroll = catchAsync(async (req, res, next) => {
  const { employee, month, year, allowances, deductions } = req.body;

  const emp = await Employee.findById(employee);
  if (!emp) {
    return next(new AppError('No employee found with that ID', 404));
  }

  const taxableIncome = emp.salary + (allowances || 0) - (deductions || 0);
  let tax = 0;
  
  if (taxableIncome > 50000) {
    tax = taxableIncome * 0.15;
  }

  const payroll = await Payroll.create({
    employee,
    month,
    year,
    basicSalary: emp.salary,
    allowances,
    deductions,
    tax,
    netSalary: taxableIncome - tax,
    status: 'processed'
  });

  res.status(201).json({
    status: 'success',
    data: {
      payroll
    }
  });
});

exports.getAllPayrolls = catchAsync(async (req, res, next) => {
  const payrolls = await Payroll.find();

  res.status(200).json({
    status: 'success',
    results: payrolls.length,
    data: {
      payrolls
    }
  });
});

exports.markAsPaid = catchAsync(async (req, res, next) => {
  const payroll = await Payroll.findByIdAndUpdate(
    req.params.id,
    {
      status: 'paid',
      paymentDate: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!payroll) {
    return next(new AppError('No payroll found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      payroll
    }
  });
});