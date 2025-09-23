const pool = require('../../config/database-connection');
const bcrypt = require('bcryptjs');

class UserRepository {

  async findAll() {
    try {
      const query = `
        SELECT 
          u.user_id,
          u.organisation_id,
          u.fullname,
          u.email,
          u.created_at,
          u.updated_at,
          o.organisation_name
        FROM "user" u
        LEFT JOIN organisation o ON u.organisation_id = o.organisation_id
        ORDER BY u.created_at DESC
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  async findById(userId) {
    try {
      const query = `
        SELECT 
          u.user_id,
          u.organisation_id,
          u.fullname,
          u.email,
          u.created_at,
          u.updated_at,
          o.organisation_name
        FROM "user" u
        LEFT JOIN organisation o ON u.organisation_id = o.organisation_id
        WHERE u.user_id = $1
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to fetch user by ID: ${error.message}`);
    }
  }

  async findByEmail(email) {
    try {
      const query = `
        SELECT 
          u.user_id,
          u.organisation_id,
          u.fullname,
          u.email,
          u.password,
          u.created_at,
          u.updated_at,
          o.organisation_name
        FROM "user" u
        LEFT JOIN organisation o ON u.organisation_id = o.organisation_id
        WHERE u.email = $1
      `;
      
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to fetch user by email: ${error.message}`);
    }
  }

  async create(userData) {
    try {
      const { userId, organisationId, fullname, email, password } = userData;
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const query = `
        INSERT INTO "user" (user_id, organisation_id, fullname, email, password, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING user_id, organisation_id, fullname, email, created_at, updated_at
      `;
      
      const result = await pool.query(query, [
        userId,
        organisationId || null,
        fullname,
        email,
        hashedPassword
      ]);
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async update(userId, updateData) {
    try {
      const { fullname, email, password, organisation_id } = updateData;
      
      let query = 'UPDATE "user" SET updated_at = NOW()';
      const values = [];
      let paramCount = 1;
      
      if (fullname) {
        query += `, fullname = $${paramCount}`;
        values.push(fullname);
        paramCount++;
      }
      
      if (email) {
        query += `, email = $${paramCount}`;
        values.push(email);
        paramCount++;
      }
      
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        query += `, password = $${paramCount}`;
        values.push(hashedPassword);
        paramCount++;
      }
      
      if (organisation_id !== undefined) {
        query += `, organisation_id = $${paramCount}`;
        values.push(organisation_id);
        paramCount++;
      }
      
      query += ` WHERE user_id = $${paramCount} RETURNING user_id, organisation_id, fullname, email, created_at, updated_at`;
      values.push(userId);
      
      const result = await pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  async delete(userId) {
    try {
      const query = `
        DELETE FROM "user" 
        WHERE user_id = $1 
        RETURNING user_id, organisation_id, fullname, email, created_at, updated_at
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  async findByOrganisationId(organisationId) {
    try {
      const query = `
        SELECT 
          u.user_id,
          u.organisation_id,
          u.fullname,
          u.email,
          u.created_at,
          u.updated_at,
          o.organisation_name
        FROM "user" u
        LEFT JOIN organisation o ON u.organisation_id = o.organisation_id
        WHERE u.organisation_id = $1
        ORDER BY u.created_at DESC
      `;
      
      const result = await pool.query(query, [organisationId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch users by organisation ID: ${error.message}`);
    }
  }

  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  async updatePassword(userId, hashedPassword) {
    try {
      const query = `
        UPDATE "user" 
        SET password = $1, updated_at = NOW()
        WHERE user_id = $2
        RETURNING user_id, email, fullname
      `;
      
      const result = await pool.query(query, [hashedPassword, userId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update password: ${error.message}`);
    }
  }
}

module.exports = new UserRepository();
