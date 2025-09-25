const pool = require('../../config/database-connection');
const leadPersonRepository = require('./lead-person.data');

class LeadsRepository {
  async findAll(organisationId) {
    try {
      const query = `
        SELECT 
          l.lead_id,
          l.organisation_id,
          l.workflow_id,
          l.company_name,
          l.company_description,
          l.company_locations,
          l.website,
          l.phone_numbers,
          l.emails,
          l.created_at,
          l.updated_at,
          w.is_running as workflow_is_running,
          w.started_at as workflow_started_at,
          w.finished_at as workflow_finished_at
        FROM leads l
        LEFT JOIN workflows w ON l.workflow_id = w.workflow_id
        WHERE l.organisation_id = $1
        ORDER BY l.created_at DESC
      `;
      const result = await pool.query(query, [organisationId]);
      
      // Fetch related lead persons for each lead
      const leadsWithPersons = await Promise.all(
        result.rows.map(async (lead) => {
          const persons = await leadPersonRepository.findByLeadId(lead.lead_id);
          
          return {
            ...lead,
            persons
          };
        })
      );
      
      return leadsWithPersons;
    } catch (error) {
      throw new Error(`Failed to fetch leads: ${error.message}`);
    }
  }

  async findById(leadId, organisationId) {
    try {
      const query = `
        SELECT 
          l.lead_id,
          l.organisation_id,
          l.workflow_id,
          l.company_name,
          l.company_description,
          l.company_locations,
          l.website,
          l.phone_numbers,
          l.emails,
          l.created_at,
          l.updated_at,
          w.is_running as workflow_is_running,
          w.started_at as workflow_started_at,
          w.finished_at as workflow_finished_at
        FROM leads l
        LEFT JOIN workflows w ON l.workflow_id = w.workflow_id
        WHERE l.lead_id = $1 AND l.organisation_id = $2
      `;
      const result = await pool.query(query, [leadId, organisationId]);
      
      if (!result.rows[0]) {
        return null;
      }
      
      const lead = result.rows[0];
      
      // Fetch related lead persons
      const persons = await leadPersonRepository.findByLeadId(lead.lead_id);
      
      return {
        ...lead,
        persons
      };
    } catch (error) {
      throw new Error(`Failed to fetch lead by ID: ${error.message}`);
    }
  }

  async create(leadData) {
    try {
      const { 
        organisationId, 
        workflowId, 
        companyName, 
        companyDescription, 
        companyLocations, 
        website, 
        phoneNumbers, 
        emails 
      } = leadData;
      
      const query = `
        INSERT INTO leads (
          lead_id, 
          organisation_id, 
          workflow_id, 
          company_name, 
          company_description, 
          company_locations, 
          website, 
          phone_numbers, 
          emails, 
          created_at, 
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        leadData.leadId,
        organisationId,
        workflowId,
        companyName,
        companyDescription || null,
        companyLocations || [],
        website || null,
        phoneNumbers || [],
        emails || []
      ]);
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create lead: ${error.message}`);
    }
  }

  async update(leadId, organisationId, leadData) {
    try {
      const { 
        companyName, 
        companyDescription, 
        companyLocations, 
        website, 
        phoneNumbers, 
        emails 
      } = leadData;
      
      const query = `
        UPDATE leads 
        SET 
          company_name = $1, 
          company_description = $2, 
          company_locations = $3, 
          website = $4, 
          phone_numbers = $5, 
          emails = $6, 
          updated_at = NOW()
        WHERE lead_id = $7 AND organisation_id = $8
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        companyName,
        companyDescription || null,
        companyLocations || [],
        website || null,
        phoneNumbers || [],
        emails || [],
        leadId,
        organisationId
      ]);
      
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update lead: ${error.message}`);
    }
  }

  async delete(leadId, organisationId) {
    try {
      const query = 'DELETE FROM leads WHERE lead_id = $1 AND organisation_id = $2 RETURNING *';
      const result = await pool.query(query, [leadId, organisationId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to delete lead: ${error.message}`);
    }
  }

  async findByWorkflowId(workflowId, organisationId) {
    try {
      const query = `
        SELECT 
          l.lead_id,
          l.organisation_id,
          l.workflow_id,
          l.company_name,
          l.company_description,
          l.company_locations,
          l.website,
          l.phone_numbers,
          l.emails,
          l.created_at,
          l.updated_at,
          w.is_running as workflow_is_running,
          w.started_at as workflow_started_at,
          w.finished_at as workflow_finished_at
        FROM leads l
        LEFT JOIN workflows w ON l.workflow_id = w.workflow_id
        WHERE l.workflow_id = $1 AND l.organisation_id = $2
        ORDER BY l.created_at DESC
      `;
      const result = await pool.query(query, [workflowId, organisationId]);
      
      // Fetch related lead persons for each lead
      const leadsWithPersons = await Promise.all(
        result.rows.map(async (lead) => {
          const persons = await leadPersonRepository.findByLeadId(lead.lead_id);
          
          return {
            ...lead,
            persons
          };
        })
      );
      
      return leadsWithPersons;
    } catch (error) {
      throw new Error(`Failed to fetch leads by workflow ID: ${error.message}`);
    }
  }

  async findByCompanyName(companyName, organisationId) {
    try {
      const query = `
        SELECT 
          l.lead_id,
          l.organisation_id,
          l.workflow_id,
          l.company_name,
          l.company_description,
          l.company_locations,
          l.website,
          l.phone_numbers,
          l.emails,
          l.created_at,
          l.updated_at,
          w.is_running as workflow_is_running,
          w.started_at as workflow_started_at,
          w.finished_at as workflow_finished_at
        FROM leads l
        LEFT JOIN workflows w ON l.workflow_id = w.workflow_id
        WHERE LOWER(l.company_name) LIKE LOWER($1) AND l.organisation_id = $2
        ORDER BY l.created_at DESC
      `;
      const result = await pool.query(query, [`%${companyName}%`, organisationId]);
      
      // Fetch related lead persons for each lead
      const leadsWithPersons = await Promise.all(
        result.rows.map(async (lead) => {
          const persons = await leadPersonRepository.findByLeadId(lead.lead_id);
          
          return {
            ...lead,
            persons
          };
        })
      );
      
      return leadsWithPersons;
    } catch (error) {
      throw new Error(`Failed to fetch leads by company name: ${error.message}`);
    }
  }

  async exists(leadId, organisationId) {
    try {
      const query = 'SELECT 1 FROM leads WHERE lead_id = $1 AND organisation_id = $2';
      const result = await pool.query(query, [leadId, organisationId]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Failed to check lead existence: ${error.message}`);
    }
  }

  async getLeadsCount(organisationId) {
    try {
      const query = 'SELECT COUNT(*) as count FROM leads WHERE organisation_id = $1';
      const result = await pool.query(query, [organisationId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw new Error(`Failed to get leads count: ${error.message}`);
    }
  }

  async getLeadsCountByWorkflow(workflowId, organisationId) {
    try {
      const query = 'SELECT COUNT(*) as count FROM leads WHERE workflow_id = $1 AND organisation_id = $2';
      const result = await pool.query(query, [workflowId, organisationId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw new Error(`Failed to get leads count by workflow: ${error.message}`);
    }
  }
}

module.exports = new LeadsRepository();
