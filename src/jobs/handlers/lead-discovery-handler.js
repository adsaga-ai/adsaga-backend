const workflowConfigRepository = require('../../modules/workflow-config/workflow-config.data');
const organisationCreditBalanceRepository = require('../../modules/organisation-credit-balance/organisation-credit-balance.data');
const workflowRepository = require('../../modules/workflow/workflow.data');
const leadDiscoveryCall = require('../../external-calls/lead-discovery-call');
const pool = require('../../config/database-connection');
const pino = require('pino');

const logger = pino({
  name: 'lead-discovery-handler',
  level: process.env.LOG_LEVEL || 'info'
});

/**
 * Lead Discovery Handler
 * Processes lead discovery jobs by:
 * 1. Getting workflow config
 * 2. Updating workflow status to RUNNING
 * 3. Calling external lead discovery API
 * 4. Updating workflow status to FINISHED
 * 
 * @param {Object} data - Job data containing workflow_config_id and workflow_id
 * @param {string} data.workflow_config_id - ID of the workflow config to process
 * @param {string} data.workflow_id - ID of the workflow to update
 * @param {string} data.organisation_id - ID of the organisation
 * @param {Object} job - Mock job object (for compatibility with existing code)
 * @returns {Promise<Object>} Result of the lead discovery process
 */
async function leadDiscoveryHandler(data, job) {
  const { workflow_config_id, workflow_id, organisation_id } = data;
  const llm_type = "GEMINI";
  
  if (!workflow_config_id) {
    throw new Error('workflow_config_id is required');
  }

  if (!workflow_id) {
    throw new Error('workflow_id is required');
  }

  if (!organisation_id) {
    throw new Error('organisation_id is required');
  }
  
  try {
    logger.info({ workflow_id, workflow_config_id, organisation_id }, 'Starting lead discovery process');

    // Step 1: Get the workflow config
    const workflowConfig = await workflowConfigRepository.findById(workflow_config_id, organisation_id);
    
    if (!workflowConfig) {
      throw new Error(`Workflow config not found: ${workflow_config_id} for organisation: ${organisation_id}`);
    }

    let currentBalance = await organisationCreditBalanceRepository.findByOrganisationId(organisation_id);
    if (!currentBalance || currentBalance.credit_balance <= 0) {
      throw new Error(`No credit balance found for this organisation: ${organisation_id}`);
    }

    logger.info({ 
      workflow_id,
      workflow_config_id, 
      organisation_id: workflowConfig.organisation_id,
      domains: workflowConfig.domains,
      locations: workflowConfig.locations,
      designations: workflowConfig.designations,
      leads_count: workflowConfig.leads_count,
      company_name: workflowConfig.company_name,
      company_website: workflowConfig.company_website,
      custom_instructions: workflowConfig.custom_instructions
    }, 'Retrieved workflow config');

    // Step 2: Update workflow status to RUNNING
    const startedAt = new Date();
    const updatedWorkflow = await workflowRepository.updateStatus(workflow_id, 'RUNNING', organisation_id);
    
    if (!updatedWorkflow) {
      throw new Error(`Workflow not found: ${workflow_id} for organisation: ${organisation_id}`);
    }
    
    logger.info({ workflow_id, started_at: startedAt }, 'Updated workflow status to RUNNING');

    // Step 3: Call the external lead discovery API
    logger.info({ workflow_id }, 'Calling external lead discovery API');
    
    const leadDiscoveryParams = {
      organisation_id: workflowConfig.organisation_id,
      workflow_id: workflow_id,
      domains: workflowConfig.domains || [],
      locations: workflowConfig.locations || [],
      designations: workflowConfig.designations || [],
      lead_count: workflowConfig.leads_count || 0,
      company_name: workflowConfig.company_name || null,
      company_website: workflowConfig.company_website || null,
      custom_instructions: workflowConfig.custom_instructions || [],
      llm_type: llm_type,
      auth_token: process.env.AGENT_API_AUTH_TOKEN || 'default-token' // You may want to get this from user context
    };

    const leadDiscoveryResult = await leadDiscoveryCall(leadDiscoveryParams);

    currentBalance = await organisationCreditBalanceRepository.findByOrganisationId(organisation_id);
    const updatedCreditBalance = currentBalance.credit_balance - leadDiscoveryResult?.leads?.length || 0;
    
    logger.info({ 
      workflow_id,
      leads_generated: leadDiscoveryResult?.leads?.length || 0
    }, 'Lead discovery API call completed');

    // Step 4: Update workflow status to FINISHED
    const finishedAt = new Date();
    const finalWorkflow = await workflowRepository.updateStatus(workflow_id, 'FINISHED', organisation_id);
    
    if (!finalWorkflow) {
      throw new Error(`Failed to update workflow status to FINISHED: ${workflow_id}`);
    }
    
    logger.info({ 
      workflow_id, 
      finished_at: finishedAt,
      duration_ms: finishedAt.getTime() - startedAt.getTime()
    }, 'Updated workflow status to FINISHED - process completed');

    // Return success result
    const result = {
      success: true,
      workflow_id: workflow_id,
      workflow_config_id,
      organisation_id: workflowConfig.organisation_id,
      started_at: startedAt,
      finished_at: finishedAt,
      duration_ms: finishedAt.getTime() - startedAt.getTime(),
      leads_generated: leadDiscoveryResult?.leads?.length || 0,
      lead_discovery_result: leadDiscoveryResult
    };

    logger.info({ 
      workflow_id,
      leads_generated: result.leads_generated,
      duration_ms: result.duration_ms
    }, 'Lead discovery process completed successfully');

    return result;

  } catch (error) {
    logger.error(error, { 
      workflow_config_id, 
      workflow_id 
    }, 'Lead discovery process failed');

    // Update workflow status to FINISHED (failed) if it exists
    if (workflow_id) {
      try {
        await workflowRepository.updateStatus(workflow_id, 'FINISHED', organisation_id);
        logger.info({ workflow_id }, 'Updated workflow status to FINISHED after failure');
      } catch (updateError) {
        logger.error(updateError, { workflow_id }, 'Failed to update workflow status after error');
      }
    }

    throw error;
  }
}

module.exports = leadDiscoveryHandler;
