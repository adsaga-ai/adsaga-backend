const userRepository = require('./user.data');
const passwordResetTokenRepository = require('./password-reset-token.data');
const userEmailVerificationRepository = require('./user-email-verification.data');
const { sendEmail } = require('../../utils/email-service-sendgrid');
const { passwordResetEmail, inviteUserEmail } = require('../../templates');
const userInviteRepository = require('./user-invite.data');
const otpVerificationEmail = require('../../templates/otp-verification-email');
const responseHandler = require('../../utils/response-handler');
const jwt = require('jsonwebtoken');
const config = require('../../config/development');
const crypto = require('crypto');

class UserController {

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await userRepository.findByEmailWithoutOrgFilter(email);
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
        user
      }, 'Login successful');
    } catch (error) {
      req.log.error(error, 'Failed to login user');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async getUserById(req, res, next) {
    try {
      const { user_id } = req.params;
      const user = await userRepository.findById(user_id, req.user.organisation_id);
      
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
      const user = await userRepository.findByEmail(email, req.user.organisation_id);
      
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
      const existingUser = await userRepository.findById(user_id, req.user.organisation_id);
      if (!existingUser) {
        return responseHandler.error(res, 'User not found', 404);
      }
      
      // Check if email is being updated and if it already exists
      if (updateData.email && updateData.email !== existingUser.email) {
        const userWithEmail = await userRepository.findByEmail(updateData.email, req.user.organisation_id);
        if (userWithEmail) {
          return responseHandler.error(res, 'User with this email already exists', 409);
        }
      }
      
      // Update user
      const updatedUser = await userRepository.update(user_id, updateData, req.user.organisation_id);
      
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
      const existingUser = await userRepository.findById(user_id, req.user.organisation_id);
      if (!existingUser) {
        return responseHandler.error(res, 'User not found', 404);
      }
      
      const deletedUser = await userRepository.delete(user_id, req.user.organisation_id);
      
      return responseHandler.success(res, deletedUser, 'User deleted successfully');
    } catch (error) {
      req.log.error(error, 'Failed to delete user');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async getCurrentUser(req, res, next) {
    try {
      // Get current user data from req.user (set by auth middleware)
      const user = await userRepository.findByIdWithoutOrgFilter(req.user.user_id);
      
      if (!user) {
        return responseHandler.error(res, 'User not found', 404);
      }
      
      // Remove password from response
      delete user.password;
      
      return responseHandler.success(res, user, 'Current user retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to retrieve current user');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async getAllUsers(req, res, next) {
    try {
      const users = await userRepository.findAll(req.user.organisation_id);
      return responseHandler.success(res, users, 'Users retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to retrieve users');
      return responseHandler.error(res, error.message, 500);
    }
  }

  // Invite a user to current organisation
  async createInvite(req, res, next) {
    try {
      const organisationId = req.user.organisation_id;
      const invitedByUserId = req.user.user_id;
      const { email } = req.body;

      if (!organisationId) {
        return responseHandler.error(res, 'User must be associated with an organisation to invite users', 400);
      }

      // User can only belong to one organisation; check if target email already has an account
      const existingUser = await userRepository.findByEmailWithoutOrgFilter(email);
      if (existingUser && existingUser.organisation_id) {
        return responseHandler.error(res, 'User already belongs to an organisation', 409);
      }

      // Expire in 7 days
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Optionally cleanup expired invites
      await userInviteRepository.deleteExpired();

      const invite = await userInviteRepository.createInvite({
        organisationId,
        invitedEmail: email,
        invitedByUserId,
        expiresAt
      });

      const inviteUrl = `${config.passwordReset.frontendUrl}/invite/accept?token=${invite.token}`;

      try {
        await sendEmail({
          to: email,
          subject: 'Invitation to join organisation - AdSaga',
          template: inviteUserEmail,
          templateData: {
            organisationName: req.user.organisation_name || 'your organisation',
            inviteUrl,
            invitedEmail: email
          }
        });
      } catch (emailError) {
        req.log.error(emailError, 'Failed to send invite email');
      }

      return responseHandler.success(res, {
        invite_id: invite.invite_id,
        invited_email: invite.invited_email,
        expires_at: invite.expires_at
      }, 'Invitation created and email sent', 201);
    } catch (error) {
      req.log.error(error, 'Failed to create invite');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async listInvites(req, res, next) {
    try {
      const organisationId = req.user.organisation_id;
      if (!organisationId) {
        return responseHandler.error(res, 'User must be associated with an organisation to list invites', 400);
      }
      const invites = await userInviteRepository.listByOrganisation(organisationId);
      return responseHandler.success(res, invites, 'Invites retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to list invites');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async revokeInvite(req, res, next) {
    try {
      const organisationId = req.user.organisation_id;
      const { invite_id } = req.params;
      if (!organisationId) {
        return responseHandler.error(res, 'User must be associated with an organisation to revoke invites', 400);
      }
      const revoked = await userInviteRepository.revoke(invite_id, organisationId);
      if (!revoked) {
        return responseHandler.error(res, 'Invite not found or already processed', 404);
      }
      return responseHandler.success(res, revoked, 'Invite revoked successfully');
    } catch (error) {
      req.log.error(error, 'Failed to revoke invite');
      return responseHandler.error(res, error.message, 500);
    }
  }

  // Accept invite: creates account (if not exists) and associates to org
  async acceptInvite(req, res, next) {
    try {
      const { token, fullname, password } = req.body;

      const invite = await userInviteRepository.findByToken(token);
      if (!invite) {
        return responseHandler.error(res, 'Invalid or expired invite token', 400);
      }

      if (invite.revoked_at) {
        return responseHandler.error(res, 'Invite has been revoked', 400);
      }

      if (invite.accepted_at) {
        return responseHandler.error(res, 'Invite already accepted', 400);
      }

      if (new Date() > new Date(invite.expires_at)) {
        return responseHandler.error(res, 'Invite token has expired', 400);
      }

      // If user exists, ensure they are not part of another organisation
      const existingUser = await userRepository.findByEmailWithoutOrgFilter(invite.invited_email);
      if (existingUser && existingUser.organisation_id && existingUser.organisation_id !== invite.organisation_id) {
        return responseHandler.error(res, 'User already belongs to another organisation', 409);
      }

      let userId;
      if (!existingUser) {
        // Create new user with provided password and name
        userId = crypto.randomUUID();
        await userRepository.create({
          userId,
          organisationId: invite.organisation_id,
          fullname,
          email: invite.invited_email,
          password
        });
      } else {
        userId = existingUser.user_id;
        // Attach existing user to this organisation, but only if not already attached elsewhere
        if (!existingUser.organisation_id) {
          await userRepository.updateWithoutOrganisationId(userId, { organisation_id: invite.organisation_id });
        } else if (existingUser.organisation_id === invite.organisation_id) {
          // Already belongs; allow setting password if desired
          const hashed = await userRepository.hashPassword(password);
          await userRepository.updatePassword(userId, hashed, invite.organisation_id);
        }
      }

      // Mark invite accepted
      await userInviteRepository.markAccepted(invite.invite_id);

      return responseHandler.success(res, {
        organisation_id: invite.organisation_id,
        email: invite.invited_email
      }, 'Invitation accepted. Account ready to login.');
    } catch (error) {
      req.log.error(error, 'Failed to accept invite');
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
      const user = await userRepository.findByEmailWithoutOrgFilter(email);
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
      
      // Get user to retrieve organisation_id
      const user = await userRepository.findByIdWithoutOrgFilter(tokenData.user_id);
      if (!user) {
        return responseHandler.error(res, 'User not found', 404);
      }
      
      // Update user password
      const hashedPassword = await userRepository.hashPassword(password);
      await userRepository.updatePassword(tokenData.user_id, hashedPassword, user.organisation_id);
      
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

  // OTP-based registration flow methods
  async initiateRegistration(req, res, next) {
    try {
      const { email } = req.body;
      
      // Check if user already exists
      const existingUser = await userRepository.findByEmailWithoutOrgFilter(email);
      if (existingUser) {
        return responseHandler.error(res, 'User with this email already exists', 409);
      }
      
      // Clean up expired records
      await userEmailVerificationRepository.deleteExpiredRecords();
      
      // Check for active verification attempts (rate limiting)
      const activeCount = await userEmailVerificationRepository.getActiveVerificationCount(email);
      if (activeCount >= 3) {
        return responseHandler.error(res, 'Too many verification attempts. Please wait before requesting another OTP.', 429);
      }
      
      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Set expiration time (10 minutes from now)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      
      // Check if verification record exists for this email
      let verificationRecord = await userEmailVerificationRepository.findByEmail(email);
      
      if (verificationRecord) {
        // Update existing record with new OTP
        verificationRecord = await userEmailVerificationRepository.updateOtpCode(
          verificationRecord.id, 
          otpCode, 
          expiresAt
        );
      } else {
        // Create new verification record
        verificationRecord = await userEmailVerificationRepository.createVerificationRecord(
          email, 
          otpCode, 
          expiresAt
        );
      }
      
      // Send OTP email
      try {
        req.log.info({ email, otpCode }, 'Attempting to send OTP email');
        
        // Generate email HTML content
        const emailHtml = otpVerificationEmail(otpCode, false);
        req.log.debug({ email, htmlLength: emailHtml.length }, 'Generated email HTML content');
        
        const emailResult = await sendEmail({
          to: email,
          subject: 'Email Verification - AdSaga',
          html: emailHtml
        });
        req.log.info({ email, messageId: emailResult?.[0]?.headers?.['x-message-id'] }, 'OTP email sent successfully');
      } catch (emailError) {
        req.log.error(emailError, 'Failed to send OTP email');
        // Don't throw the error here - we still want to return success to user for security
        // but log the error for debugging
        console.error('Email sending failed:', emailError.message);
      }
      
      return responseHandler.success(res, {
        message: 'OTP sent successfully',
        expires_in: 600 // 10 minutes in seconds
      }, 'Verification code sent to your email');
    } catch (error) {
      req.log.error(error, 'Failed to initiate registration');
      return responseHandler.error(res, 'An error occurred while sending verification code. Please try again later.', 500);
    }
  }

  async verifyOtp(req, res, next) {
    try {
      const { email, otp_code } = req.body;
      
      // Find verification record
      const verificationRecord = await userEmailVerificationRepository.findByEmail(email);
      if (!verificationRecord) {
        return responseHandler.error(res, 'No verification record found for this email', 404);
      }
      
      // Check if already verified
      if (verificationRecord.verified) {
        return responseHandler.error(res, 'Email already verified', 400);
      }
      
      // Check if expired
      if (new Date() > new Date(verificationRecord.expires_at)) {
        return responseHandler.error(res, 'Verification code has expired. Please request a new one.', 400);
      }
      
      // Check attempts limit
      if (verificationRecord.attempts >= 3) {
        return responseHandler.error(res, 'Too many failed attempts. Please request a new verification code.', 429);
      }
      
      // Verify OTP
      const verifiedRecord = await userEmailVerificationRepository.verifyOtp(verificationRecord.id, otp_code);
      if (!verifiedRecord) {
        // Increment attempts
        await userEmailVerificationRepository.incrementAttempts(verificationRecord.id);
        return responseHandler.error(res, 'Invalid verification code', 400);
      }
      
      return responseHandler.success(res, {
        message: 'Email verified successfully',
        verified: true
      }, 'Email verification successful');
    } catch (error) {
      req.log.error(error, 'Failed to verify OTP');
      return responseHandler.error(res, 'An error occurred while verifying the code. Please try again later.', 500);
    }
  }

  async completeRegistration(req, res, next) {
    try {
      const { email, otp_code, fullname, password, organisation_id } = req.body;
      
      // Find verification record
      const verificationRecord = await userEmailVerificationRepository.findByEmail(email);
      if (!verificationRecord) {
        return responseHandler.error(res, 'No verification record found for this email', 404);
      }
      
      // Check if email is verified
      if (!verificationRecord.verified) {
        return responseHandler.error(res, 'Email must be verified before completing registration', 400);
      }
      
      // Double-check OTP for security
      if (verificationRecord.otp_code !== otp_code) {
        return responseHandler.error(res, 'Invalid verification code', 400);
      }
      
      // Check if user already created
      if (verificationRecord.is_user_created) {
        return responseHandler.error(res, 'User already registered with this email', 409);
      }
      
      // Generate UUID for user
      const userId = crypto.randomUUID();
      
      // Create user
      const newUser = await userRepository.create({
        userId,
        organisationId: organisation_id || null,
        fullname,
        email,
        password
      });
      
      // Mark user as created in verification record
      await userEmailVerificationRepository.markUserCreated(verificationRecord.id);
      
      // Remove password from response
      delete newUser.password;
      
      return responseHandler.success(res, newUser, 'User registered successfully', 201);
    } catch (error) {
      req.log.error(error, 'Failed to complete registration');
      return responseHandler.error(res, 'An error occurred while completing registration. Please try again later.', 500);
    }
  }

  async resendOtp(req, res, next) {
    try {
      const { email } = req.body;
      
      // Check if user already exists
      const existingUser = await userRepository.findByEmailWithoutOrgFilter(email);
      if (existingUser) {
        return responseHandler.error(res, 'User with this email already exists', 409);
      }
      
      // Find existing verification record
      const verificationRecord = await userEmailVerificationRepository.findByEmail(email);
      if (!verificationRecord) {
        return responseHandler.error(res, 'No verification record found. Please initiate registration first.', 404);
      }
      
      // Check if already verified
      if (verificationRecord.verified) {
        return responseHandler.error(res, 'Email already verified', 400);
      }
      
      // Check if user already created
      if (verificationRecord.is_user_created) {
        return responseHandler.error(res, 'User already registered with this email', 409);
      }
      
      // Generate new 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Set new expiration time (10 minutes from now)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      
      // Update OTP code and reset attempts
      const updatedRecord = await userEmailVerificationRepository.updateOtpCode(
        verificationRecord.id, 
        otpCode, 
        expiresAt
      );
      
      // Send new OTP email
      try {
        req.log.info({ email, otpCode }, 'Attempting to resend OTP email');
        
        // Generate email HTML content
        const emailHtml = otpVerificationEmail(otpCode, true);
        req.log.debug({ email, htmlLength: emailHtml.length }, 'Generated resend email HTML content');
        
        const emailResult = await sendEmail({
          to: email,
          subject: 'Email Verification - AdSaga (Resend)',
          html: emailHtml
        });
        req.log.info({ email, messageId: emailResult?.[0]?.headers?.['x-message-id'] }, 'OTP resend email sent successfully');
      } catch (emailError) {
        req.log.error(emailError, 'Failed to resend OTP email');
        // Don't throw the error here - we still want to return success to user for security
        // but log the error for debugging
        console.error('Email resend failed:', emailError.message);
      }
      
      return responseHandler.success(res, {
        message: 'OTP resent successfully',
        expires_in: 600 // 10 minutes in seconds
      }, 'New verification code sent to your email');
    } catch (error) {
      req.log.error(error, 'Failed to resend OTP');
      return responseHandler.error(res, 'An error occurred while resending verification code. Please try again later.', 500);
    }
  }
}

module.exports = new UserController();
