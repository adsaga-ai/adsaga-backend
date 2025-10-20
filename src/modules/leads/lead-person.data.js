const pool = require('../../config/database-connection');

class LeadPersonRepository {
  async findByLeadId(leadId) {
    try {
      const query = `
        SELECT 
          lead_person_id,
          lead_id,
          person_name,
          email,
          phone_number,
          is_verified,
          created_at,
          updated_at
        FROM lead_person
        WHERE lead_id = $1
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [leadId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch lead persons by lead ID: ${error.message}`);
    }
  }

  async findById(leadPersonId, leadId = null) {
    try {
      let query, params;
      
      if (leadId) {
        query = `
          SELECT 
            lead_person_id,
            lead_id,
            person_name,
            email,
            phone_number,
            is_verified,
            created_at,
            updated_at
          FROM lead_person
          WHERE lead_person_id = $1 AND lead_id = $2
        `;
        params = [leadPersonId, leadId];
      } else {
        query = `
          SELECT 
            lead_person_id,
            lead_id,
            person_name,
            email,
            phone_number,
            is_verified,
            created_at,
            updated_at
          FROM lead_person
          WHERE lead_person_id = $1
        `;
        params = [leadPersonId];
      }
      
      const result = await pool.query(query, params);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to fetch lead person by ID: ${error.message}`);
    }
  }

  async create(leadPersonData) {
    try {
      const { 
        leadId, 
        personName, 
        email, 
        phoneNumber, 
        isVerified = false 
      } = leadPersonData;
      
      const query = `
        INSERT INTO lead_person (
          lead_person_id, 
          lead_id, 
          person_name, 
          email, 
          phone_number, 
          is_verified, 
          created_at, 
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        leadPersonData.leadPersonId,
        leadId,
        personName,
        email || null,
        phoneNumber || null,
        isVerified
      ]);
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create lead person: ${error.message}`);
    }
  }

  async createMultiple(leadPersonsData) {
    try {
      if (!leadPersonsData || leadPersonsData.length === 0) {
        return [];
      }

      const values = [];
      const params = [];
      let paramIndex = 1;

      leadPersonsData.forEach((person, index) => {
        const { leadId, personName, email, phoneNumber, isVerified = false } = person;
        const leadPersonId = person.leadPersonId;
        
        values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, NOW(), NOW())`);
        params.push(leadPersonId, leadId, personName, email || null, phoneNumber || null, isVerified);
        paramIndex += 6;
      });

      const query = `
        INSERT INTO lead_person (
          lead_person_id, 
          lead_id, 
          person_name, 
          email, 
          phone_number, 
          is_verified, 
          created_at, 
          updated_at
        )
        VALUES ${values.join(', ')}
        RETURNING *
      `;
      
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to create multiple lead persons: ${error.message}`);
    }
  }

  async update(leadPersonId, leadId, leadPersonData) {
    try {
      const { personName, email, phoneNumber, isVerified } = leadPersonData;
      
      const query = `
        UPDATE lead_person 
        SET 
          person_name = $1, 
          email = $2, 
          phone_number = $3, 
          is_verified = $4, 
          updated_at = NOW()
        WHERE lead_person_id = $5 AND lead_id = $6
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        personName,
        email || null,
        phoneNumber || null,
        isVerified,
        leadPersonId,
        leadId
      ]);
      
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update lead person: ${error.message}`);
    }
  }

  // Update only verification status (PATCH behavior)
  async updateVerificationStatus(leadPersonId, isVerified) {
    try {
      const query = `
        UPDATE lead_person 
        SET 
          is_verified = $1, 
          updated_at = NOW()
        WHERE lead_person_id = $2
        RETURNING *
      `;
      
      const result = await pool.query(query, [isVerified, leadPersonId]);
      
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update lead person verification status: ${error.message}`);
    }
  }

  async delete(leadPersonId, leadId) {
    try {
      const query = 'DELETE FROM lead_person WHERE lead_person_id = $1 AND lead_id = $2 RETURNING *';
      const result = await pool.query(query, [leadPersonId, leadId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to delete lead person: ${error.message}`);
    }
  }

  async deleteByLeadId(leadId) {
    try {
      const query = 'DELETE FROM lead_person WHERE lead_id = $1';
      await pool.query(query, [leadId]);
    } catch (error) {
      throw new Error(`Failed to delete lead persons by lead ID: ${error.message}`);
    }
  }

  async findByEmail(email, leadId) {
    try {
      const query = `
        SELECT 
          lead_person_id,
          lead_id,
          person_name,
          email,
          phone_number,
          is_verified,
          created_at,
          updated_at
        FROM lead_person
        WHERE email = $1 AND lead_id = $2
      `;
      const result = await pool.query(query, [email, leadId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to fetch lead person by email: ${error.message}`);
    }
  }

  async findByPhoneNumber(phoneNumber, leadId) {
    try {
      const query = `
        SELECT 
          lead_person_id,
          lead_id,
          person_name,
          email,
          phone_number,
          is_verified,
          created_at,
          updated_at
        FROM lead_person
        WHERE phone_number = $1 AND lead_id = $2
      `;
      const result = await pool.query(query, [phoneNumber, leadId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to fetch lead person by phone number: ${error.message}`);
    }
  }

  async getVerifiedPersonsCount(leadId) {
    try {
      const query = 'SELECT COUNT(*) as count FROM lead_person WHERE lead_id = $1 AND is_verified = true';
      const result = await pool.query(query, [leadId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw new Error(`Failed to get verified persons count: ${error.message}`);
    }
  }

  async getTotalPersonsCount(leadId) {
    try {
      const query = 'SELECT COUNT(*) as count FROM lead_person WHERE lead_id = $1';
      const result = await pool.query(query, [leadId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw new Error(`Failed to get total persons count: ${error.message}`);
    }
  }

  async exists(leadPersonId, leadId) {
    try {
      const query = 'SELECT 1 FROM lead_person WHERE lead_person_id = $1 AND lead_id = $2';
      const result = await pool.query(query, [leadPersonId, leadId]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Failed to check lead person existence: ${error.message}`);
    }
  }
}

module.exports = new LeadPersonRepository();
