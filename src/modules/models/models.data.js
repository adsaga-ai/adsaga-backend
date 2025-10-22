const pool = require('../../config/database-connection');

class ModelRepository {

  async create(modelData) {
    try {
      const { 
        model_name, 
        model_type, 
        input_tokens_per_dollar, 
        output_tokens_per_dollar, 
        input_credits_per_token, 
        output_credits_per_token 
      } = modelData;
      
      const query = `
        INSERT INTO models (
          model_name, 
          model_type, 
          input_tokens_per_dollar, 
          output_tokens_per_dollar, 
          input_credits_per_token, 
          output_credits_per_token,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING 
          model_id,
          model_name,
          model_type,
          input_tokens_per_dollar,
          output_tokens_per_dollar,
          input_credits_per_token,
          output_credits_per_token,
          created_at,
          updated_at
      `;
      
      const result = await pool.query(query, [
        model_name,
        model_type,
        input_tokens_per_dollar,
        output_tokens_per_dollar,
        input_credits_per_token,
        output_credits_per_token
      ]);
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create model: ${error.message}`);
    }
  }

  async findById(modelId) {
    try {
      const query = `
        SELECT 
          model_id,
          model_name,
          model_type,
          input_tokens_per_dollar,
          output_tokens_per_dollar,
          input_credits_per_token,
          output_credits_per_token,
          created_at,
          updated_at
        FROM models
        WHERE model_id = $1
      `;
      
      const result = await pool.query(query, [modelId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to fetch model by ID: ${error.message}`);
    }
  }

  async findAll(filters = {}) {
    try {
      let query = `
        SELECT 
          model_id,
          model_name,
          model_type,
          input_tokens_per_dollar,
          output_tokens_per_dollar,
          input_credits_per_token,
          output_credits_per_token,
          created_at,
          updated_at
        FROM models
        WHERE 1=1
      `;
      
      const queryParams = [];
      let paramCount = 0;
      
      // Add search filter for model_name
      if (filters.search) {
        paramCount++;
        query += ` AND model_name ILIKE $${paramCount}`;
        queryParams.push(`%${filters.search}%`);
      }
      
      // Add filter for model_type
      if (filters.model_type) {
        paramCount++;
        query += ` AND model_type = $${paramCount}`;
        queryParams.push(filters.model_type);
      }
      
      // Add pagination
      const limit = filters.limit || 10;
      const offset = filters.offset || 0;
      
      query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      queryParams.push(limit, offset);
      
      const result = await pool.query(query, queryParams);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch models: ${error.message}`);
    }
  }

  async count(filters = {}) {
    try {
      let query = `
        SELECT COUNT(*) as total
        FROM models
        WHERE 1=1
      `;
      
      const queryParams = [];
      let paramCount = 0;
      
      // Add search filter for model_name
      if (filters.search) {
        paramCount++;
        query += ` AND model_name ILIKE $${paramCount}`;
        queryParams.push(`%${filters.search}%`);
      }
      
      // Add filter for model_type
      if (filters.model_type) {
        paramCount++;
        query += ` AND model_type = $${paramCount}`;
        queryParams.push(filters.model_type);
      }
      
      const result = await pool.query(query, queryParams);
      return parseInt(result.rows[0].total);
    } catch (error) {
      throw new Error(`Failed to count models: ${error.message}`);
    }
  }

  async update(modelId, updateData) {
    try {
      const { 
        model_name, 
        model_type, 
        input_tokens_per_dollar, 
        output_tokens_per_dollar, 
        input_credits_per_token, 
        output_credits_per_token 
      } = updateData;
      
      const query = `
        UPDATE models 
        SET 
          model_name = $1,
          model_type = $2,
          input_tokens_per_dollar = $3,
          output_tokens_per_dollar = $4,
          input_credits_per_token = $5,
          output_credits_per_token = $6,
          updated_at = NOW()
        WHERE model_id = $7
        RETURNING 
          model_id,
          model_name,
          model_type,
          input_tokens_per_dollar,
          output_tokens_per_dollar,
          input_credits_per_token,
          output_credits_per_token,
          created_at,
          updated_at
      `;
      
      const result = await pool.query(query, [
        model_name,
        model_type,
        input_tokens_per_dollar,
        output_tokens_per_dollar,
        input_credits_per_token,
        output_credits_per_token,
        modelId
      ]);
      
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update model: ${error.message}`);
    }
  }

  async delete(modelId) {
    try {
      const query = `
        DELETE FROM models 
        WHERE model_id = $1
        RETURNING model_id
      `;
      
      const result = await pool.query(query, [modelId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to delete model: ${error.message}`);
    }
  }

  async findByName(modelName) {
    try {
      const query = `
        SELECT 
          model_id,
          model_name,
          model_type,
          input_tokens_per_dollar,
          output_tokens_per_dollar,
          input_credits_per_token,
          output_credits_per_token,
          created_at,
          updated_at
        FROM models
        WHERE model_name = $1
      `;
      
      const result = await pool.query(query, [modelName]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to fetch model by name: ${error.message}`);
    }
  }
}

module.exports = new ModelRepository();
