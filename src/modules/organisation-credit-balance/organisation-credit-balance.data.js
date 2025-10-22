const pool = require('../../config/database-connection');

class OrganisationCreditBalanceRepository {
  async create(organisationId, creditBalance = 0.00) {
    try {
      const query = `
        INSERT INTO organisation_credit_balance (organisation_id, credit_balance, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING *
      `;
      const result = await pool.query(query, [organisationId, creditBalance]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create organisation credit balance: ${error.message}`);
    }
  }

  async findByOrganisationId(organisationId) {
    try {
      const query = `
        SELECT 
          ocb.organisation_id,
          ocb.credit_balance,
          ocb.created_at,
          ocb.updated_at,
          o.organisation_name,
          o.website
        FROM organisation_credit_balance ocb
        LEFT JOIN organisation o ON ocb.organisation_id = o.organisation_id
        WHERE ocb.organisation_id = $1
      `;
      const result = await pool.query(query, [organisationId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to fetch organisation credit balance: ${error.message}`);
    }
  }

  async findAll(searchParams = {}) {
    try {
      let query = `
        SELECT 
          ocb.organisation_id,
          ocb.credit_balance,
          ocb.created_at,
          ocb.updated_at,
          o.organisation_name,
          o.website
        FROM organisation_credit_balance ocb
        LEFT JOIN organisation o ON ocb.organisation_id = o.organisation_id
        WHERE 1=1
      `;
      const values = [];
      let paramCount = 1;

      // Add search filters
      if (searchParams.organisation_name) {
        query += ` AND o.organisation_name ILIKE $${paramCount}`;
        values.push(`%${searchParams.organisation_name}%`);
        paramCount++;
      }

      if (searchParams.website) {
        query += ` AND o.website ILIKE $${paramCount}`;
        values.push(`%${searchParams.website}%`);
        paramCount++;
      }

      query += ` ORDER BY ocb.updated_at DESC`;

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch organisation credit balances: ${error.message}`);
    }
  }

  async updateBalance(organisationId, newBalance) {
    try {
      const query = `
        UPDATE organisation_credit_balance 
        SET credit_balance = $1, updated_at = NOW()
        WHERE organisation_id = $2
        RETURNING *
      `;
      const result = await pool.query(query, [newBalance, organisationId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update organisation credit balance: ${error.message}`);
    }
  }

  async exists(organisationId) {
    try {
      const query = 'SELECT 1 FROM organisation_credit_balance WHERE organisation_id = $1';
      const result = await pool.query(query, [organisationId]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Failed to check organisation credit balance existence: ${error.message}`);
    }
  }

  async delete(organisationId) {
    try {
      const query = 'DELETE FROM organisation_credit_balance WHERE organisation_id = $1 RETURNING *';
      const result = await pool.query(query, [organisationId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to delete organisation credit balance: ${error.message}`);
    }
  }
}

module.exports = new OrganisationCreditBalanceRepository();
