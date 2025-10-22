const adminRepository = require('./admin.data');
const responseHandler = require('../../utils/response-handler');
const jwt = require('jsonwebtoken');
const config = require('../../config/development');

class AdminController {

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      // Find admin by email
      const admin = await adminRepository.findByEmail(email);
      if (!admin) {
        return responseHandler.error(res, 'Invalid email or password', 401);
      }
      
      // Verify password
      const isPasswordValid = await adminRepository.verifyPassword(password, admin.password);
      if (!isPasswordValid) {
        return responseHandler.error(res, 'Invalid email or password', 401);
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          admin_id: admin.admin_id,
          email: admin.email,
          role: 'admin'
        },
        config.jwt.adminSecret,
        { expiresIn: config.jwt.expiresIn }
      );
      
      // Set admin token in separate cookie
      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      // Update last login
      await adminRepository.updateLastLogin(admin.admin_id);
      
      // Remove password from response
      delete admin.password;
      
      return responseHandler.success(res, {
        admin
      }, 'Admin login successful');
    } catch (error) {
      req.log.error(error, 'Failed to login admin');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async logout(req, res, next) {
    try {
      // Clear admin cookie
      res.clearCookie('admin_token');
      
      return responseHandler.success(res, null, 'Admin logout successful');
    } catch (error) {
      req.log.error(error, 'Failed to logout admin');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async getCurrentAdmin(req, res, next) {
    try {
      const admin = await adminRepository.findById(req.admin.admin_id);
      if (!admin) {
        return responseHandler.error(res, 'Admin not found', 404);
      }
      
      // Remove password from response
      delete admin.password;
      
      return responseHandler.success(res, { admin }, 'Admin retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to get current admin');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async getAllAdmins(req, res, next) {
    try {
      const admins = await adminRepository.findAll();
      
      // Remove passwords from response
      const adminsWithoutPasswords = admins.map(admin => {
        delete admin.password;
        return admin;
      });
      
      return responseHandler.success(res, { admins: adminsWithoutPasswords }, 'Admins retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to get admins');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async getAdminById(req, res, next) {
    try {
      const { admin_id } = req.params;
      const admin = await adminRepository.findById(admin_id);
      
      if (!admin) {
        return responseHandler.error(res, 'Admin not found', 404);
      }
      
      // Remove password from response
      delete admin.password;
      
      return responseHandler.success(res, { admin }, 'Admin retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to get admin by ID');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async createAdmin(req, res, next) {
    try {
      const adminData = req.body;
      const admin = await adminRepository.create(adminData);
      
      return responseHandler.success(res, { admin }, 'Admin created successfully', 201);
    } catch (error) {
      req.log.error(error, 'Failed to create admin');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async updateAdmin(req, res, next) {
    try {
      const { admin_id } = req.params;
      const updateData = req.body;
      
      const admin = await adminRepository.update(admin_id, updateData);
      if (!admin) {
        return responseHandler.error(res, 'Admin not found', 404);
      }
      
      return responseHandler.success(res, { admin }, 'Admin updated successfully');
    } catch (error) {
      req.log.error(error, 'Failed to update admin');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async deleteAdmin(req, res, next) {
    try {
      const { admin_id } = req.params;
      
      // Prevent self-deletion
      if (admin_id === req.admin.admin_id) {
        return responseHandler.error(res, 'Cannot delete your own account', 400);
      }
      
      const admin = await adminRepository.delete(admin_id);
      if (!admin) {
        return responseHandler.error(res, 'Admin not found', 404);
      }
      
      return responseHandler.success(res, null, 'Admin deleted successfully');
    } catch (error) {
      req.log.error(error, 'Failed to delete admin');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const adminId = req.admin.admin_id;
      
      // Get current admin with password
      const admin = await adminRepository.findById(adminId);
      if (!admin) {
        return responseHandler.error(res, 'Admin not found', 404);
      }
      
      // Verify current password
      const isCurrentPasswordValid = await adminRepository.verifyPassword(currentPassword, admin.password);
      if (!isCurrentPasswordValid) {
        return responseHandler.error(res, 'Current password is incorrect', 400);
      }
      
      // Update password
      await adminRepository.changePassword(adminId, newPassword);
      
      return responseHandler.success(res, null, 'Password changed successfully');
    } catch (error) {
      req.log.error(error, 'Failed to change password');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async register(req, res, next) {
    try {
      const { fullname, email, password } = req.body;
      
      // Check if admin with email already exists
      const existingAdmin = await adminRepository.findByEmail(email);
      if (existingAdmin) {
        return responseHandler.error(res, 'Admin with this email already exists', 409);
      }
      
      // Create new admin
      const admin = await adminRepository.create({ fullname, email, password });
      
      // Remove password from response
      delete admin.password;
      
      return responseHandler.success(res, { admin }, 'Admin registered successfully', 201);
    } catch (error) {
      req.log.error(error, 'Failed to register admin');
      return responseHandler.error(res, error.message, 500);
    }
  }
}

module.exports = new AdminController();
