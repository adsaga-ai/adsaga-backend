const pool = require('../../config/database-connection');
const crypto = require('crypto');

class UserEmailVerificationRepository {

  async createVerificationRecord(email, otpCode, expiresAt) {
    try {
      // Generate UUID for the record
      const id = crypto.randomUUID();
      
      const query = `
        INSERT INTO user_email_verification (id, email, otp_code, expires_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, email, otp_code, expires_at, verified, attempts, is_user_created, created_at, updated_at
      `;
      
      const result = await pool.query(query, [id, email, otpCode, expiresAt]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create email verification record: ${error.message}`);
    }
  }

  async findByEmail(email) {
    try {
      const query = `
        SELECT 
          id,
          email,
          otp_code,
          expires_at,
          verified,
          attempts,
          is_user_created,
          created_at,
          updated_at
        FROM user_email_verification
        WHERE email = $1
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find email verification record: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const query = `
        SELECT 
          id,
          email,
          otp_code,
          expires_at,
          verified,
          attempts,
          is_user_created,
          created_at,
          updated_at
        FROM user_email_verification
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find email verification record by ID: ${error.message}`);
    }
  }

  async updateOtpCode(id, otpCode, expiresAt) {
    try {
      const query = `
        UPDATE user_email_verification 
        SET otp_code = $1, expires_at = $2, attempts = 0, updated_at = NOW()
        WHERE id = $3
        RETURNING id, email, otp_code, expires_at, verified, attempts, is_user_created, created_at, updated_at
      `;
      
      const result = await pool.query(query, [otpCode, expiresAt, id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update OTP code: ${error.message}`);
    }
  }

  async verifyOtp(id, otpCode) {
    try {
      const query = `
        UPDATE user_email_verification 
        SET verified = true, updated_at = NOW()
        WHERE id = $1 AND otp_code = $2 AND verified = false AND expires_at > NOW()
        RETURNING id, email, otp_code, expires_at, verified, attempts, is_user_created, created_at, updated_at
      `;
      
      const result = await pool.query(query, [id, otpCode]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to verify OTP: ${error.message}`);
    }
  }

  async incrementAttempts(id) {
    try {
      const query = `
        UPDATE user_email_verification 
        SET attempts = attempts + 1, updated_at = NOW()
        WHERE id = $1
        RETURNING id, email, otp_code, expires_at, verified, attempts, is_user_created, created_at, updated_at
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to increment attempts: ${error.message}`);
    }
  }

  async markUserCreated(id) {
    try {
      const query = `
        UPDATE user_email_verification 
        SET is_user_created = true, updated_at = NOW()
        WHERE id = $1
        RETURNING id, email, otp_code, expires_at, verified, attempts, is_user_created, created_at, updated_at
      `;
      
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to mark user as created: ${error.message}`);
    }
  }

  async deleteExpiredRecords() {
    try {
      const query = `
        DELETE FROM user_email_verification 
        WHERE expires_at < NOW()
        RETURNING id
      `;
      
      const result = await pool.query(query);
      return result.rows.length;
    } catch (error) {
      throw new Error(`Failed to delete expired records: ${error.message}`);
    }
  }

  async deleteByEmail(email) {
    try {
      const query = `
        DELETE FROM user_email_verification 
        WHERE email = $1
        RETURNING id
      `;
      
      const result = await pool.query(query, [email]);
      return result.rows.length;
    } catch (error) {
      throw new Error(`Failed to delete verification records by email: ${error.message}`);
    }
  }

  async getActiveVerificationCount(email) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM user_email_verification 
        WHERE email = $1 AND verified = false AND expires_at > NOW()
      `;
      
      const result = await pool.query(query, [email]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw new Error(`Failed to get active verification count: ${error.message}`);
    }
  }
}

module.exports = new UserEmailVerificationRepository();
