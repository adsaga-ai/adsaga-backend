const pool = require('../../config/database-connection');

class WorkflowRepository {
  async findAll(organisationId) {
    try {
      const query = `
        SELECT 
          w.workflow_id,
          w.organisation_id,
          w.workflow_config_id,
          w.status,
          w.started_at,
          w.finished_at,
          o.organisation_name,
          wc.domains,
          wc.locations,
          wc.designations,
          wc.leads_count,
          wc.company_name,
          wc.company_website,
          wc.custom_instructions,
          u.fullname as created_by_name
        FROM workflows w
        LEFT JOIN organisation o ON w.organisation_id = o.organisation_id
        LEFT JOIN workflow_config wc ON w.workflow_config_id = wc.workflow_config_id
        LEFT JOIN "user" u ON wc.created_by = u.user_id
        WHERE w.organisation_id = $1
        ORDER BY w.started_at DESC
      `;
      const result = await pool.query(query, [organisationId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch workflows: ${error.message}`);
    }
  }

  async findById(workflowId, organisationId) {
    try {
      const query = `
        SELECT 
          w.workflow_id,
          w.organisation_id,
          w.workflow_config_id,
          w.status,
          w.started_at,
          w.finished_at,
          o.organisation_name,
          wc.domains,
          wc.locations,
          wc.designations,
          wc.leads_count,
          wc.company_name,
          wc.company_website,
          wc.custom_instructions,
          u.fullname as created_by_name
        FROM workflows w
        LEFT JOIN organisation o ON w.organisation_id = o.organisation_id
        LEFT JOIN workflow_config wc ON w.workflow_config_id = wc.workflow_config_id
        LEFT JOIN "user" u ON wc.created_by = u.user_id
        WHERE w.workflow_id = $1 AND w.organisation_id = $2
      `;
      const result = await pool.query(query, [workflowId, organisationId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to fetch workflow by ID: ${error.message}`);
    }
  }

  async create(workflowData) {
    try {
      const { 
        workflowId, 
        organisationId, 
        workflowConfigId, 
        status = 'QUEUED'
      } = workflowData;
      
      const query = `
        INSERT INTO workflows (
          workflow_id, 
          organisation_id, 
          workflow_config_id, 
          status,
          started_at
        )
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        workflowId,
        organisationId,
        workflowConfigId,
        status
      ]);
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create workflow: ${error.message}`);
    }
  }

  async updateStatus(workflowId, status, organisationId) {
    try {
      const query = `
        UPDATE workflows 
        SET 
          status = $1,
          ${status === 'RUNNING' ? 'started_at = NOW(),' : ''}
          ${status === 'FINISHED' ? 'finished_at = NOW(),' : ''}
          updated_at = NOW()
        WHERE workflow_id = $2 AND organisation_id = $3
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        status,
        workflowId,
        organisationId
      ]);
      
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update workflow status: ${error.message}`);
    }
  }

  async update(workflowId, workflowData, organisationId) {
    try {
      const { 
        status,
        startedAt,
        finishedAt
      } = workflowData;
      
      const query = `
        UPDATE workflows 
        SET 
          status = COALESCE($1, status),
          started_at = COALESCE($2, started_at),
          finished_at = COALESCE($3, finished_at),
          updated_at = NOW()
        WHERE workflow_id = $4 AND organisation_id = $5
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        status,
        startedAt,
        finishedAt,
        workflowId,
        organisationId
      ]);
      
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update workflow: ${error.message}`);
    }
  }

  async delete(workflowId, organisationId) {
    try {
      const query = 'DELETE FROM workflows WHERE workflow_id = $1 AND organisation_id = $2 RETURNING *';
      const result = await pool.query(query, [workflowId, organisationId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to delete workflow: ${error.message}`);
    }
  }

  async exists(workflowId, organisationId) {
    try {
      const query = 'SELECT 1 FROM workflows WHERE workflow_id = $1 AND organisation_id = $2';
      const result = await pool.query(query, [workflowId, organisationId]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Failed to check workflow existence: ${error.message}`);
    }
  }

  async findByStatus(status, organisationId) {
    try {
      const query = `
        SELECT 
          w.workflow_id,
          w.organisation_id,
          w.workflow_config_id,
          w.status,
          w.started_at,
          w.finished_at,
          o.organisation_name,
          wc.domains,
          wc.locations,
          wc.designations,
          wc.leads_count,
          wc.company_name,
          wc.company_website,
          wc.custom_instructions,
          u.fullname as created_by_name
        FROM workflows w
        LEFT JOIN organisation o ON w.organisation_id = o.organisation_id
        LEFT JOIN workflow_config wc ON w.workflow_config_id = wc.workflow_config_id
        LEFT JOIN "user" u ON wc.created_by = u.user_id
        WHERE w.status = $1 AND w.organisation_id = $2
        ORDER BY w.started_at DESC
      `;
      const result = await pool.query(query, [status, organisationId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch workflows by status: ${error.message}`);
    }
  }

  async findByWorkflowConfigId(workflowConfigId, organisationId) {
    try {
      const query = `
        SELECT 
          w.workflow_id,
          w.organisation_id,
          w.workflow_config_id,
          w.status,
          w.started_at,
          w.finished_at,
          o.organisation_name,
          wc.domains,
          wc.locations,
          wc.designations,
          wc.leads_count,
          wc.company_name,
          wc.company_website,
          wc.custom_instructions,
          u.fullname as created_by_name
        FROM workflows w
        LEFT JOIN organisation o ON w.organisation_id = o.organisation_id
        LEFT JOIN workflow_config wc ON w.workflow_config_id = wc.workflow_config_id
        LEFT JOIN "user" u ON wc.created_by = u.user_id
        WHERE w.workflow_config_id = $1 AND w.organisation_id = $2
        ORDER BY w.started_at DESC
      `;
      const result = await pool.query(query, [workflowConfigId, organisationId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch workflows by workflow config ID: ${error.message}`);
    }
  }

  async findWithPagination(options) {
    try {
      const {
        organisationId,
        status,
        workflowConfigId,
        search,
        page,
        limit,
        offset,
        sortBy = 'started_at',
        sortOrder = 'DESC'
      } = options;

      // Build WHERE conditions
      let whereConditions = ['w.organisation_id = $1'];
      let queryParams = [organisationId];
      let paramIndex = 2;

      if (status) {
        whereConditions.push(`w.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      if (workflowConfigId) {
        whereConditions.push(`w.workflow_config_id = $${paramIndex}`);
        queryParams.push(workflowConfigId);
        paramIndex++;
      }

      if (search) {
        whereConditions.push(`(
          wc.company_name ILIKE $${paramIndex} OR 
          wc.company_website ILIKE $${paramIndex} OR 
          wc.domains::text ILIKE $${paramIndex} OR 
          wc.locations::text ILIKE $${paramIndex} OR 
          wc.designations::text ILIKE $${paramIndex} OR
          wc.custom_instructions::text ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Build ORDER BY clause
      const validSortFields = ['started_at', 'finished_at', 'status', 'company_name'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'started_at';
      const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      const orderBy = `w.${sortField} ${sortDirection}`;

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total_count
        FROM workflows w
        LEFT JOIN workflow_config wc ON w.workflow_config_id = wc.workflow_config_id
        WHERE ${whereClause}
      `;

      // Data query with pagination
      const dataQuery = `
        SELECT 
          w.workflow_id,
          w.organisation_id,
          w.workflow_config_id,
          w.status,
          w.started_at,
          w.finished_at,
          o.organisation_name,
          wc.domains,
          wc.locations,
          wc.designations,
          wc.leads_count,
          wc.company_name,
          wc.company_website,
          wc.custom_instructions,
          u.fullname as created_by_name
        FROM workflows w
        LEFT JOIN organisation o ON w.organisation_id = o.organisation_id
        LEFT JOIN workflow_config wc ON w.workflow_config_id = wc.workflow_config_id
        LEFT JOIN "user" u ON wc.created_by = u.user_id
        WHERE ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);

      // Execute both queries
      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery, queryParams.slice(0, -2)), // Exclude limit and offset for count
        pool.query(dataQuery, queryParams)
      ]);

      const totalCount = parseInt(countResult.rows[0].total_count, 10);

      return {
        workflows: dataResult.rows,
        totalCount
      };
    } catch (error) {
      throw new Error(`Failed to fetch workflows with pagination: ${error.message}`);
    }
  }
}

module.exports = new WorkflowRepository();
