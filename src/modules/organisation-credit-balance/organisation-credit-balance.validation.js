const Joi = require('joi');

const organisationCreditBalanceValidation = {
  create: {
    body: Joi.object({
      organisation_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Organisation ID must be a valid UUID',
          'any.required': 'Organisation ID is required'
        }),
      credit_balance: Joi.number()
        .min(0)
        .precision(2)
        .optional()
        .default(0.00)
        .messages({
          'number.min': 'Credit balance must be greater than or equal to 0',
          'number.precision': 'Credit balance must have at most 2 decimal places'
        })
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

  listBalances: {
    query: Joi.object({
      organisation_name: Joi.string()
        .max(25)
        .optional()
        .allow('')
        .messages({
          'string.max': 'Organisation name must not exceed 25 characters'
        }),
      website: Joi.string()
        .uri()
        .max(50)
        .optional()
        .allow('')
        .messages({
          'string.uri': 'Website must be a valid URL',
          'string.max': 'Website must not exceed 50 characters'
        })
    })
  },

  listTransactions: {
    params: Joi.object({
      organisation_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Organisation ID must be a valid UUID',
          'any.required': 'Organisation ID is required'
        })
    }),
    query: Joi.object({
      limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .optional()
        .default(50)
        .messages({
          'number.base': 'Limit must be a number',
          'number.integer': 'Limit must be an integer',
          'number.min': 'Limit must be at least 1',
          'number.max': 'Limit must not exceed 100'
        }),
      offset: Joi.number()
        .integer()
        .min(0)
        .optional()
        .default(0)
        .messages({
          'number.base': 'Offset must be a number',
          'number.integer': 'Offset must be an integer',
          'number.min': 'Offset must be at least 0'
        })
    })
  },

  addCreditTransaction: {
    body: Joi.object({
      organisation_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Organisation ID must be a valid UUID',
          'any.required': 'Organisation ID is required'
        }),
      credit_amount: Joi.number()
        .positive()
        .precision(2)
        .required()
        .messages({
          'number.positive': 'Credit amount must be greater than 0',
          'number.precision': 'Credit amount must have at most 2 decimal places',
          'any.required': 'Credit amount is required'
        }),
      dollar_amount: Joi.number()
        .positive()
        .precision(2)
        .required()
        .messages({
          'number.positive': 'Dollar amount must be greater than 0',
          'number.precision': 'Dollar amount must have at most 2 decimal places',
          'any.required': 'Dollar amount is required for credit transactions'
        })
    })
  },

  addDebitTransaction: {
    body: Joi.object({
      organisation_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Organisation ID must be a valid UUID',
          'any.required': 'Organisation ID is required'
        }),
      credit_amount: Joi.number()
        .positive()
        .precision(2)
        .required()
        .messages({
          'number.positive': 'Credit amount must be greater than 0',
          'number.precision': 'Credit amount must have at most 2 decimal places',
          'any.required': 'Credit amount is required'
        }),
      workflow_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Workflow ID must be a valid UUID',
          'any.required': 'Workflow ID is required for debit transactions'
        })
    })
  },

  getTransactionSummary: {
    params: Joi.object({
      organisation_id: Joi.string()
        .uuid()
        .required()
        .messages({
          'string.guid': 'Organisation ID must be a valid UUID',
          'any.required': 'Organisation ID is required'
        })
    })
  }
};

module.exports = organisationCreditBalanceValidation;
