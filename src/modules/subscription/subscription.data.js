const pool = require('../../config/database-connection');

class SubscriptionRepository {
  async findAll() {
    try {
      const query = 'SELECT * FROM subscription_type ORDER BY subscription_code';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch subscription types: ${error.message}`);
    }
  }

  async findByCode(subscriptionCode) {
    try {
      const query = 'SELECT * FROM subscription_type WHERE subscription_code = $1';
      const result = await pool.query(query, [subscriptionCode]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to fetch subscription type by code: ${error.message}`);
    }
  }

  async create(subscriptionData) {
    try {
      const { subscriptionCode, subscriptionName } = subscriptionData;
      const query = `
        INSERT INTO subscription_type (subscription_code, subscription_name)
        VALUES ($1, $2)
        RETURNING *
      `;
      const result = await pool.query(query, [subscriptionCode, subscriptionName]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create subscription type: ${error.message}`);
    }
  }

  async update(subscriptionCode, subscriptionData) {
    try {
      const { subscriptionName } = subscriptionData;
      const query = `
        UPDATE subscription_type 
        SET subscription_name = $1
        WHERE subscription_code = $2
        RETURNING *
      `;
      const result = await pool.query(query, [subscriptionName, subscriptionCode]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update subscription type: ${error.message}`);
    }
  }

  async delete(subscriptionCode) {
    try {
      const query = 'DELETE FROM subscription_type WHERE subscription_code = $1 RETURNING *';
      const result = await pool.query(query, [subscriptionCode]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to delete subscription type: ${error.message}`);
    }
  }

  async exists(subscriptionCode) {
    try {
      const query = 'SELECT 1 FROM subscription_type WHERE subscription_code = $1';
      const result = await pool.query(query, [subscriptionCode]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Failed to check subscription type existence: ${error.message}`);
    }
  }
}

module.exports = new SubscriptionRepository();
