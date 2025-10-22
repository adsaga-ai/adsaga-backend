const pool = require('../../config/database-connection');

class OrganisationCreditTransactionRepository {
  async create(transactionData) {
    try {
      const { 
        organisationId, 
        transactionType, 
        creditAmount, 
        workflowId = null, 
        dollarAmount = null 
      } = transactionData;

      const query = `
        INSERT INTO organisation_credit_transactions 
        (organisation_id, transaction_type, credit_amount, workflow_id, dollar_amount, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;
      const result = await pool.query(query, [
        organisationId, 
        transactionType, 
        creditAmount, 
        workflowId, 
        dollarAmount
      ]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create organisation credit transaction: ${error.message}`);
    }
  }

  async findByOrganisationId(organisationId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT 
          oct.transaction_id,
          oct.organisation_id,
          oct.transaction_type,
          oct.credit_amount,
          oct.workflow_id,
          oct.dollar_amount,
          oct.created_at,
          o.organisation_name,
          w.status as workflow_status
        FROM organisation_credit_transactions oct
        LEFT JOIN organisation o ON oct.organisation_id = o.organisation_id
        LEFT JOIN workflows w ON oct.workflow_id = w.workflow_id
        WHERE oct.organisation_id = $1
        ORDER BY oct.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const result = await pool.query(query, [organisationId, limit, offset]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch organisation credit transactions: ${error.message}`);
    }
  }

  async findById(transactionId) {
    try {
      const query = `
        SELECT 
          oct.transaction_id,
          oct.organisation_id,
          oct.transaction_type,
          oct.credit_amount,
          oct.workflow_id,
          oct.dollar_amount,
          oct.created_at,
          o.organisation_name,
          w.status as workflow_status
        FROM organisation_credit_transactions oct
        LEFT JOIN organisation o ON oct.organisation_id = o.organisation_id
        LEFT JOIN workflows w ON oct.workflow_id = w.workflow_id
        WHERE oct.transaction_id = $1
      `;
      const result = await pool.query(query, [transactionId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to fetch organisation credit transaction by ID: ${error.message}`);
    }
  }

  async findAll(searchParams = {}, limit = 50, offset = 0) {
    try {
      let query = `
        SELECT 
          oct.transaction_id,
          oct.organisation_id,
          oct.transaction_type,
          oct.credit_amount,
          oct.workflow_id,
          oct.dollar_amount,
          oct.created_at,
          o.organisation_name,
          w.status as workflow_status
        FROM organisation_credit_transactions oct
        LEFT JOIN organisation o ON oct.organisation_id = o.organisation_id
        LEFT JOIN workflows w ON oct.workflow_id = w.workflow_id
        WHERE 1=1
      `;
      const values = [];
      let paramCount = 1;

      // Add search filters
      if (searchParams.organisation_id) {
        query += ` AND oct.organisation_id = $${paramCount}`;
        values.push(searchParams.organisation_id);
        paramCount++;
      }

      if (searchParams.transaction_type) {
        query += ` AND oct.transaction_type = $${paramCount}`;
        values.push(searchParams.transaction_type);
        paramCount++;
      }

      if (searchParams.workflow_id) {
        query += ` AND oct.workflow_id = $${paramCount}`;
        values.push(searchParams.workflow_id);
        paramCount++;
      }

      if (searchParams.start_date) {
        query += ` AND oct.created_at >= $${paramCount}`;
        values.push(searchParams.start_date);
        paramCount++;
      }

      if (searchParams.end_date) {
        query += ` AND oct.created_at <= $${paramCount}`;
        values.push(searchParams.end_date);
        paramCount++;
      }

      query += ` ORDER BY oct.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      values.push(limit, offset);

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch organisation credit transactions: ${error.message}`);
    }
  }

  async getTransactionCount(organisationId) {
    try {
      const query = `
        SELECT COUNT(*) as total
        FROM organisation_credit_transactions
        WHERE organisation_id = $1
      `;
      const result = await pool.query(query, [organisationId]);
      return parseInt(result.rows[0].total);
    } catch (error) {
      throw new Error(`Failed to get transaction count: ${error.message}`);
    }
  }

  async getTotalCredits(organisationId) {
    try {
      const query = `
        SELECT COALESCE(SUM(credit_amount), 0) as total_credits
        FROM organisation_credit_transactions
        WHERE organisation_id = $1 AND transaction_type = 'C'
      `;
      const result = await pool.query(query, [organisationId]);
      const totalCredits = result.rows[0]?.total_credits;
      return totalCredits ? parseFloat(totalCredits) : 0;
    } catch (error) {
      throw new Error(`Failed to get total credits: ${error.message}`);
    }
  }

  async getTotalDebits(organisationId) {
    try {
      const query = `
        SELECT COALESCE(SUM(credit_amount), 0) as total_debits
        FROM organisation_credit_transactions
        WHERE organisation_id = $1 AND transaction_type = 'D'
      `;
      const result = await pool.query(query, [organisationId]);
      const totalDebits = result.rows[0]?.total_debits;
      return totalDebits ? parseFloat(totalDebits) : 0;
    } catch (error) {
      throw new Error(`Failed to get total debits: ${error.message}`);
    }
  }

  async delete(transactionId) {
    try {
      const query = 'DELETE FROM organisation_credit_transactions WHERE transaction_id = $1 RETURNING *';
      const result = await pool.query(query, [transactionId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to delete organisation credit transaction: ${error.message}`);
    }
  }
}

module.exports = new OrganisationCreditTransactionRepository();
