const Joi = require('joi');

const subscriptionValidation = {
  create: {
    body: Joi.object({
      subscription_code: Joi.string()
        .max(10)
        .required()
        .messages({
          'string.empty': 'Subscription code is required',
          'string.max': 'Subscription code must not exceed 10 characters',
          'any.required': 'Subscription code is required'
        }),
      subscription_name: Joi.string()
        .max(25)
        .required()
        .messages({
          'string.empty': 'Subscription name is required',
          'string.max': 'Subscription name must not exceed 25 characters',
          'any.required': 'Subscription name is required'
        })
    })
  },

  update: {
    params: Joi.object({
      subscription_code: Joi.string()
        .max(10)
        .required()
        .messages({
          'string.empty': 'Subscription code is required',
          'string.max': 'Subscription code must not exceed 10 characters',
          'any.required': 'Subscription code is required'
        })
    }),
    body: Joi.object({
      subscription_name: Joi.string()
        .max(25)
        .required()
        .messages({
          'string.empty': 'Subscription name is required',
          'string.max': 'Subscription name must not exceed 25 characters',
          'any.required': 'Subscription name is required'
        })
    })
  },

  getByCode: {
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
  },

  delete: {
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

module.exports = subscriptionValidation;
