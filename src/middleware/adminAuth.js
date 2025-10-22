const jwt = require('jsonwebtoken');
const config = require('../config/development');
const adminRepository = require('../modules/admin/admin.data');

const adminAuth = async (req, res, next) => {
  try {
    // Extract admin token from cookie
    const token = req.cookies['admin_token'];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Admin access denied. No token provided.'
      });
    }
    
    // Verify admin token
    const decoded = jwt.verify(token, config.jwt.adminSecret);

    // Get admin from database to ensure admin still exists
    const admin = await adminRepository.findById(decoded.admin_id);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin access denied. Admin not found.'
      });
    }
    
    // Add admin info to request object
    req.admin = {
      admin_id: admin.admin_id,
      email: admin.email,
      role: 'admin',
      fullname: admin.fullname
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Admin access denied. Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Admin access denied. Token expired.'
      });
    }
    
    req.log.error(error, 'Admin authentication middleware error');
    return res.status(500).json({
      success: false,
      message: 'Internal server error during admin authentication.'
    });
  }
};

module.exports = adminAuth;
