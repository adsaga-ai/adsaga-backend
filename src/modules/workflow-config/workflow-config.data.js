const pool = require('../../config/database-connection');

class WorkflowConfigRepository {
  async findAll() {
    try {
      const query = `
        SELECT 
          wc.workflow_config_id,
          wc.organisation_id,
          wc.domains,
          wc.locations,
          wc.designations,
          wc.runs_at,
          wc.leads_count,
          wc.created_by,
          wc.created_at,
          wc.updated_at,
          o.organisation_name,
          u.fullname as created_by_name
        FROM workflow_config wc
        LEFT JOIN organisation o ON wc.organisation_id = o.organisation_id
        LEFT JOIN "user" u ON wc.created_by = u.user_id
        ORDER BY wc.created_at DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch workflow configs: ${error.message}`);
    }
  }

  async findById(workflowConfigId) {
    try {
      const query = `
        SELECT 
          wc.workflow_config_id,
          wc.organisation_id,
          wc.domains,
          wc.locations,
          wc.designations,
          wc.runs_at,
          wc.leads_count,
          wc.created_by,
          wc.created_at,
          wc.updated_at,
          o.organisation_name,
          u.fullname as created_by_name
        FROM workflow_config wc
        LEFT JOIN organisation o ON wc.organisation_id = o.organisation_id
        LEFT JOIN "user" u ON wc.created_by = u.user_id
        WHERE wc.workflow_config_id = $1
      `;
      const result = await pool.query(query, [workflowConfigId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to fetch workflow config by ID: ${error.message}`);
    }
  }

  async findByOrganisationId(organisationId) {
    try {
      const query = `
        SELECT 
          wc.workflow_config_id,
          wc.organisation_id,
          wc.domains,
          wc.locations,
          wc.designations,
          wc.runs_at,
          wc.leads_count,
          wc.created_by,
          wc.created_at,
          wc.updated_at,
          o.organisation_name,
          u.fullname as created_by_name
        FROM workflow_config wc
        LEFT JOIN organisation o ON wc.organisation_id = o.organisation_id
        LEFT JOIN "user" u ON wc.created_by = u.user_id
        WHERE wc.organisation_id = $1
        ORDER BY wc.created_at DESC
      `;
      const result = await pool.query(query, [organisationId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch workflow configs by organisation ID: ${error.message}`);
    }
  }

  async create(workflowConfigData) {
    try {
      const { 
        workflowConfigId, 
        organisationId, 
        domains, 
        locations, 
        designations, 
        runsAt, 
        leadsCount, 
        createdBy 
      } = workflowConfigData;
      
      const query = `
        INSERT INTO workflow_config (
          workflow_config_id, 
          organisation_id, 
          domains, 
          locations, 
          designations, 
          runs_at, 
          leads_count, 
          created_by, 
          created_at, 
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        workflowConfigId,
        organisationId,
        domains || [],
        locations || [],
        designations || [],
        runsAt,
        leadsCount || 0,
        createdBy
      ]);
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create workflow config: ${error.message}`);
    }
  }

  async update(workflowConfigId, workflowConfigData) {
    try {
      const { 
        domains, 
        locations, 
        designations, 
        runsAt, 
        leadsCount 
      } = workflowConfigData;
      
      const query = `
        UPDATE workflow_config 
        SET 
          domains = COALESCE($1, domains),
          locations = COALESCE($2, locations),
          designations = COALESCE($3, designations),
          runs_at = COALESCE($4, runs_at),
          leads_count = COALESCE($5, leads_count),
          updated_at = NOW()
        WHERE workflow_config_id = $6
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        domains,
        locations,
        designations,
        runsAt,
        leadsCount,
        workflowConfigId
      ]);
      
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update workflow config: ${error.message}`);
    }
  }

  async delete(workflowConfigId) {
    try {
      const query = 'DELETE FROM workflow_config WHERE workflow_config_id = $1 RETURNING *';
      const result = await pool.query(query, [workflowConfigId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to delete workflow config: ${error.message}`);
    }
  }

  async exists(workflowConfigId) {
    try {
      const query = 'SELECT 1 FROM workflow_config WHERE workflow_config_id = $1';
      const result = await pool.query(query, [workflowConfigId]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Failed to check workflow config existence: ${error.message}`);
    }
  }

  async findByCreatedBy(createdBy) {
    try {
      const query = `
        SELECT 
          wc.workflow_config_id,
          wc.organisation_id,
          wc.domains,
          wc.locations,
          wc.designations,
          wc.runs_at,
          wc.leads_count,
          wc.created_by,
          wc.created_at,
          wc.updated_at,
          o.organisation_name,
          u.fullname as created_by_name
        FROM workflow_config wc
        LEFT JOIN organisation o ON wc.organisation_id = o.organisation_id
        LEFT JOIN "user" u ON wc.created_by = u.user_id
        WHERE wc.created_by = $1
        ORDER BY wc.created_at DESC
      `;
      const result = await pool.query(query, [createdBy]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch workflow configs by created by: ${error.message}`);
    }
  }

  async updateLeadsCount(workflowConfigId, leadsCount) {
    try {
      const query = `
        UPDATE workflow_config 
        SET leads_count = $1, updated_at = NOW()
        WHERE workflow_config_id = $2
        RETURNING *
      `;
      const result = await pool.query(query, [leadsCount, workflowConfigId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update leads count: ${error.message}`);
    }
  }
}

module.exports = new WorkflowConfigRepository();
