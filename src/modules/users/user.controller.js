const userRepository = require('./user.data');
const passwordResetTokenRepository = require('./password-reset-token.data');
const { sendEmail } = require('../../utils/email-service');
const { passwordResetEmail } = require('../../templates');
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
        secure: false,
        sameSite: 'lax',
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

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      
      // Check if user exists
      const user = await userRepository.findByEmail(email);
      if (!user) {
        // For security, don't reveal if email exists or not
        return responseHandler.success(res, null, 'If an account with that email exists, we have sent a password reset link.');
      }
      
      // Check for existing active tokens to prevent spam
      const activeTokensCount = await passwordResetTokenRepository.getActiveTokensCount(user.user_id);
      if (activeTokensCount >= 3) {
        return responseHandler.error(res, 'Too many password reset requests. Please wait before requesting another.', 429);
      }
      
      // Clean up expired tokens
      await passwordResetTokenRepository.deleteExpiredTokens();
      
      // Create expiration time (1 hour from now)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Create password reset token
      const tokenData = await passwordResetTokenRepository.createToken(user.user_id, expiresAt);
      
      // Send password reset email using common email function
      const resetUrl = `${config.passwordReset.frontendUrl}/reset-password?token=${tokenData.token}`;
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request - AdSaga',
        template: passwordResetEmail,
        templateData: {
          fullname: user.fullname,
          resetUrl: resetUrl,
          email: user.email
        }
      });
      
      return responseHandler.success(res, null, 'If an account with that email exists, we have sent a password reset link.');
    } catch (error) {
      req.log.error(error, 'Failed to process forgot password request');
      return responseHandler.error(res, 'An error occurred while processing your request. Please try again later.', 500);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      
      // Find the token
      const tokenData = await passwordResetTokenRepository.findByToken(token);
      if (!tokenData) {
        return responseHandler.error(res, 'Invalid or expired reset token', 400);
      }
      
      // Check if token is expired
      if (new Date() > new Date(tokenData.expires_at)) {
        return responseHandler.error(res, 'Reset token has expired. Please request a new password reset.', 400);
      }
      
      // Check if token is already used
      if (tokenData.used) {
        return responseHandler.error(res, 'Reset token has already been used. Please request a new password reset.', 400);
      }
      
      // Update user password
      const hashedPassword = await userRepository.hashPassword(password);
      await userRepository.updatePassword(tokenData.user_id, hashedPassword);
      
      // Mark token as used
      await passwordResetTokenRepository.markTokenAsUsed(tokenData.id);
      
      // Delete all other tokens for this user for security
      await passwordResetTokenRepository.deleteUserTokens(tokenData.user_id);
      
      return responseHandler.success(res, null, 'Password has been reset successfully. You can now login with your new password.');
    } catch (error) {
      req.log.error(error, 'Failed to reset password');
      return responseHandler.error(res, 'An error occurred while resetting your password. Please try again later.', 500);
    }
  }
}

module.exports = new UserController();
