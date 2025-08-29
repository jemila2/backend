

const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const ErrorResponse = require('../utils/errorResponse');

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    console.log('Authenticated user:', req.user._id);
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(401).json({ message: 'Not authorized' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('User not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`, 
          403
        )
      );
    }
    next();
  };
};

const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return next(new ErrorResponse('No token provided', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new ErrorResponse('User not found', 401));
    }

    if (user.role !== 'admin') {
      return next(new ErrorResponse('Admin access required', 403));
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    next(new ErrorResponse('Not authorized as admin', 401));
  }
};

module.exports = { 
  protect, 
  authorize, 
  authenticateAdmin 
};