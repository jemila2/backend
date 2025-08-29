
const checkRole = (allowedRoles) => {
  if (typeof allowedRoles === 'string') {
    allowedRoles = [allowedRoles];
  }

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied - no user role' 
      });
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    res.status(403).json({ 
      success: false,
      error: `Access denied - requires ${allowedRoles.join(' or ')} role` 
    });
  };
};

module.exports = checkRole;