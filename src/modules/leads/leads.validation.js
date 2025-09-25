const Joi = require('joi');

const leadsValidation = {
  create: {
    body: Joi.object({
      workflow_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Workflow ID must be a valid UUID',
          'any.required': 'Workflow ID is required'
        }),
      company_name: Joi.string()
        .max(255)
        .required()
        .messages({
          'string.empty': 'Company name is required',
          'string.max': 'Company name must not exceed 255 characters',
          'any.required': 'Company name is required'
        }),
      company_description: Joi.string()
        .optional()
        .allow(null, '')
        .messages({
          'string.base': 'Company description must be a string'
        }),
      company_locations: Joi.array()
        .items(
          Joi.string()
            .max(255)
            .messages({
              'string.max': 'Each company location must not exceed 255 characters'
            })
        )
        .optional()
        .messages({
          'array.base': 'Company locations must be an array'
        }),
      website: Joi.string()
        .uri()
        .max(255)
        .optional()
        .allow(null, '')
        .messages({
          'string.uri': 'Website must be a valid URL',
          'string.max': 'Website must not exceed 255 characters'
        }),
      phone_numbers: Joi.array()
        .items(
          Joi.string()
            .max(20)
            .pattern(/^[\+]?[0-9\s\-\(\)]+$/)
            .messages({
              'string.pattern.base': 'Phone number must contain only digits, spaces, hyphens, parentheses, and optional + prefix',
              'string.max': 'Phone number must not exceed 20 characters'
            })
        )
        .optional()
        .messages({
          'array.base': 'Phone numbers must be an array'
        }),
      emails: Joi.array()
        .items(
          Joi.string()
            .email()
            .max(255)
            .messages({
              'string.email': 'Each email must be a valid email address',
              'string.max': 'Each email must not exceed 255 characters'
            })
        )
        .optional()
        .messages({
          'array.base': 'Emails must be an array'
        }),
      persons: Joi.array()
        .items(
          Joi.object({
            person_name: Joi.string()
              .max(100)
              .required()
              .messages({
                'string.empty': 'Person name is required',
                'string.max': 'Person name must not exceed 100 characters',
                'any.required': 'Person name is required'
              }),
            email: Joi.string()
              .email()
              .max(255)
              .optional()
              .allow(null, '')
              .messages({
                'string.email': 'Email must be a valid email address',
                'string.max': 'Email must not exceed 255 characters'
              }),
            phone_number: Joi.string()
              .max(20)
              .pattern(/^[\+]?[0-9\s\-\(\)]+$/)
              .optional()
              .allow(null, '')
              .messages({
                'string.pattern.base': 'Phone number must contain only digits, spaces, hyphens, parentheses, and optional + prefix',
                'string.max': 'Phone number must not exceed 20 characters'
              }),
            is_verified: Joi.boolean()
              .optional()
              .default(false)
              .messages({
                'boolean.base': 'Is verified must be a boolean value'
              })
          })
        )
        .optional()
        .messages({
          'array.base': 'Persons must be an array'
        })
    })
  },

  update: {
    params: Joi.object({
      lead_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Lead ID must be a valid UUID',
          'any.required': 'Lead ID is required'
        })
    }),
    body: Joi.object({
      company_name: Joi.string()
        .max(255)
        .required()
        .messages({
          'string.empty': 'Company name is required',
          'string.max': 'Company name must not exceed 255 characters',
          'any.required': 'Company name is required'
        }),
      company_description: Joi.string()
        .optional()
        .allow(null, '')
        .messages({
          'string.base': 'Company description must be a string'
        }),
      company_locations: Joi.array()
        .items(
          Joi.string()
            .max(255)
            .messages({
              'string.max': 'Each company location must not exceed 255 characters'
            })
        )
        .optional()
        .messages({
          'array.base': 'Company locations must be an array'
        }),
      website: Joi.string()
        .uri()
        .max(255)
        .optional()
        .allow(null, '')
        .messages({
          'string.uri': 'Website must be a valid URL',
          'string.max': 'Website must not exceed 255 characters'
        }),
      phone_numbers: Joi.array()
        .items(
          Joi.string()
            .max(20)
            .pattern(/^[\+]?[0-9\s\-\(\)]+$/)
            .messages({
              'string.pattern.base': 'Phone number must contain only digits, spaces, hyphens, parentheses, and optional + prefix',
              'string.max': 'Phone number must not exceed 20 characters'
            })
        )
        .optional()
        .messages({
          'array.base': 'Phone numbers must be an array'
        }),
      emails: Joi.array()
        .items(
          Joi.string()
            .email()
            .max(255)
            .messages({
              'string.email': 'Each email must be a valid email address',
              'string.max': 'Each email must not exceed 255 characters'
            })
        )
        .optional()
        .messages({
          'array.base': 'Emails must be an array'
        })
    })
  },

  getById: {
    params: Joi.object({
      lead_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Lead ID must be a valid UUID',
          'any.required': 'Lead ID is required'
        })
    })
  },

  delete: {
    params: Joi.object({
      lead_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Lead ID must be a valid UUID',
          'any.required': 'Lead ID is required'
        })
    })
  },

  getByWorkflow: {
    params: Joi.object({
      workflow_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Workflow ID must be a valid UUID',
          'any.required': 'Workflow ID is required'
        })
    })
  },

  searchByCompanyName: {
    query: Joi.object({
      company_name: Joi.string()
        .min(1)
        .max(255)
        .required()
        .messages({
          'string.empty': 'Company name is required for search',
          'string.min': 'Company name must be at least 1 character',
          'string.max': 'Company name must not exceed 255 characters',
          'any.required': 'Company name is required for search'
        })
    })
  },

  getCountByWorkflow: {
    params: Joi.object({
      workflow_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Workflow ID must be a valid UUID',
          'any.required': 'Workflow ID is required'
        })
    })
  },

  addPerson: {
    params: Joi.object({
      lead_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Lead ID must be a valid UUID',
          'any.required': 'Lead ID is required'
        })
    }),
    body: Joi.object({
      person_name: Joi.string()
        .max(100)
        .required()
        .messages({
          'string.empty': 'Person name is required',
          'string.max': 'Person name must not exceed 100 characters',
          'any.required': 'Person name is required'
        }),
      email: Joi.string()
        .email()
        .max(255)
        .optional()
        .allow(null, '')
        .messages({
          'string.email': 'Email must be a valid email address',
          'string.max': 'Email must not exceed 255 characters'
        }),
      phone_number: Joi.string()
        .max(20)
        .pattern(/^[\+]?[0-9\s\-\(\)]+$/)
        .optional()
        .allow(null, '')
        .messages({
          'string.pattern.base': 'Phone number must contain only digits, spaces, hyphens, parentheses, and optional + prefix',
          'string.max': 'Phone number must not exceed 20 characters'
        }),
      is_verified: Joi.boolean()
        .optional()
        .default(false)
        .messages({
          'boolean.base': 'Is verified must be a boolean value'
        })
    })
  },

  updatePerson: {
    params: Joi.object({
      lead_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Lead ID must be a valid UUID',
          'any.required': 'Lead ID is required'
        }),
      person_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Person ID must be a valid UUID',
          'any.required': 'Person ID is required'
        })
    }),
    body: Joi.object({
      person_name: Joi.string()
        .max(100)
        .required()
        .messages({
          'string.empty': 'Person name is required',
          'string.max': 'Person name must not exceed 100 characters',
          'any.required': 'Person name is required'
        }),
      email: Joi.string()
        .email()
        .max(255)
        .optional()
        .allow(null, '')
        .messages({
          'string.email': 'Email must be a valid email address',
          'string.max': 'Email must not exceed 255 characters'
        }),
      phone_number: Joi.string()
        .max(20)
        .pattern(/^[\+]?[0-9\s\-\(\)]+$/)
        .optional()
        .allow(null, '')
        .messages({
          'string.pattern.base': 'Phone number must contain only digits, spaces, hyphens, parentheses, and optional + prefix',
          'string.max': 'Phone number must not exceed 20 characters'
        }),
      is_verified: Joi.boolean()
        .required()
        .messages({
          'boolean.base': 'Is verified must be a boolean value',
          'any.required': 'Is verified is required'
        })
    })
  },

  deletePerson: {
    params: Joi.object({
      lead_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Lead ID must be a valid UUID',
          'any.required': 'Lead ID is required'
        }),
      person_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Person ID must be a valid UUID',
          'any.required': 'Person ID is required'
        })
    })
  },

  getPersons: {
    params: Joi.object({
      lead_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Lead ID must be a valid UUID',
          'any.required': 'Lead ID is required'
        })
    })
  }
};

module.exports = leadsValidation;
