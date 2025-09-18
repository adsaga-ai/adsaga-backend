const express = require('express');
const userController = require('./user.controller');
const userValidation = require('./user.validation');
const validate = require('../../middleware/validation-handler');

const router = express.Router();

// Register new user
router.post(
  '/register',
  validate(userValidation.register),
  userController.register
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
