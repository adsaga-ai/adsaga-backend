const workflowConfigRepository = require('../workflow-config/workflow-config.data');
const workflowRepository = require('./workflow.data');
const producerConnection = require('../../config/producer-connection');
const responseHandler = require('../../utils/response-handler');
const { v4: uuidv4 } = require('uuid');
const pino = require('pino');

const logger = pino({
  name: 'workflow-controller',
  level: process.env.LOG_LEVEL || 'info'
});

class WorkflowController {
  /**
   * Run a workflow by workflow_config_id
   * Creates a job to process lead discovery
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async runWorkflow(req, res, next) {
    try {
      const { workflow_config_id } = req.params;
      const organisationId = req.user.organisation_id;
      
      // Check if user has an organisation
      if (!organisationId) {
        return responseHandler.error(res, 'User must be associated with an organisation to run workflows', 400);
      }

      // Validate workflow_config_id
      if (!workflow_config_id) {
        return responseHandler.error(res, 'workflow_config_id is required', 400);
      }

      // Check if workflow config exists and belongs to the organisation
      const workflowConfig = await workflowConfigRepository.findById(workflow_config_id, organisationId);
      
      if (!workflowConfig) {
        return responseHandler.error(res, 'Workflow config not found or does not belong to your organisation', 404);
      }

      // Create workflow record with QUEUED status
      const workflowId = uuidv4();
      const workflow = await workflowRepository.create({
        workflowId,
        organisationId,
        workflowConfigId: workflow_config_id,
        status: 'QUEUED'
      });

      logger.info({ 
        workflow_id: workflowId,
        workflow_config_id, 
        organisation_id: organisationId,
        user_id: req.user.user_id,
        organisation_name: req.user.organisation_name
      }, 'Workflow record created with QUEUED status');

      // Ensure producer is initialized
      if (!producerConnection.isReady()) {
        await producerConnection.initialize();
      }

      const producer = producerConnection.getProducer();

      // Create lead discovery job
      const job = await producer.now('lead_discovery_handler', {
        workflow_config_id: workflow_config_id,
        workflow_id: workflowId,
        organisation_id: organisationId
      }, {
        priority: 'normal'
        // Note: concurrency is set at job definition level in the consumer
      });

      logger.info({ 
        workflow_id: workflowId,
        workflow_config_id, 
        job_id: job.id,
        organisation_id: organisationId,
        user_id: req.user.user_id,
        organisation_name: req.user.organisation_name
      }, 'Lead discovery job created');

      return responseHandler.success(res, {
        workflow_id: workflowId,
        job_id: job.id,
        workflow_config_id: workflow_config_id,
        status: 'QUEUED',
        message: 'Lead discovery workflow has been queued for processing'
      }, 'Workflow started successfully');

    } catch (error) {
      req.log.error(error, 'Failed to run workflow');
      return responseHandler.error(res, error.message, 500);
    }
  }

  /**
   * Get workflow status by job ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getWorkflowStatus(req, res, next) {
    try {
      const { job_id } = req.params;
      const organisationId = req.user.organisation_id;
      
      // Check if user has an organisation
      if (!organisationId) {
        return responseHandler.error(res, 'User must be associated with an organisation to view workflow status', 400);
      }

      // Validate job_id
      if (!job_id) {
        return responseHandler.error(res, 'job_id is required', 400);
      }

      // Ensure producer is initialized
      if (!producerConnection.isReady()) {
        await producerConnection.initialize();
      }

      const producer = producerConnection.getProducer();

      // Get job status
      const jobStatus = await producer.getJobStatus(job_id);
      
      if (!jobStatus) {
        return responseHandler.error(res, 'Job not found', 404);
      }

      return responseHandler.success(res, jobStatus, 'Workflow status retrieved successfully');

    } catch (error) {
      req.log.error(error, 'Failed to get workflow status');
      return responseHandler.error(res, error.message, 500);
    }
  }

  /**
   * Get all workflows for the organisation with pagination and search
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getWorkflows(req, res, next) {
    try {
      const organisationId = req.user.organisation_id;
      
      // Check if user has an organisation
      if (!organisationId) {
        return responseHandler.error(res, 'User must be associated with an organisation to view workflows', 400);
      }

      // Get query parameters for filtering, pagination, and search
      const { 
        status, 
        workflow_config_id, 
        page = 1, 
        limit = 10, 
        search,
        sort_by = 'started_at',
        sort_order = 'DESC'
      } = req.query;

      // Convert page and limit to numbers
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const offset = (pageNum - 1) * limitNum;

      // Get workflows with pagination and search
      const result = await workflowRepository.findWithPagination({
        organisationId,
        status,
        workflowConfigId: workflow_config_id,
        search,
        page: pageNum,
        limit: limitNum,
        offset,
        sortBy: sort_by,
        sortOrder: sort_order
      });

      logger.info({ 
        organisation_id: organisationId,
        user_id: req.user.user_id,
        workflows_count: result.workflows.length,
        total_count: result.totalCount,
        page: pageNum,
        limit: limitNum,
        filters: { status, workflow_config_id, search }
      }, 'Workflows retrieved successfully');

      return responseHandler.success(res, {
        workflows: result.workflows,
        pagination: {
          current_page: pageNum,
          per_page: limitNum,
          total_count: result.totalCount,
          total_pages: Math.ceil(result.totalCount / limitNum),
          has_next_page: pageNum < Math.ceil(result.totalCount / limitNum),
          has_prev_page: pageNum > 1
        },
        filters: { status, workflow_config_id, search }
      }, 'Workflows retrieved successfully');

    } catch (error) {
      req.log.error(error, 'Failed to get workflows');
      return responseHandler.error(res, error.message, 500);
    }
  }

  /**
   * Get a specific workflow by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getWorkflowById(req, res, next) {
    try {
      const { workflow_id } = req.params;
      const organisationId = req.user.organisation_id;
      
      // Check if user has an organisation
      if (!organisationId) {
        return responseHandler.error(res, 'User must be associated with an organisation to view workflow', 400);
      }

      // Validate workflow_id
      if (!workflow_id) {
        return responseHandler.error(res, 'workflow_id is required', 400);
      }

      const workflow = await workflowRepository.findById(workflow_id, organisationId);
      
      if (!workflow) {
        return responseHandler.error(res, 'Workflow not found or does not belong to your organisation', 404);
      }

      logger.info({ 
        workflow_id,
        organisation_id: organisationId,
        user_id: req.user.user_id,
        status: workflow.status
      }, 'Workflow retrieved successfully');

      return responseHandler.success(res, workflow, 'Workflow retrieved successfully');

    } catch (error) {
      req.log.error(error, 'Failed to get workflow by ID');
      return responseHandler.error(res, error.message, 500);
    }
  }

  /**
   * Cancel a workflow by job ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async cancelWorkflow(req, res, next) {
    try {
      const { job_id } = req.params;
      const organisationId = req.user.organisation_id;
      
      // Check if user has an organisation
      if (!organisationId) {
        return responseHandler.error(res, 'User must be associated with an organisation to cancel workflows', 400);
      }

      // Validate job_id
      if (!job_id) {
        return responseHandler.error(res, 'job_id is required', 400);
      }

      // Ensure producer is initialized
      if (!producerConnection.isReady()) {
        await producerConnection.initialize();
      }

      const producer = producerConnection.getProducer();

      // Cancel job
      const cancelled = await producer.cancelJob(job_id);
      
      if (!cancelled) {
        return responseHandler.error(res, 'Job not found or could not be cancelled', 404);
      }

      logger.info({ 
        job_id,
        organisation_id: organisationId,
        user_id: req.user.user_id,
        organisation_name: req.user.organisation_name
      }, 'Workflow job cancelled');

      return responseHandler.success(res, {
        job_id: job_id,
        status: 'cancelled'
      }, 'Workflow cancelled successfully');

    } catch (error) {
      req.log.error(error, 'Failed to cancel workflow');
      return responseHandler.error(res, error.message, 500);
    }
  }

  /**
   * Delete a workflow by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async deleteWorkflow(req, res, next) {
    try {
      const { workflow_id } = req.params;
      const organisationId = req.user.organisation_id;
      
      // Check if user has an organisation
      if (!organisationId) {
        return responseHandler.error(res, 'User must be associated with an organisation to delete workflows', 400);
      }

      // Validate workflow_id
      if (!workflow_id) {
        return responseHandler.error(res, 'workflow_id is required', 400);
      }

      // Check if workflow exists and belongs to the organisation
      const workflow = await workflowRepository.findById(workflow_id, organisationId);
      
      if (!workflow) {
        return responseHandler.error(res, 'Workflow not found or does not belong to your organisation', 404);
      }

      // Only allow deletion of QUEUED workflows
      if (workflow.status !== 'QUEUED') {
        return responseHandler.error(res, 'Only queued workflows can be deleted', 400);
      }

      // Delete the workflow
      const deletedWorkflow = await workflowRepository.delete(workflow_id, organisationId);
      
      if (!deletedWorkflow) {
        return responseHandler.error(res, 'Failed to delete workflow', 500);
      }

      logger.info({ 
        workflow_id,
        organisation_id: organisationId,
        user_id: req.user.user_id,
        organisation_name: req.user.organisation_name
      }, 'Workflow deleted successfully');

      return responseHandler.success(res, {
        workflow_id: workflow_id,
        message: 'Workflow deleted successfully'
      }, 'Workflow deleted successfully');

    } catch (error) {
      req.log.error(error, 'Failed to delete workflow');
      return responseHandler.error(res, error.message, 500);
    }
  }
}

module.exports = new WorkflowController();
