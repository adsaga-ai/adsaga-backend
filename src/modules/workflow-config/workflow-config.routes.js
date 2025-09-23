const express = require('express');
const workflowConfigController = require('./workflow-config.controller');
const workflowConfigValidation = require('./workflow-config.validation');
const validate = require('../../middleware/validation-handler');
const auth = require('../../middleware/auth');

const router = express.Router();

// Get all workflow configs (protected route)
router.get('/', auth, workflowConfigController.getAllWorkflowConfigs);

// Get workflow configs by organisation (protected route)
router.get(
  '/organisation',
  auth,
  workflowConfigController.getWorkflowConfigsByOrganisation
);

// Get workflow configs by user (protected route)
router.get(
  '/user/me',
  auth,
  workflowConfigController.getWorkflowConfigsByUser
);

// Get workflow config by ID (protected route)
router.get(
  '/:workflow_config_id',
  auth,
  validate(workflowConfigValidation.getById),
  workflowConfigController.getWorkflowConfigById
);

// Create new workflow config (protected route)
router.post(
  '/',
  auth,
  validate(workflowConfigValidation.create),
  workflowConfigController.createWorkflowConfig
);

// Update workflow config (protected route)
router.put(
  '/:workflow_config_id',
  auth,
  validate(workflowConfigValidation.update),
  workflowConfigController.updateWorkflowConfig
);

// Delete workflow config (protected route)
router.delete(
  '/:workflow_config_id',
  auth,
  validate(workflowConfigValidation.delete),
  workflowConfigController.deleteWorkflowConfig
);

// Update leads count (protected route)
router.patch(
  '/:workflow_config_id/leads-count',
  auth,
  validate(workflowConfigValidation.updateLeadsCount),
  workflowConfigController.updateLeadsCount
);

module.exports = router;
