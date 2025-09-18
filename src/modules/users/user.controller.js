const userRepository = require('./user.data');
const responseHandler = require('../../utils/response-handler');
const jwt = require('jsonwebtoken');
const config = require('../../config/development');
const crypto = require('crypto');

class UserController {
  async register(req, res, next) {
    try {
      const { organisation_id, fullname, email, password } = req.body;
      
      // Check if user already exists
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        return responseHandler.error(res, 'User with this email already exists', 409);
      }
      
      // Generate UUID for user
      const userId = crypto.randomUUID();
      
      // Create user (organisation_id can be null if not provided)
      const newUser = await userRepository.create({
        userId,
        organisationId: organisation_id || null,
        fullname,
        email,
        password
      });
      
      // Remove password from response
      delete newUser.password;
      
      return responseHandler.success(res, newUser, 'User registered successfully', 201);
    } catch (error) {
      req.log.error(error, 'Failed to register user');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await userRepository.findByEmail(email);
      if (!user) {
        return responseHandler.error(res, 'Invalid email or password', 401);
      }
      
      // Verify password
      const isPasswordValid = await userRepository.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return responseHandler.error(res, 'Invalid email or password', 401);
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          user_id: user.user_id,
          email: user.email,
          organisation_id: user.organisation_id
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );
      
      // Set token in cookie
      res.cookie(config.jwt.cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      // Remove password from response
      delete user.password;
      
      return responseHandler.success(res, {
        user,
        token
      }, 'Login successful');
    } catch (error) {
      req.log.error(error, 'Failed to login user');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async getUserById(req, res, next) {
    try {
      const { user_id } = req.params;
      const user = await userRepository.findById(user_id);
      
      if (!user) {
        return responseHandler.error(res, 'User not found', 404);
      }
      
      return responseHandler.success(res, user, 'User retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to retrieve user by ID');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async getUserByEmail(req, res, next) {
    try {
      const { email } = req.params;
      const user = await userRepository.findByEmail(email);
      
      if (!user) {
        return responseHandler.error(res, 'User not found', 404);
      }
      
      // Remove password from response
      delete user.password;
      
      return responseHandler.success(res, user, 'User retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to retrieve user by email');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async updateUser(req, res, next) {
    try {
      const { user_id } = req.params;
      const updateData = req.body;
      
      // Check if user exists
      const existingUser = await userRepository.findById(user_id);
      if (!existingUser) {
        return responseHandler.error(res, 'User not found', 404);
      }
      
      // Check if email is being updated and if it already exists
      if (updateData.email && updateData.email !== existingUser.email) {
        const userWithEmail = await userRepository.findByEmail(updateData.email);
        if (userWithEmail) {
          return responseHandler.error(res, 'User with this email already exists', 409);
        }
      }
      
      // Update user
      const updatedUser = await userRepository.update(user_id, updateData);
      
      return responseHandler.success(res, updatedUser, 'User updated successfully');
    } catch (error) {
      req.log.error(error, 'Failed to update user');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const { user_id } = req.params;
      
      // Check if user exists
      const existingUser = await userRepository.findById(user_id);
      if (!existingUser) {
        return responseHandler.error(res, 'User not found', 404);
      }
      
      const deletedUser = await userRepository.delete(user_id);
      
      return responseHandler.success(res, deletedUser, 'User deleted successfully');
    } catch (error) {
      req.log.error(error, 'Failed to delete user');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async getAllUsers(req, res, next) {
    try {
      const users = await userRepository.findAll();
      return responseHandler.success(res, users, 'Users retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to retrieve users');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async logout(req, res, next) {
    try {
      // Clear the auth token cookie
      res.clearCookie(config.jwt.cookieName);
      
      return responseHandler.success(res, null, 'Logout successful');
    } catch (error) {
      req.log.error(error, 'Failed to logout user');
      return responseHandler.error(res, error.message, 500);
    }
  }
}

module.exports = new UserController();
