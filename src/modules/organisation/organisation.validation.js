const Joi = require('joi');

const organisationValidation = {
  create: {
    body: Joi.object({
      organisation_name: Joi.string()
        .max(25)
        .required()
        .messages({
          'string.empty': 'Organisation name is required',
          'string.max': 'Organisation name must not exceed 25 characters',
          'any.required': 'Organisation name is required'
        }),
      website: Joi.string()
        .uri()
        .max(50)
        .optional()
        .allow(null, '')
        .messages({
          'string.uri': 'Website must be a valid URL',
          'string.max': 'Website must not exceed 50 characters'
        }),
      subscription_code: Joi.string()
        .max(10)
        .optional()
        .messages({
          'string.max': 'Subscription code must not exceed 10 characters'
        }),
      locations: Joi.array()
        .items(
          Joi.object({
            address: Joi.string()
              .max(100)
              .required()
              .messages({
                'string.empty': 'Address is required',
                'string.max': 'Address must not exceed 100 characters',
                'any.required': 'Address is required'
              }),
            city: Joi.string()
              .max(50)
              .required()
              .messages({
                'string.empty': 'City is required',
                'string.max': 'City must not exceed 50 characters',
                'any.required': 'City is required'
              }),
            state: Joi.string()
              .max(50)
              .required()
              .messages({
                'string.empty': 'State is required',
                'string.max': 'State must not exceed 50 characters',
                'any.required': 'State is required'
              }),
            country: Joi.string()
              .max(50)
              .required()
              .messages({
                'string.empty': 'Country is required',
                'string.max': 'Country must not exceed 50 characters',
                'any.required': 'Country is required'
              })
          })
        )
        .optional()
        .messages({
          'array.base': 'Locations must be an array'
        }),
    })
  },

  update: {
    params: Joi.object({
      organisation_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Organisation ID must be a valid UUID',
          'any.required': 'Organisation ID is required'
        })
    }),
    body: Joi.object({
      organisation_name: Joi.string()
        .max(25)
        .required()
        .messages({
          'string.empty': 'Organisation name is required',
          'string.max': 'Organisation name must not exceed 25 characters',
          'any.required': 'Organisation name is required'
        }),
      website: Joi.string()
        .uri()
        .max(50)
        .optional()
        .allow(null, '')
        .messages({
          'string.uri': 'Website must be a valid URL',
          'string.max': 'Website must not exceed 50 characters'
        }),
      subscription_code: Joi.string()
        .max(10)
        .optional()
        .messages({
          'string.max': 'Subscription code must not exceed 10 characters'
        }),
      locations: Joi.array()
        .items(
          Joi.object({
            address: Joi.string()
              .max(100)
              .required()
              .messages({
                'string.empty': 'Address is required',
                'string.max': 'Address must not exceed 100 characters',
                'any.required': 'Address is required'
              }),
            city: Joi.string()
              .max(50)
              .required()
              .messages({
                'string.empty': 'City is required',
                'string.max': 'City must not exceed 50 characters',
                'any.required': 'City is required'
              }),
            state: Joi.string()
              .max(50)
              .required()
              .messages({
                'string.empty': 'State is required',
                'string.max': 'State must not exceed 50 characters',
                'any.required': 'State is required'
              }),
            country: Joi.string()
              .max(50)
              .required()
              .messages({
                'string.empty': 'Country is required',
                'string.max': 'Country must not exceed 50 characters',
                'any.required': 'Country is required'
              })
          })
        )
        .optional()
        .messages({
          'array.base': 'Locations must be an array'
        }),
    })
  },

  patch: {
    params: Joi.object({
      organisation_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Organisation ID must be a valid UUID',
          'any.required': 'Organisation ID is required'
        })
    }),
    body: Joi.object({
      organisation_name: Joi.string()
        .max(25)
        .optional()
        .messages({
          'string.max': 'Organisation name must not exceed 25 characters'
        }),
      website: Joi.string()
        .uri()
        .max(50)
        .optional()
        .allow(null, '')
        .messages({
          'string.uri': 'Website must be a valid URL',
          'string.max': 'Website must not exceed 50 characters'
        }),
      subscription_code: Joi.string()
        .max(10)
        .optional()
        .messages({
          'string.max': 'Subscription code must not exceed 10 characters'
        }),
      locations: Joi.array()
        .items(
          Joi.object({
            address: Joi.string()
              .max(100)
              .required()
              .messages({
                'string.empty': 'Address is required',
                'string.max': 'Address must not exceed 100 characters',
                'any.required': 'Address is required'
              }),
            city: Joi.string()
              .max(50)
              .required()
              .messages({
                'string.empty': 'City is required',
                'string.max': 'City must not exceed 50 characters',
                'any.required': 'City is required'
              }),
            state: Joi.string()
              .max(50)
              .required()
              .messages({
                'string.empty': 'State is required',
                'string.max': 'State must not exceed 50 characters',
                'any.required': 'State is required'
              }),
            country: Joi.string()
              .max(50)
              .required()
              .messages({
                'string.empty': 'Country is required',
                'string.max': 'Country must not exceed 50 characters',
                'any.required': 'Country is required'
              })
          })
        )
        .optional()
        .messages({
          'array.base': 'Locations must be an array'
        }),
    }).min(1).messages({
      'object.min': 'At least one field must be provided for update'
    })
  },

  getById: {
    params: Joi.object({
      organisation_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Organisation ID must be a valid UUID',
          'any.required': 'Organisation ID is required'
        })
    })
  },

  delete: {
    params: Joi.object({
      organisation_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Organisation ID must be a valid UUID',
          'any.required': 'Organisation ID is required'
        })
    })
  },

  getBySubscriptionCode: {
    params: Joi.object({
      subscription_code: Joi.string()
        .max(10)
        .required()
        .messages({
          'string.empty': 'Subscription code is required',
          'string.max': 'Subscription code must not exceed 10 characters',
          'any.required': 'Subscription code is required'
        })
    })
  }
};

module.exports = organisationValidation;
