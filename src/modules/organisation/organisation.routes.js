const express = require('express');
const organisationController = require('./organisation.controller');
const organisationValidation = require('./organisation.validation');
const validate = require('../../middleware/validation-handler');
const auth = require('../../middleware/auth');

const router = express.Router();

// Get all organisations (protected route)
router.get('/', auth, organisationController.getAllOrganisations);

// Get organisation by ID (protected route)
router.get(
  '/:organisation_id',
  auth,
  validate(organisationValidation.getById),
  organisationController.getOrganisationById
);

// Create new organisation (protected route)
router.post(
  '/',
  auth,
  validate(organisationValidation.create),
  organisationController.createOrganisation
);

// Update organisation (protected route)
router.put(
  '/:organisation_id',
  auth,
  validate(organisationValidation.update),
  organisationController.updateOrganisation
);

// Delete organisation (protected route)
router.delete(
  '/:organisation_id',
  auth,
  validate(organisationValidation.delete),
  organisationController.deleteOrganisation
);

// Get organisations by subscription code (protected route)
router.get(
  '/subscription/:subscription_code',
  auth,
  validate(organisationValidation.getBySubscriptionCode),
  organisationController.getOrganisationsBySubscriptionCode
);

module.exports = router;
