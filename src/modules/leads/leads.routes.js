const express = require('express');
const leadsController = require('./leads.controller');
const leadsValidation = require('./leads.validation');
const validate = require('../../middleware/validation-handler');
const auth = require('../../middleware/auth');

const router = express.Router();

// Lead routes
// Get all leads for organisation (protected route)
router.get('/', auth, leadsController.getAllLeads);

// Get leads count for organisation (protected route)
router.get('/count', auth, leadsController.getLeadsCount);

// Search leads by company name (protected route)
router.get('/search', auth, validate(leadsValidation.searchByCompanyName), leadsController.searchLeadsByCompanyName);

// Get lead by ID (protected route)
router.get(
  '/:lead_id',
  auth,
  validate(leadsValidation.getById),
  leadsController.getLeadById
);

// Create new lead (protected route)
router.post(
  '/',
  auth,
  validate(leadsValidation.create),
  leadsController.createLead
);

// Update lead (protected route)
router.put(
  '/:lead_id',
  auth,
  validate(leadsValidation.update),
  leadsController.updateLead
);

// Delete lead (protected route)
router.delete(
  '/:lead_id',
  auth,
  validate(leadsValidation.delete),
  leadsController.deleteLead
);

// Get leads by workflow ID (protected route)
router.get(
  '/workflow/:workflow_id',
  auth,
  validate(leadsValidation.getByWorkflow),
  leadsController.getLeadsByWorkflow
);

// Get leads count by workflow (protected route)
router.get(
  '/workflow/:workflow_id/count',
  auth,
  validate(leadsValidation.getCountByWorkflow),
  leadsController.getLeadsCountByWorkflow
);

// Lead person routes
// Get persons for a lead (protected route)
router.get(
  '/:lead_id/persons',
  auth,
  validate(leadsValidation.getPersons),
  leadsController.getPersonsForLead
);

// Add person to lead (protected route)
router.post(
  '/:lead_id/persons',
  auth,
  validate(leadsValidation.addPerson),
  leadsController.addPersonToLead
);

// Update person in lead (protected route)
router.put(
  '/:lead_id/persons/:person_id',
  auth,
  validate(leadsValidation.updatePerson),
  leadsController.updatePersonInLead
);

// Delete person from lead (protected route)
router.delete(
  '/:lead_id/persons/:person_id',
  auth,
  validate(leadsValidation.deletePerson),
  leadsController.deletePersonFromLead
);

module.exports = router;
