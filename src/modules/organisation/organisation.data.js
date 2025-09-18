const pool = require('../../config/database-connection');
const organisationLocationRepository = require('./organisation-location.data');

class OrganisationRepository {
  async findAll() {
    try {
      const query = `
        SELECT 
          o.organisation_id,
          o.organisation_name,
          o.website,
          o.subscription_code,
          o.created_at,
          o.updated_at,
          st.subscription_name
        FROM organisation o
        LEFT JOIN subscription_type st ON o.subscription_code = st.subscription_code
        ORDER BY o.created_at DESC
      `;
      const result = await pool.query(query);
      
      // Fetch related data for each organisation
      const organisationsWithRelatedData = await Promise.all(
        result.rows.map(async (organisation) => {
          const locations = await organisationLocationRepository.findByOrganisationId(organisation.organisation_id);
          
          return {
            ...organisation,
            locations
          };
        })
      );
      
      return organisationsWithRelatedData;
    } catch (error) {
      throw new Error(`Failed to fetch organisations: ${error.message}`);
    }
  }

  async findById(organisationId) {
    try {
      const query = `
        SELECT 
          o.organisation_id,
          o.organisation_name,
          o.website,
          o.subscription_code,
          o.created_at,
          o.updated_at,
          st.subscription_name
        FROM organisation o
        LEFT JOIN subscription_type st ON o.subscription_code = st.subscription_code
        WHERE o.organisation_id = $1
      `;
      const result = await pool.query(query, [organisationId]);
      
      if (!result.rows[0]) {
        return null;
      }
      
      const organisation = result.rows[0];
      
      // Fetch related data
      const locations = await organisationLocationRepository.findByOrganisationId(organisation.organisation_id);
      
      return {
        ...organisation,
        locations
      };
    } catch (error) {
      throw new Error(`Failed to fetch organisation by ID: ${error.message}`);
    }
  }

  async create(organisationData) {
    try {
      const { organisationName, website, subscriptionCode } = organisationData;
      const query = `
        INSERT INTO organisation (organisation_id, organisation_name, website, subscription_code, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING *
      `;
      const result = await pool.query(query, [organisationData.organisationId, organisationName, website, subscriptionCode]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create organisation: ${error.message}`);
    }
  }

  async update(organisationId, organisationData) {
    try {
      const { organisationName, website, subscriptionCode } = organisationData;
      const query = `
        UPDATE organisation 
        SET organisation_name = $1, website = $2, subscription_code = $3, updated_at = NOW()
        WHERE organisation_id = $4
        RETURNING *
      `;
      const result = await pool.query(query, [organisationName, website, subscriptionCode, organisationId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to update organisation: ${error.message}`);
    }
  }

  async delete(organisationId) {
    try {
      const query = 'DELETE FROM organisation WHERE organisation_id = $1 RETURNING *';
      const result = await pool.query(query, [organisationId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to delete organisation: ${error.message}`);
    }
  }

  async exists(organisationId) {
    try {
      const query = 'SELECT 1 FROM organisation WHERE organisation_id = $1';
      const result = await pool.query(query, [organisationId]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Failed to check organisation existence: ${error.message}`);
    }
  }

  async findBySubscriptionCode(subscriptionCode) {
    try {
      const query = `
        SELECT 
          o.organisation_id,
          o.organisation_name,
          o.website,
          o.subscription_code,
          o.created_at,
          o.updated_at,
          st.subscription_name
        FROM organisation o
        LEFT JOIN subscription_type st ON o.subscription_code = st.subscription_code
        WHERE o.subscription_code = $1
        ORDER BY o.created_at DESC
      `;
      const result = await pool.query(query, [subscriptionCode]);
      
      // Fetch related data for each organisation
      const organisationsWithRelatedData = await Promise.all(
        result.rows.map(async (organisation) => {
          const locations = await organisationLocationRepository.findByOrganisationId(organisation.organisation_id);
          
          return {
            ...organisation,
            locations
          };
        })
      );
      
      return organisationsWithRelatedData;
    } catch (error) {
      throw new Error(`Failed to fetch organisations by subscription code: ${error.message}`);
    }
  }
}

module.exports = new OrganisationRepository();
