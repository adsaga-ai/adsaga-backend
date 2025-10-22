const express = require('express');
const adminController = require('./admin.controller');
const adminValidation = require('./admin.validation');
const validate = require('../../middleware/validation-handler');
const adminAuth = require('../../middleware/adminAuth');
const modelRoutes = require('../models/models.routes');
const organisationCreditBalanceRoutes = require('../organisation-credit-balance/organisation-credit-balance.routes');
const organisationRoutes = require('../organisation/organisation.routes');

const router = express.Router();

// Public admin routes (no authentication required)
// Admin register
router.post(
  '/register',
  validate(adminValidation.create),
  adminController.register
);

// Admin login
router.post(
  '/login',
  validate(adminValidation.login),
  adminController.login
);

// Admin logout
router.post(
  '/logout',
  adminController.logout
);

// Protected admin routes (require admin authentication)
// Get current admin
router.get(
  '/me',
  adminAuth,
  adminController.getCurrentAdmin
);

// Models routes (must come before /:admin_id route)
router.use('/models', modelRoutes);

// Organisation Credit Balance routes (must come before /:admin_id route)
router.use('/organisation-credit-balances', organisationCreditBalanceRoutes);

// Organisation routes (must come before /:admin_id route)
router.use('/organisations', organisationRoutes);

// Get all admins
router.get(
  '/',
  adminAuth,
  adminController.getAllAdmins
);

// Get admin by ID
router.get(
  '/:admin_id',
  adminAuth,
  validate(adminValidation.getById),
  adminController.getAdminById
);

// Create new admin
router.post(
  '/',
  adminAuth,
  validate(adminValidation.create),
  adminController.createAdmin
);

// Update admin
router.put(
  '/:admin_id',
  adminAuth,
  validate(adminValidation.update),
  adminController.updateAdmin
);

// Delete admin
router.delete(
  '/:admin_id',
  adminAuth,
  validate(adminValidation.delete),
  adminController.deleteAdmin
);

// Change password
router.post(
  '/change-password',
  adminAuth,
  validate(adminValidation.changePassword),
  adminController.changePassword
);

module.exports = router;
