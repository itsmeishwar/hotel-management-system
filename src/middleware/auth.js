const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not active.'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error in authentication.'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    
    next();
  };
};

const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
    }
    
    // Admin users have all permissions
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check specific permission
    const userPermissions = req.user.permissions || {};
    
    if (permission === 'all' && userPermissions.all) {
      return next();
    }
    
    // Check nested permissions (e.g., 'reservations.write')
    const permissionParts = permission.split('.');
    const resource = permissionParts[0];
    const action = permissionParts[1];
    
    if (userPermissions[resource] && 
        (userPermissions[resource].includes(action) || 
         userPermissions[resource].includes('all'))) {
      return next();
    }
    
    // Check boolean permissions (e.g., 'checkin')
    if (userPermissions[permission] === true) {
      return next();
    }
    
    res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions.'
    });
  };
};

module.exports = {
  auth,
  authorize,
  checkPermission
};