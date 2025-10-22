const pool = require('../../config/database-connection');
const bcrypt = require('bcryptjs');

class AdminRepository {

  async findByEmail(email) {
    try {
      const query = `
        SELECT 
          admin_id,
          fullname,
          email,
          password,
          created_at,
          updated_at
        FROM admin_user
        WHERE email = $1
      `;
      
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to fetch admin by email: ${error.message}`);
    }
  }

  async findById(adminId) {
    try {
      const query = `
        SELECT 
          admin_id,
          fullname,
          email,
          password,
          created_at,
          updated_at
        FROM admin_user
        WHERE admin_id = $1
      `;
      
      const result = await pool.query(query, [adminId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to fetch admin by ID: ${error.message}`);
    }
  }

  async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw new Error(`Failed to verify password: ${error.message}`);
    }
  }

  async hashPassword(password) {
    try {
      const saltRounds = 12;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      throw new Error(`Failed to hash password: ${error.message}`);
    }
  }

  async updateLastLogin(adminId) {
    try {
      const query = `
        UPDATE admin_user 
        SET updated_at = NOW()
        WHERE admin_id = $1
      `;
      
      await pool.query(query, [adminId]);
    } catch (error) {
      throw new Error(`Failed to update last login: ${error.message}`);
    }
  }

  async create(adminData) {
    try {
      const { fullname, email, password } = adminData;
      const hashedPassword = await this.hashPassword(password);
      
      const query = `
        INSERT INTO admin_user (fullname, email, password)
        VALUES ($1, $2, $3)
        RETURNING admin_id, fullname, email, created_at, updated_at
      `;
      
      const result = await pool.query(query, [fullname, email, hashedPassword]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create admin: ${error.message}`);
    }
  }

  async findAll() {
    try {
      const query = `
        SELECT 
          admin_id,
          fullname,
          email,
          created_at,
          updated_at
        FROM admin_user
        ORDER BY created_at DESC
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch admins: ${error.message}`);
    }
  }

  async update(adminId, updateData) {
    try {
      const { fullname, email } = updateData;
      
      const query = `
        UPDATE admin_user 
        SET fullname = $1, email = $2, updated_at = NOW()
        WHERE admin_id = $3
        RETURNING admin_id, fullname, email, created_at, updated_at
      `;
      
      const result = await pool.query(query, [fullname, email, adminId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update admin: ${error.message}`);
    }
  }

  async delete(adminId) {
    try {
      const query = `
        DELETE FROM admin_user 
        WHERE admin_id = $1
        RETURNING admin_id
      `;
      
      const result = await pool.query(query, [adminId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to delete admin: ${error.message}`);
    }
  }

  async changePassword(adminId, newPassword) {
    try {
      const hashedPassword = await this.hashPassword(newPassword);
      
      const query = `
        UPDATE admin_user 
        SET password = $1, updated_at = NOW()
        WHERE admin_id = $2
      `;
      
      await pool.query(query, [hashedPassword, adminId]);
    } catch (error) {
      throw new Error(`Failed to change password: ${error.message}`);
    }
  }
}

module.exports = new AdminRepository();
