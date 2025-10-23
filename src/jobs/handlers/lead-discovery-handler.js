const workflowConfigRepository = require('../../modules/workflow-config/workflow-config.data');
const organisationCreditBalanceRepository = require('../../modules/organisation-credit-balance/organisation-credit-balance.data');
const organisationCreditTransactionRepository = require('../../modules/organisation-credit-balance/organisation-credit-transaction.data');
const modelRepository = require('../../modules/models/models.data');
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
 * 4. Calculating credits used based on token usage and model pricing
 * 5. Creating debit transaction and updating organisation credit balance
 * 6. Updating workflow status to FINISHED
 * 
 * @param {Object} data - Job data containing workflow_config_id and workflow_id
 * @param {string} data.workflow_config_id - ID of the workflow config to process
 * @param {string} data.workflow_id - ID of the workflow to update
 * @param {string} data.organisation_id - ID of the organisation
 * @param {Object} job - Mock job object (for compatibility with existing code)
 * @returns {Promise<Object>} Result of the lead discovery process including credit usage
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
    
    // Calculate credits used based on token usage and model pricing
    let creditsUsed = 0;
    if (leadDiscoveryResult?.token_usage) {
      try {
        // Find the model by name to get credit rates
        const model = await modelRepository.findByName(llm_type);
        if (!model) {
          throw new Error(`Model not found: ${llm_type}`);
        }
        
        // Validate token usage data
        const inputTokens = leadDiscoveryResult.token_usage.input_tokens || 0;
        const outputTokens = leadDiscoveryResult.token_usage.output_tokens || 0;
        
        if (inputTokens < 0 || outputTokens < 0) {
          throw new Error('Invalid token usage: negative values not allowed');
        }
        
        // Calculate credits used: (input_tokens * input_credits_per_token) + (output_tokens * output_credits_per_token)
        const inputCredits = inputTokens * model.input_credits_per_token;
        const outputCredits = outputTokens * model.output_credits_per_token;
        creditsUsed = inputCredits + outputCredits;
        
        // Validate calculated credits
        if (creditsUsed < 0) {
          throw new Error('Invalid credit calculation: negative credits not allowed');
        }
        
        logger.info({
          workflow_id,
          model_name: llm_type,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          input_credits_per_token: model.input_credits_per_token,
          output_credits_per_token: model.output_credits_per_token,
          total_credits_used: creditsUsed
        }, 'Calculated credits used for lead discovery');
      } catch (error) {
        logger.error(error, { workflow_id, llm_type }, 'Failed to calculate credits for lead discovery');
        throw error;
      }
    } else {
      logger.warn({ workflow_id }, 'No token usage data found in lead discovery result, skipping credit calculation');
    }
    
    // Get current balance before deduction
    currentBalance = await organisationCreditBalanceRepository.findByOrganisationId(organisation_id);
    
    if (!currentBalance) {
      throw new Error(`No credit balance found for organisation: ${organisation_id}`);
    }
    
    // Check if sufficient credits are available
    if (currentBalance.credit_balance < creditsUsed) {
      throw new Error(`Insufficient credits. Available: ${currentBalance.credit_balance}, Required: ${creditsUsed}`);
    }
    
    let debitTransaction = null;
    let updatedCreditBalance = currentBalance.credit_balance;
    
    // Only deduct credits if credits were actually used
    if (creditsUsed > 0) {
      try {
        // Create debit transaction record
        debitTransaction = await organisationCreditTransactionRepository.create({
          organisationId: organisation_id,
          transactionType: 'D', // Debit
          creditAmount: creditsUsed,
          workflowId: workflow_id,
          dollarAmount: creditsUsed // Debits don't have dollar amounts
        });
        
        // Update organisation credit balance
        updatedCreditBalance = currentBalance.credit_balance - creditsUsed;
        await organisationCreditBalanceRepository.updateBalance(organisation_id, updatedCreditBalance);
        
        logger.info({
          workflow_id,
          organisation_id,
          credits_used: creditsUsed,
          previous_balance: currentBalance.credit_balance,
          new_balance: updatedCreditBalance,
          transaction_id: debitTransaction.transaction_id
        }, 'Successfully deducted credits and updated balance');
      } catch (error) {
        logger.error(error, { workflow_id, organisation_id, creditsUsed }, 'Failed to deduct credits');
        throw error;
      }
    } else {
      logger.info({ workflow_id, organisation_id }, 'No credits to deduct (creditsUsed = 0)');
    }
    
    logger.info({ 
      workflow_id,
      leads_generated: leadDiscoveryResult?.data?.inserted_leads_count || 0,
      total_lead_persons: leadDiscoveryResult?.data?.total_lead_persons_count || 0
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
      leads_generated: leadDiscoveryResult?.data?.inserted_leads_count || 0,
      total_lead_persons: leadDiscoveryResult?.data?.total_lead_persons_count || 0,
      credits_used: creditsUsed,
      previous_balance: currentBalance.credit_balance,
      new_balance: updatedCreditBalance,
      transaction_id: debitTransaction?.transaction_id || null,
      lead_discovery_result: leadDiscoveryResult
    };

    logger.info({ 
      workflow_id,
      leads_generated: result.leads_generated,
      total_lead_persons: result.total_lead_persons,
      credits_used: result.credits_used,
      new_balance: result.new_balance,
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
  }
}

module.exports = leadDiscoveryHandler;
