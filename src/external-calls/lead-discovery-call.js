const axios = require('axios');
const config = require('../config/development');

/**
 * External call to the lead generation API
 * @param {Object} params - The parameters for lead generation
 * @param {string} params.organisation_id - Organisation ID
 * @param {string} params.workflow_id - Workflow ID
 * @param {Array} params.domains - Array of domains to search
 * @param {Array} params.locations - Array of locations to search
 * @param {Array} params.designations - Array of designations to search
 * @param {number} params.lead_count - Number of leads to generate
 * @param {string} params.company_name - Company name for the workflow
 * @param {string} params.company_website - Company website URL
 * @param {Array} params.custom_instructions - Array of custom instructions for lead generation
 * @param {string} params.auth_token - Authentication token for the API
 * @param {string} params.llm_type - LLM type to use for lead generation
 * @returns {Promise<Object>} Response from the lead generation API
 */
async function leadDiscoveryCall(params) {
    const { 
        organisation_id = null,
        workflow_id = null,
        domains = [], 
        locations = [], 
        designations = [], 
        lead_count = 0, 
        company_name = null,
        company_website = null,
        custom_instructions = [],
        auth_token,
        llm_type = "GEMINI"
    } = params;
    
    try {
        const response = await axios({
            method: 'POST',
            url: `${config.agentApi.url}:${config.agentApi.port}/generate-leads`,
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `auth_token=${auth_token}`
            },
            data: {
                organisation_id,
                workflow_id,
                domains,
                locations,
                designations,
                lead_count,
                company_name,
                company_website,
                custom_instructions,
                llm_type
            }
        });
        
        return response.data;
    } catch (error) {
        throw new Error(`Lead discovery API call failed: ${error.message}`);
    }
}

module.exports = leadDiscoveryCall;
