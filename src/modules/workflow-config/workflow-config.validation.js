const Joi = require('joi');

const workflowConfigValidation = {
  create: {
    body: Joi.object({
      domains: Joi.array()
        .items(Joi.string().max(255))
        .optional()
        .default([])
        .messages({
          'array.base': 'Domains must be an array',
          'string.max': 'Each domain must not exceed 255 characters'
        }),
      locations: Joi.array()
        .items(Joi.string().max(255))
        .optional()
        .default([])
        .messages({
          'array.base': 'Locations must be an array',
          'string.max': 'Each location must not exceed 255 characters'
        }),
      designations: Joi.array()
        .items(Joi.string().max(255))
        .optional()
        .default([])
        .messages({
          'array.base': 'Designations must be an array',
          'string.max': 'Each designation must not exceed 255 characters'
        }),
      runs_at: Joi.date()
        .iso()
        .optional()
        .allow(null)
        .messages({
          'date.format': 'Runs at must be a valid ISO date'
        }),
      leads_count: Joi.number()
        .integer()
        .min(0)
        .optional()
        .default(0)
        .messages({
          'number.base': 'Leads count must be a number',
          'number.integer': 'Leads count must be an integer',
          'number.min': 'Leads count must be 0 or greater'
        })
    })
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
        .optional()
        .messages({
          'array.base': 'Domains must be an array',
          'string.max': 'Each domain must not exceed 255 characters'
        }),
      locations: Joi.array()
        .items(Joi.string().max(255))
        .optional()
        .messages({
          'array.base': 'Locations must be an array',
          'string.max': 'Each location must not exceed 255 characters'
        }),
      designations: Joi.array()
        .items(Joi.string().max(255))
        .optional()
        .messages({
          'array.base': 'Designations must be an array',
          'string.max': 'Each designation must not exceed 255 characters'
        }),
      runs_at: Joi.date()
        .iso()
        .optional()
        .allow(null)
        .messages({
          'date.format': 'Runs at must be a valid ISO date'
        }),
      leads_count: Joi.number()
        .integer()
        .min(0)
        .optional()
        .messages({
          'number.base': 'Leads count must be a number',
          'number.integer': 'Leads count must be an integer',
          'number.min': 'Leads count must be 0 or greater'
        })
    })
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
  }
};

module.exports = workflowConfigValidation;
