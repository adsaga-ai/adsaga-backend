const workflowConfigRepository = require('./workflow-config.data');
const responseHandler = require('../../utils/response-handler');
const crypto = require('crypto');

class WorkflowConfigController {
  async getAllWorkflowConfigs(req, res, next) {
    try {
      // Get organisation from auth middleware
      const organisationId = req.user.organisation_id;
      
      // Check if user has an organisation
      if (!organisationId) {
        return responseHandler.error(res, 'User must be associated with an organisation to view workflow configs', 400);
      }
      
      const workflowConfigs = await workflowConfigRepository.findByOrganisationId(organisationId);
      return responseHandler.success(res, workflowConfigs, 'Workflow configs retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to retrieve workflow configs');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async getWorkflowConfigById(req, res, next) {
    try {
      const { workflow_config_id } = req.params;
      const organisationId = req.user.organisation_id;
      
      // Check if user has an organisation
      if (!organisationId) {
        return responseHandler.error(res, 'User must be associated with an organisation to view workflow configs', 400);
      }
      
      const workflowConfig = await workflowConfigRepository.findById(workflow_config_id);
      
      if (!workflowConfig) {
        return responseHandler.error(res, 'Workflow config not found', 404);
      }
      
      // Check if the workflow config belongs to the user's organisation
      if (workflowConfig.organisation_id !== organisationId) {
        return responseHandler.error(res, 'Access denied: Workflow config does not belong to your organisation', 403);
      }
      
      return responseHandler.success(res, workflowConfig, 'Workflow config retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to retrieve workflow config by ID');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async getWorkflowConfigsByOrganisation(req, res, next) {
    try {
      // Get organisation from auth middleware
      const organisationId = req.user.organisation_id;
      
      // Check if user has an organisation
      if (!organisationId) {
        return responseHandler.error(res, 'User must be associated with an organisation to view workflow configs', 400);
      }
      
      const workflowConfigs = await workflowConfigRepository.findByOrganisationId(organisationId);
      
      return responseHandler.success(res, workflowConfigs, 'Workflow configs retrieved successfully by organisation');
    } catch (error) {
      req.log.error(error, 'Failed to retrieve workflow configs by organisation');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async getWorkflowConfigsByUser(req, res, next) {
    try {
      const userId = req.user.user_id;
      const workflowConfigs = await workflowConfigRepository.findByCreatedBy(userId);
      
      return responseHandler.success(res, workflowConfigs, 'Workflow configs retrieved successfully by user');
    } catch (error) {
      req.log.error(error, 'Failed to retrieve workflow configs by user');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async createWorkflowConfig(req, res, next) {
    try {
      const { 
        domains, 
        locations, 
        designations, 
        runs_at, 
        leads_count 
      } = req.body;
      
      // Get user and organisation from auth middleware
      const userId = req.user.user_id;
      const organisationId = req.user.organisation_id;
      
      // Check if user has an organisation
      if (!organisationId) {
        return responseHandler.error(res, 'User must be associated with an organisation to create workflow config', 400);
      }
      
      // Generate UUID for workflow config
      const workflowConfigId = crypto.randomUUID();
      
      // Create workflow config
      const newWorkflowConfig = await workflowConfigRepository.create({
        workflowConfigId,
        organisationId: organisationId,
        domains: domains || [],
        locations: locations || [],
        designations: designations || [],
        runsAt: runs_at || null,
        leadsCount: leads_count || 0,
        createdBy: userId
      });
      
      return responseHandler.success(res, newWorkflowConfig, 'Workflow config created successfully', 201);
    } catch (error) {
      req.log.error(error, 'Failed to create workflow config');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async updateWorkflowConfig(req, res, next) {
    try {
      const { workflow_config_id } = req.params;
      const { 
        domains, 
        locations, 
        designations, 
        runs_at, 
        leads_count 
      } = req.body;
      
      // Check if workflow config exists
      const existingWorkflowConfig = await workflowConfigRepository.findById(workflow_config_id);
      if (!existingWorkflowConfig) {
        return responseHandler.error(res, 'Workflow config not found', 404);
      }
      
      // Update workflow config
      const updatedWorkflowConfig = await workflowConfigRepository.update(workflow_config_id, {
        domains,
        locations,
        designations,
        runsAt: runs_at,
        leadsCount: leads_count
      });
      
      return responseHandler.success(res, updatedWorkflowConfig, 'Workflow config updated successfully');
    } catch (error) {
      req.log.error(error, 'Failed to update workflow config');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async deleteWorkflowConfig(req, res, next) {
    try {
      const { workflow_config_id } = req.params;
      
      // Check if workflow config exists
      const existingWorkflowConfig = await workflowConfigRepository.findById(workflow_config_id);
      if (!existingWorkflowConfig) {
        return responseHandler.error(res, 'Workflow config not found', 404);
      }
      
      const deletedWorkflowConfig = await workflowConfigRepository.delete(workflow_config_id);
      
      return responseHandler.success(res, deletedWorkflowConfig, 'Workflow config deleted successfully');
    } catch (error) {
      req.log.error(error, 'Failed to delete workflow config');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async updateLeadsCount(req, res, next) {
    try {
      const { workflow_config_id } = req.params;
      const { leads_count } = req.body;
      
      // Check if workflow config exists
      const existingWorkflowConfig = await workflowConfigRepository.findById(workflow_config_id);
      if (!existingWorkflowConfig) {
        return responseHandler.error(res, 'Workflow config not found', 404);
      }
      
      // Update leads count
      const updatedWorkflowConfig = await workflowConfigRepository.updateLeadsCount(workflow_config_id, leads_count);
      
      return responseHandler.success(res, updatedWorkflowConfig, 'Leads count updated successfully');
    } catch (error) {
      req.log.error(error, 'Failed to update leads count');
      return responseHandler.error(res, error.message, 500);
    }
  }
}

module.exports = new WorkflowConfigController();
