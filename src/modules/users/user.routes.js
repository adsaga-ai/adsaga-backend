const express = require('express');
const userController = require('./user.controller');
const userValidation = require('./user.validation');
const validate = require('../../middleware/validation-handler');
const auth = require('../../middleware/auth');

const router = express.Router();

// OTP-based registration flow
// Step 1: Initiate registration (send OTP)
router.post(
  '/register/initiate',
  validate(userValidation.initiateRegistration),
  userController.initiateRegistration
);

// Step 2: Verify OTP
router.post(
  '/register/verify-otp',
  validate(userValidation.verifyOtp),
  userController.verifyOtp
);

// Step 3: Complete registration (set password)
router.post(
  '/register/complete',
  validate(userValidation.completeRegistration),
  userController.completeRegistration
);

// Resend OTP
router.post(
  '/register/resend-otp',
  validate(userValidation.resendOtp),
  userController.resendOtp
);


// Login user
router.post(
  '/login',
  validate(userValidation.login),
  userController.login
);

// Logout user
router.post(
  '/logout',
  userController.logout
);

// Forgot password
router.post(
  '/forgot-password',
  validate(userValidation.forgotPassword),
  userController.forgotPassword
);

// Reset password
router.post(
  '/reset-password',
  validate(userValidation.resetPassword),
  userController.resetPassword
);

// Get current user (protected route)
router.get(
  '/me',
  auth,
  userController.getCurrentUser
);

// Get all users (protected route)
router.get(
  '/',
  auth,
  userController.getAllUsers
);

// Organisation Invites
router.post(
  '/invites',
  auth,
  validate(userValidation.createInvite),
  userController.createInvite
);

router.get(
  '/invites',
  auth,
  userController.listInvites
);

router.post(
  '/invites/accept',
  validate(userValidation.acceptInvite),
  userController.acceptInvite
);

router.post(
  '/invites/:invite_id/revoke',
  auth,
  validate(userValidation.revokeInvite),
  userController.revokeInvite
);

// Get user by ID (protected route)
router.get(
  '/:user_id',
  auth,
  validate(userValidation.getById),
  userController.getUserById
);

// Get user by email (protected route)
router.get(
  '/email/:email',
  auth,
  validate(userValidation.getByEmail),
  userController.getUserByEmail
);

// Update user (protected route)
router.put(
  '/:user_id',
  auth,
  validate(userValidation.update),
  userController.updateUser
);

// Delete user (protected route)
router.delete(
  '/:user_id',
  auth,
  validate(userValidation.delete),
  userController.deleteUser
);

module.exports = router;
