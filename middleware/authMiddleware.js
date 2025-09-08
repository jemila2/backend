

const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const ErrorResponse = require('../utils/errorResponse');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Public routes should skip authentication
    const publicRoutes = [
      '/api/admin/admin-exists',
      '/api/admin/register-admin',
      '/api/admin/admins/count',
      '/api/admin/health'
    ];

    if (publicRoutes.includes(req.path)) {
      return next();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized, no token'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    req.user = await User.findById(decoded.userId || decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized, user not found'
      });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Not authorized, token failed'
    });
  }
};

module.exports = { 
  protect, 
  authorize, 
  authenticateAdmin 

};
