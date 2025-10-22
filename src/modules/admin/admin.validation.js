const Joi = require('joi');

const adminValidation = {

  login: {
    body: Joi.object({
      email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
      password: Joi.string().required().messages({
        'any.required': 'Password is required'
      })
    })
  },

  create: {
    body: Joi.object({
      fullname: Joi.string().min(2).max(50).required().messages({
        'string.min': 'Full name must be at least 2 characters long',
        'string.max': 'Full name must not exceed 50 characters',
        'any.required': 'Full name is required'
      }),
      email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
      password: Joi.string().min(8).required().messages({
        'string.min': 'Password must be at least 8 characters long',
        'any.required': 'Password is required'
      })
    })
  },

  update: {
    body: Joi.object({
      fullname: Joi.string().min(2).max(50).messages({
        'string.min': 'Full name must be at least 2 characters long',
        'string.max': 'Full name must not exceed 50 characters'
      }),
      email: Joi.string().email().messages({
        'string.email': 'Please provide a valid email address'
      })
    })
  },

  changePassword: {
    body: Joi.object({
      currentPassword: Joi.string().required().messages({
        'any.required': 'Current password is required'
      }),
      newPassword: Joi.string().min(8).required().messages({
        'string.min': 'New password must be at least 8 characters long',
        'any.required': 'New password is required'
      })
    })
  },

  getById: {
    params: Joi.object({
      admin_id: Joi.string().uuid().required().messages({
        'string.guid': 'Admin ID must be a valid UUID',
        'any.required': 'Admin ID is required'
      })
    })
  },

  delete: {
    params: Joi.object({
      admin_id: Joi.string().uuid().required().messages({
        'string.guid': 'Admin ID must be a valid UUID',
        'any.required': 'Admin ID is required'
      })
    })
  }
};

module.exports = adminValidation;
