const pool = require('../../config/database-connection');
const crypto = require('crypto');

class PasswordResetTokenRepository {

  async createToken(userId, expiresAt) {
    try {
      // Generate a secure random token
      const token = crypto.randomBytes(32).toString('hex');
      // Generate UUID for the record
      const id = crypto.randomUUID();
      
      const query = `
        INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, user_id, token, expires_at, used, created_at, updated_at
      `;
      
      const result = await pool.query(query, [id, userId, token, expiresAt]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create password reset token: ${error.message}`);
    }
  }

  async findByToken(token) {
    try {
      const query = `
        SELECT 
          prt.id,
          prt.user_id,
          prt.token,
          prt.expires_at,
          prt.used,
          prt.created_at,
          prt.updated_at,
          u.email,
          u.fullname
        FROM password_reset_tokens prt
        JOIN "user" u ON prt.user_id = u.user_id
        WHERE prt.token = $1
      `;
      
      const result = await pool.query(query, [token]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find password reset token: ${error.message}`);
    }
  }

  async markTokenAsUsed(tokenId) {
    try {
      const query = `
        UPDATE password_reset_tokens 
        SET used = true, updated_at = NOW()
        WHERE id = $1
        RETURNING id, user_id, token, expires_at, used, created_at, updated_at
      `;
      
      const result = await pool.query(query, [tokenId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to mark token as used: ${error.message}`);
    }
  }

  async deleteExpiredTokens() {
    try {
      const query = `
        DELETE FROM password_reset_tokens 
        WHERE expires_at < NOW()
        RETURNING id
      `;
      
      const result = await pool.query(query);
      return result.rows.length;
    } catch (error) {
      throw new Error(`Failed to delete expired tokens: ${error.message}`);
    }
  }

  async deleteUserTokens(userId) {
    try {
      const query = `
        DELETE FROM password_reset_tokens 
        WHERE user_id = $1
        RETURNING id
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows.length;
    } catch (error) {
      throw new Error(`Failed to delete user tokens: ${error.message}`);
    }
  }

  async getActiveTokensCount(userId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM password_reset_tokens 
        WHERE user_id = $1 AND used = false AND expires_at > NOW()
      `;
      
      const result = await pool.query(query, [userId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw new Error(`Failed to get active tokens count: ${error.message}`);
    }
  }
}

module.exports = new PasswordResetTokenRepository();
