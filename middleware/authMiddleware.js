

const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const ErrorResponse = require('../utils/errorResponse');


const protect = async (req, res, next) => {
  try {
    // Define public routes that don't require authentication
    // Use route patterns instead of full paths
    const publicRoutes = [
      '/admin-exists',
      '/register-admin',
      '/admins/count',
      '/health',
      '/auth/login',
      '/auth/register',
      '/auth/refresh'
    ];

    // Check if the current route is public
    const isPublicRoute = publicRoutes.some(route => 
      req.originalUrl.includes(route) || 
      req.path.includes(route)
    );

    if (isPublicRoute) {
      return next();
    }

    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized, no token'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token - handle both userId and id
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

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized, no user found'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

const authenticateAdmin = (req, res, next) => {
  return authorize('admin')(req, res, next);
};

module.exports = { 
  protect, 
  authorize, 
  authenticateAdmin 
};
