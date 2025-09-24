const express = require('express');
const userController = require('./user.controller');
const userValidation = require('./user.validation');
const validate = require('../../middleware/validation-handler');

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

// Get all users
router.get(
  '/',
  userController.getAllUsers
);

// Get user by ID
router.get(
  '/:user_id',
  validate(userValidation.getById),
  userController.getUserById
);

// Get user by email
router.get(
  '/email/:email',
  validate(userValidation.getByEmail),
  userController.getUserByEmail
);

// Update user
router.put(
  '/:user_id',
  validate(userValidation.update),
  userController.updateUser
);

// Delete user
router.delete(
  '/:user_id',
  validate(userValidation.delete),
  userController.deleteUser
);

module.exports = router;
