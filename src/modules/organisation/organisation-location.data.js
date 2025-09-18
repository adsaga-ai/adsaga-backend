const pool = require('../../config/database-connection');

class OrganisationLocationRepository {
  async findByOrganisationId(organisationId) {
    try {
      const query = `
        SELECT 
          location_id,
          organisation_id,
          address,
          city,
          state,
          country
        FROM organisation_location
        WHERE organisation_id = $1
        ORDER BY address
      `;
      const result = await pool.query(query, [organisationId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch organisation locations: ${error.message}`);
    }
  }

  async create(locationData) {
    try {
      const { locationId, organisationId, address, city, state, country } = locationData;
      const query = `
        INSERT INTO organisation_location (location_id, organisation_id, address, city, state, country)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const result = await pool.query(query, [locationId, organisationId, address, city, state, country]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create organisation location: ${error.message}`);
    }
  }

  async createMultiple(locationsData) {
    try {
      const values = [];
      const params = [];
      let paramIndex = 1;

      locationsData.forEach((location, index) => {
        const { locationId, organisationId, address, city, state, country } = location;
        values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5})`);
        params.push(locationId, organisationId, address, city, state, country);
        paramIndex += 6;
      });

      const query = `
        INSERT INTO organisation_location (location_id, organisation_id, address, city, state, country)
        VALUES ${values.join(', ')}
        RETURNING *
      `;
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to create organisation locations: ${error.message}`);
    }
  }

  async update(locationId, locationData) {
    try {
      const { address, city, state, country } = locationData;
      const query = `
        UPDATE organisation_location 
        SET address = $1, city = $2, state = $3, country = $4
        WHERE location_id = $5
        RETURNING *
      `;
      const result = await pool.query(query, [address, city, state, country, locationId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update organisation location: ${error.message}`);
    }
  }

  async delete(locationId) {
    try {
      const query = 'DELETE FROM organisation_location WHERE location_id = $1 RETURNING *';
      const result = await pool.query(query, [locationId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to delete organisation location: ${error.message}`);
    }
  }

  async deleteByOrganisationId(organisationId) {
    try {
      const query = 'DELETE FROM organisation_location WHERE organisation_id = $1 RETURNING *';
      const result = await pool.query(query, [organisationId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to delete organisation locations: ${error.message}`);
    }
  }
}

module.exports = new OrganisationLocationRepository();
