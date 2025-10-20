const express = require('express');
const workflowController = require('./workflow.controller');
const authMiddleware = require('../../middleware/auth');
const workflowValidation = require('./workflow.validation');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route POST /api/workflow/run/:workflow_config_id
 * @desc Run a workflow by workflow_config_id
 * @access Private
 */
router.post('/run/:workflow_config_id', 
  workflowValidation.validateRunWorkflow,
  workflowController.runWorkflow
);

/**
 * @route GET /api/workflow/status/:job_id
 * @desc Get workflow status by job ID
 * @access Private
 */
router.get('/status/:job_id',
  workflowValidation.validateJobId,
  workflowController.getWorkflowStatus
);

/**
 * @route GET /api/workflow
 * @desc Get all workflows for the organisation
 * @access Private
 */
router.get('/',
  workflowController.getWorkflows
);

/**
 * @route DELETE /api/workflow/cancel/:job_id
 * @desc Cancel a workflow by job ID
 * @access Private
 */
router.delete('/cancel/:job_id',
  workflowValidation.validateJobId,
  workflowController.cancelWorkflow
);

/**
 * @route DELETE /api/workflow/:workflow_id
 * @desc Delete a workflow by ID
 * @access Private
 */
router.delete('/:workflow_id',
  workflowValidation.validateWorkflowId,
  workflowController.deleteWorkflow
);

/**
 * @route GET /api/workflow/:workflow_id
 * @desc Get a specific workflow by ID
 * @access Private
 */
router.get('/:workflow_id',
  workflowValidation.validateWorkflowId,
  workflowController.getWorkflowById
);

/**
 * @route GET /api/workflow/:workflow_id/leads
 * @desc Get leads for a specific workflow
 * @access Private
 */
router.get('/:workflow_id/leads',
  workflowValidation.validateWorkflowId,
  workflowController.getWorkflowLeads
);

/**
 * @route GET /api/workflow/leads/:lead_id/persons
 * @desc Get lead persons for a specific lead
 * @access Private
 */
router.get('/leads/:lead_id/persons',
  workflowValidation.validateLeadId,
  workflowController.getLeadPersons
);

/**
 * @route PUT /api/workflow/persons/:person_id/verify
 * @desc Verify/unverify a lead person
 * @access Private
 */
router.put('/persons/:person_id/verify',
  workflowValidation.validatePersonId,
  workflowController.verifyLeadPerson
);

module.exports = router;
