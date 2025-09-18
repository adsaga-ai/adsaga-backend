const organisationRepository = require('./organisation.data');
const organisationLocationRepository = require('./organisation-location.data');
const responseHandler = require('../../utils/response-handler');
const crypto = require('crypto');

class OrganisationController {
  async getAllOrganisations(req, res, next) {
    try {
      const organisations = await organisationRepository.findAll();
      return responseHandler.success(res, organisations, 'Organisations retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to retrieve organisations');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async getOrganisationById(req, res, next) {
    try {
      const { organisation_id } = req.params;
      const organisation = await organisationRepository.findById(organisation_id);
      
      if (!organisation) {
        return responseHandler.error(res, 'Organisation not found', 404);
      }
      
      return responseHandler.success(res, organisation, 'Organisation retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to retrieve organisation by ID');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async createOrganisation(req, res, next) {
    try {
      const { organisation_name, website, subscription_code, locations } = req.body;
      
      // Get user from auth middleware
      const userId = req.user.user_id;
      
      // Generate UUID for organisation
      const organisationId = crypto.randomUUID();
      
      // Set default subscription code to 'PROT' if not provided
      const finalSubscriptionCode = subscription_code || 'PROT';
      
      // Create organisation
      const newOrganisation = await organisationRepository.create({
        organisationId,
        organisationName: organisation_name,
        website: website || null,
        subscriptionCode: finalSubscriptionCode
      });
      
      // Update user to associate with the new organisation
      const userRepository = require('../users/user.data');
      await userRepository.update(userId, { organisation_id: organisationId });
      
      // Create locations if provided
      let createdLocations = [];
      if (locations && locations.length > 0) {
        const locationsData = locations.map(location => ({
          locationId: crypto.randomUUID(),
          organisationId,
          address: location.address,
          city: location.city,
          state: location.state,
          country: location.country
        }));
        
        createdLocations = await organisationLocationRepository.createMultiple(locationsData);
      }
      
      // Return organisation with locations
      const result = {
        ...newOrganisation,
        locations: createdLocations
      };
      
      return responseHandler.success(res, result, 'Organisation created successfully', 201);
    } catch (error) {
      req.log.error(error, 'Failed to create organisation');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async updateOrganisation(req, res, next) {
    try {
      const { organisation_id } = req.params;
      const { organisation_name, website, subscription_code, locations } = req.body;
      
      // Check if organisation exists
      const existingOrganisation = await organisationRepository.findById(organisation_id);
      if (!existingOrganisation) {
        return responseHandler.error(res, 'Organisation not found', 404);
      }
      
      // Update organisation
      const updatedOrganisation = await organisationRepository.update(organisation_id, {
        organisationName: organisation_name,
        website: website || null,
        subscriptionCode: subscription_code || existingOrganisation.subscription_code
      });
      
      // Handle locations update
      let updatedLocations = [];
      if (locations && locations.length > 0) {
        // Delete existing locations
        await organisationLocationRepository.deleteByOrganisationId(organisation_id);
        
        // Create new locations
        const locationsData = locations.map(location => ({
          locationId: crypto.randomUUID(),
          organisationId: organisation_id,
          address: location.address,
          city: location.city,
          state: location.state,
          country: location.country
        }));
        
        updatedLocations = await organisationLocationRepository.createMultiple(locationsData);
      }
      
      // Return organisation with locations
      const result = {
        ...updatedOrganisation,
        locations: updatedLocations
      };
      
      return responseHandler.success(res, result, 'Organisation updated successfully');
    } catch (error) {
      req.log.error(error, 'Failed to update organisation');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async deleteOrganisation(req, res, next) {
    try {
      const { organisation_id } = req.params;
      
      // Check if organisation exists
      const existingOrganisation = await organisationRepository.findById(organisation_id);
      if (!existingOrganisation) {
        return responseHandler.error(res, 'Organisation not found', 404);
      }
      
      const deletedOrganisation = await organisationRepository.delete(organisation_id);
      
      return responseHandler.success(res, deletedOrganisation, 'Organisation deleted successfully');
    } catch (error) {
      req.log.error(error, 'Failed to delete organisation');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async getOrganisationsBySubscriptionCode(req, res, next) {
    try {
      const { subscription_code } = req.params;
      const organisations = await organisationRepository.findBySubscriptionCode(subscription_code);
      
      return responseHandler.success(res, organisations, 'Organisations retrieved successfully by subscription code');
    } catch (error) {
      req.log.error(error, 'Failed to retrieve organisations by subscription code');
      return responseHandler.error(res, error.message, 500);
    }
  }
}

module.exports = new OrganisationController();
