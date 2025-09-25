const jwt = require('jsonwebtoken');
const config = require('../config/development');
const userRepository = require('../modules/users/user.data');

const auth = async (req, res, next) => {
  try {
    // Extract token from cookie
    const token = req.cookies[config.jwt.cookieName];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Get user from database to ensure user still exists
    const user = await userRepository.findByIdWithoutOrgFilter(decoded.user_id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not found.'
      });
    }
    
    // Add user info to request object
    req.user = {
      user_id: user.user_id,
      email: user.email,
      organisation_id: user.organisation_id,
      fullname: user.fullname
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token expired.'
      });
    }
    
    req.log.error(error, 'Authentication middleware error');
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

module.exports = auth;
