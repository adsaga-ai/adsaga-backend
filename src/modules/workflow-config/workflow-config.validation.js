const Joi = require('joi');

const workflowConfigValidation = {
  create: {
    body: Joi.object({
      domains: Joi.array()
        .items(Joi.string().max(255))
        .min(1)
        .required()
        .messages({
          'array.base': 'Domains must be an array',
          'string.max': 'Each domain must not exceed 255 characters',
          'array.min': 'At least one domain is required',
          'any.required': 'Domains are required'
        }),
      locations: Joi.array()
        .items(Joi.string().max(255))
        .min(1)
        .required()
        .messages({
          'array.base': 'Locations must be an array',
          'string.max': 'Each location must not exceed 255 characters',
          'array.min': 'At least one location is required',
          'any.required': 'Locations are required'
        }),
      designations: Joi.array()
        .items(Joi.string().max(255))
        .min(1)
        .required()
        .messages({
          'array.base': 'Designations must be an array',
          'string.max': 'Each designation must not exceed 255 characters',
          'array.min': 'At least one designation is required',
          'any.required': 'Designations are required'
        }),
      runs_at: Joi.date()
        .iso()
        .optional()
        .messages({
          'date.format': 'Runs at must be a valid ISO date'
        }),
      leads_count: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
          'number.base': 'Leads count must be a number',
          'number.integer': 'Leads count must be an integer',
          'number.min': 'Leads count must be greater than 0',
          'any.required': 'Leads count is required'
        }),
      company_name: Joi.string()
        .max(255)
        .required()
        .messages({
          'string.max': 'Company name must not exceed 255 characters',
          'any.required': 'Company name is required'
        }),
      company_website: Joi.string()
        .max(255)
        .uri()
        .required()
        .messages({
          'string.max': 'Company website must not exceed 255 characters',
          'string.uri': 'Company website must be a valid URL',
          'any.required': 'Company website is required'
        }),
      custom_instructions: Joi.array()
        .items(Joi.string().max(1000))
        .optional()
        .default([])
        .messages({
          'array.base': 'Custom instructions must be an array',
          'string.max': 'Each custom instruction must not exceed 1000 characters'
        })
    }).unknown(true)
  },

  update: {
    params: Joi.object({
      workflow_config_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Workflow config ID must be a valid UUID',
          'any.required': 'Workflow config ID is required'
        })
    }),
    body: Joi.object({
      domains: Joi.array()
        .items(Joi.string().max(255))
        .min(1)
        .required()
        .messages({
          'array.base': 'Domains must be an array',
          'string.max': 'Each domain must not exceed 255 characters',
          'array.min': 'At least one domain is required',
          'any.required': 'Domains are required'
        }),
      locations: Joi.array()
        .items(Joi.string().max(255))
        .min(1)
        .required()
        .messages({
          'array.base': 'Locations must be an array',
          'string.max': 'Each location must not exceed 255 characters',
          'array.min': 'At least one location is required',
          'any.required': 'Locations are required'
        }),
      designations: Joi.array()
        .items(Joi.string().max(255))
        .min(1)
        .required()
        .messages({
          'array.base': 'Designations must be an array',
          'string.max': 'Each designation must not exceed 255 characters',
          'array.min': 'At least one designation is required',
          'any.required': 'Designations are required'
        }),
      runs_at: Joi.date()
        .iso()
        .optional()
        .messages({
          'date.format': 'Runs at must be a valid ISO date'
        }),
      leads_count: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
          'number.base': 'Leads count must be a number',
          'number.integer': 'Leads count must be an integer',
          'number.min': 'Leads count must be greater than 0',
          'any.required': 'Leads count is required'
        }),
      company_name: Joi.string()
        .max(255)
        .required()
        .messages({
          'string.max': 'Company name must not exceed 255 characters',
          'any.required': 'Company name is required'
        }),
      company_website: Joi.string()
        .max(255)
        .uri()
        .required()
        .messages({
          'string.max': 'Company website must not exceed 255 characters',
          'string.uri': 'Company website must be a valid URL',
          'any.required': 'Company website is required'
        }),
      custom_instructions: Joi.array()
        .items(Joi.string().max(1000))
        .optional()
        .messages({
          'array.base': 'Custom instructions must be an array',
          'string.max': 'Each custom instruction must not exceed 1000 characters'
        })
    }).unknown(true)
  },

  getById: {
    params: Joi.object({
      workflow_config_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Workflow config ID must be a valid UUID',
          'any.required': 'Workflow config ID is required'
        })
    })
  },

  delete: {
    params: Joi.object({
      workflow_config_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Workflow config ID must be a valid UUID',
          'any.required': 'Workflow config ID is required'
        })
    })
  },

  updateLeadsCount: {
    params: Joi.object({
      workflow_config_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Workflow config ID must be a valid UUID',
          'any.required': 'Workflow config ID is required'
        })
    }),
    body: Joi.object({
      leads_count: Joi.number()
        .integer()
        .min(0)
        .required()
        .messages({
          'number.base': 'Leads count must be a number',
          'number.integer': 'Leads count must be an integer',
          'number.min': 'Leads count must be 0 or greater',
          'any.required': 'Leads count is required'
        })
    })
  },

  // Validation for getAllWorkflowConfigs - no params or body validation needed
  getAll: {},

  // Validation for getWorkflowConfigsByOrganisation - no params or body validation needed  
  getByOrganisation: {},

  // Validation for getWorkflowConfigsByUser - no params or body validation needed
  getByUser: {}
};

module.exports = workflowConfigValidation;
