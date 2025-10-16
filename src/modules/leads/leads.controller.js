const leadsRepository = require('./leads.data');
const leadPersonRepository = require('./lead-person.data');
const responseHandler = require('../../utils/response-handler');
const crypto = require('crypto');

class LeadsController {
  // Get all leads for an organisation
  async getAllLeads(req, res, next) {
    try {
      const organisationId = req.user.organisation_id;
      const leads = await leadsRepository.findAll(organisationId);
      return responseHandler.success(res, leads, 'Leads retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to retrieve leads');
      return responseHandler.error(res, error.message, 500);
    }
  }

  // Get lead by ID
  async getLeadById(req, res, next) {
    try {
      const { lead_id } = req.params;
      const organisationId = req.user.organisation_id;
      
      const lead = await leadsRepository.findById(lead_id, organisationId);
      
      if (!lead) {
        return responseHandler.error(res, 'Lead not found', 404);
      }
      
      return responseHandler.success(res, lead, 'Lead retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to retrieve lead by ID');
      return responseHandler.error(res, error.message, 500);
    }
  }

  // Create new lead
  async createLead(req, res, next) {
    try {
      const { 
        workflow_id, 
        company_name, 
        company_description, 
        company_locations, 
        website, 
        phone_numbers, 
        emails,
        persons 
      } = req.body;
      
      const organisationId = req.user.organisation_id;
      const leadId = crypto.randomUUID();
      
      // Create the lead
      const newLead = await leadsRepository.create({
        leadId,
        organisationId,
        workflowId: workflow_id,
        companyName: company_name,
        companyDescription: company_description,
        companyLocations: company_locations,
        website: website,
        phoneNumbers: phone_numbers,
        emails: emails
      });
      
      // Create lead persons if provided
      let createdPersons = [];
      if (persons && persons.length > 0) {
        const personsData = persons.map(person => ({
          leadPersonId: crypto.randomUUID(),
          leadId: leadId,
          personName: person.person_name,
          email: person.email,
          phoneNumber: person.phone_number,
          isVerified: person.is_verified || false
        }));
        
        createdPersons = await leadPersonRepository.createMultiple(personsData);
      }
      
      // Return lead with persons
      const result = {
        ...newLead,
        persons: createdPersons
      };
      
      return responseHandler.success(res, result, 'Lead created successfully', 201);
    } catch (error) {
      req.log.error(error, 'Failed to create lead');
      return responseHandler.error(res, error.message, 500);
    }
  }

  // Update lead
  async updateLead(req, res, next) {
    try {
      const { lead_id } = req.params;
      const { 
        company_name, 
        company_description, 
        company_locations, 
        website, 
        phone_numbers, 
        emails 
      } = req.body;
      
      const organisationId = req.user.organisation_id;
      
      // Check if lead exists
      const existingLead = await leadsRepository.findById(lead_id, organisationId);
      if (!existingLead) {
        return responseHandler.error(res, 'Lead not found', 404);
      }
      
      // Update the lead
      const updatedLead = await leadsRepository.update(lead_id, organisationId, {
        companyName: company_name,
        companyDescription: company_description,
        companyLocations: company_locations,
        website: website,
        phoneNumbers: phone_numbers,
        emails: emails
      });
      
      // Fetch updated lead with persons
      const leadWithPersons = await leadsRepository.findById(lead_id, organisationId);
      
      return responseHandler.success(res, leadWithPersons, 'Lead updated successfully');
    } catch (error) {
      req.log.error(error, 'Failed to update lead');
      return responseHandler.error(res, error.message, 500);
    }
  }

  // Delete lead
  async deleteLead(req, res, next) {
    try {
      const { lead_id } = req.params;
      const organisationId = req.user.organisation_id;
      
      // Check if lead exists
      const existingLead = await leadsRepository.findById(lead_id, organisationId);
      if (!existingLead) {
        return responseHandler.error(res, 'Lead not found', 404);
      }
      
      // Delete lead persons first (cascade will handle this, but being explicit)
      await leadPersonRepository.deleteByLeadId(lead_id);
      
      // Delete the lead
      const deletedLead = await leadsRepository.delete(lead_id, organisationId);
      
      return responseHandler.success(res, deletedLead, 'Lead deleted successfully');
    } catch (error) {
      req.log.error(error, 'Failed to delete lead');
      return responseHandler.error(res, error.message, 500);
    }
  }

  // Get leads by workflow ID
  async getLeadsByWorkflow(req, res, next) {
    try {
      const { workflow_id } = req.params;
      const organisationId = req.user.organisation_id;
      
      const leads = await leadsRepository.findByWorkflowId(workflow_id, organisationId);
      
      return responseHandler.success(res, leads, 'Leads retrieved successfully by workflow');
    } catch (error) {
      req.log.error(error, 'Failed to retrieve leads by workflow');
      return responseHandler.error(res, error.message, 500);
    }
  }

  // Search leads by company name
  async searchLeadsByCompanyName(req, res, next) {
    try {
      const { company_name } = req.query;
      const organisationId = req.user.organisation_id;
      
      if (!company_name) {
        return responseHandler.error(res, 'Company name is required for search', 400);
      }
      
      const leads = await leadsRepository.findByCompanyName(company_name, organisationId);
      
      return responseHandler.success(res, leads, 'Leads retrieved successfully by company name');
    } catch (error) {
      req.log.error(error, 'Failed to search leads by company name');
      return responseHandler.error(res, error.message, 500);
    }
  }

  // Get leads count for organisation
  async getLeadsCount(req, res, next) {
    try {
      const organisationId = req.user.organisation_id;
      const count = await leadsRepository.getLeadsCount(organisationId);
      
      return responseHandler.success(res, { count }, 'Leads count retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to get leads count');
      return responseHandler.error(res, error.message, 500);
    }
  }

  // Get leads count by workflow
  async getLeadsCountByWorkflow(req, res, next) {
    try {
      const { workflow_id } = req.params;
      const organisationId = req.user.organisation_id;
      
      const count = await leadsRepository.getLeadsCountByWorkflow(workflow_id, organisationId);
      
      return responseHandler.success(res, { count }, 'Leads count by workflow retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to get leads count by workflow');
      return responseHandler.error(res, error.message, 500);
    }
  }

  // Add person to lead
  async addPersonToLead(req, res, next) {
    try {
      const { lead_id } = req.params;
      const { person_name, email, phone_number, is_verified } = req.body;
      
      const organisationId = req.user.organisation_id;
      
      // Check if lead exists
      const existingLead = await leadsRepository.findById(lead_id, organisationId);
      if (!existingLead) {
        return responseHandler.error(res, 'Lead not found', 404);
      }
      
      // Create new person
      const leadPersonId = crypto.randomUUID();
      const newPerson = await leadPersonRepository.create({
        leadPersonId,
        leadId: lead_id,
        personName: person_name,
        email: email,
        phoneNumber: phone_number,
        isVerified: is_verified || false
      });
      
      return responseHandler.success(res, newPerson, 'Person added to lead successfully', 201);
    } catch (error) {
      req.log.error(error, 'Failed to add person to lead');
      return responseHandler.error(res, error.message, 500);
    }
  }

  // Update person in lead
  async updatePersonInLead(req, res, next) {
    try {
      const { lead_id, person_id } = req.params;
      const { person_name, email, phone_number, is_verified } = req.body;
      
      const organisationId = req.user.organisation_id;
      
      // Check if lead exists
      const existingLead = await leadsRepository.findById(lead_id, organisationId);
      if (!existingLead) {
        return responseHandler.error(res, 'Lead not found', 404);
      }
      
      // Check if person exists
      const existingPerson = await leadPersonRepository.findById(person_id, lead_id);
      if (!existingPerson) {
        return responseHandler.error(res, 'Person not found in this lead', 404);
      }
      
      // Update person
      const updatedPerson = await leadPersonRepository.update(person_id, lead_id, {
        personName: person_name,
        email: email,
        phoneNumber: phone_number,
        isVerified: is_verified
      });
      
      return responseHandler.success(res, updatedPerson, 'Person updated successfully');
    } catch (error) {
      req.log.error(error, 'Failed to update person in lead');
      return responseHandler.error(res, error.message, 500);
    }
  }

  // Delete person from lead
  async deletePersonFromLead(req, res, next) {
    try {
      const { lead_id, person_id } = req.params;
      
      const organisationId = req.user.organisation_id;
      
      // Check if lead exists
      const existingLead = await leadsRepository.findById(lead_id, organisationId);
      if (!existingLead) {
        return responseHandler.error(res, 'Lead not found', 404);
      }
      
      // Check if person exists
      const existingPerson = await leadPersonRepository.findById(person_id, lead_id);
      if (!existingPerson) {
        return responseHandler.error(res, 'Person not found in this lead', 404);
      }
      
      // Delete person
      const deletedPerson = await leadPersonRepository.delete(person_id, lead_id);
      
      return responseHandler.success(res, deletedPerson, 'Person deleted from lead successfully');
    } catch (error) {
      req.log.error(error, 'Failed to delete person from lead');
      return responseHandler.error(res, error.message, 500);
    }
  }

  // Get persons for a lead
  async getPersonsForLead(req, res, next) {
    try {
      const { lead_id } = req.params;
      
      const organisationId = req.user.organisation_id;
      
      // Check if lead exists
      const existingLead = await leadsRepository.findById(lead_id, organisationId);
      if (!existingLead) {
        return responseHandler.error(res, 'Lead not found', 404);
      }
      
      // Get persons
      const persons = await leadPersonRepository.findByLeadId(lead_id);
      
      return responseHandler.success(res, persons, 'Persons retrieved successfully for lead');
    } catch (error) {
      req.log.error(error, 'Failed to get persons for lead');
      return responseHandler.error(res, error.message, 500);
    }
  }

  // Assign user to lead
  async assignUserToLead(req, res, next) {
    try {
      const { lead_id } = req.params;
      const { assigned_to } = req.body;
      
      const organisationId = req.user.organisation_id;
      const assignedBy = req.user.user_id;
      
      // Check if lead exists
      const existingLead = await leadsRepository.findById(lead_id, organisationId);
      if (!existingLead) {
        return responseHandler.error(res, 'Lead not found', 404);
      }
      
      // Assign user to lead
      const updatedLead = await leadsRepository.assignUser(lead_id, organisationId, assigned_to, assignedBy);
      
      if (!updatedLead) {
        return responseHandler.error(res, 'Failed to assign user to lead', 500);
      }
      
      // Fetch updated lead with persons
      const leadWithPersons = await leadsRepository.findById(lead_id, organisationId);
      
      return responseHandler.success(res, leadWithPersons, 'User assigned to lead successfully');
    } catch (error) {
      req.log.error(error, 'Failed to assign user to lead');
      return responseHandler.error(res, error.message, 500);
    }
  }
}

module.exports = new LeadsController();
