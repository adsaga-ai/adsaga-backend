const Joi = require('joi');

const userValidation = {
  register: {
    body: Joi.object({
      organisation_id: Joi.string().uuid().optional().messages({
        'string.guid': 'Organisation ID must be a valid UUID'
      }),
      fullname: Joi.string().min(2).max(50).required().messages({
        'string.min': 'Full name must be at least 2 characters long',
        'string.max': 'Full name must not exceed 50 characters',
        'any.required': 'Full name is required'
      }),
      email: Joi.string().email().max(255).required().messages({
        'string.email': 'Please provide a valid email address',
        'string.max': 'Email must not exceed 255 characters',
        'any.required': 'Email is required'
      }),
      password: Joi.string().min(6).max(255).required().messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password must not exceed 255 characters',
        'any.required': 'Password is required'
      })
    })
  },

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

  getById: {
    params: Joi.object({
      user_id: Joi.string().uuid().required().messages({
        'string.guid': 'User ID must be a valid UUID',
        'any.required': 'User ID is required'
      })
    })
  },

  getByEmail: {
    params: Joi.object({
      email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      })
    })
  },

  update: {
    params: Joi.object({
      user_id: Joi.string().uuid().required().messages({
        'string.guid': 'User ID must be a valid UUID',
        'any.required': 'User ID is required'
      })
    }),
    body: Joi.object({
      fullname: Joi.string().min(2).max(50).optional().messages({
        'string.min': 'Full name must be at least 2 characters long',
        'string.max': 'Full name must not exceed 50 characters'
      }),
      email: Joi.string().email().max(255).optional().messages({
        'string.email': 'Please provide a valid email address',
        'string.max': 'Email must not exceed 255 characters'
      }),
      password: Joi.string().min(6).max(255).optional().messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password must not exceed 255 characters'
      }),
      organisation_id: Joi.string().uuid().optional().messages({
        'string.guid': 'Organisation ID must be a valid UUID'
      })
    }).min(1).messages({
      'object.min': 'At least one field must be provided for update'
    })
  },

  delete: {
    params: Joi.object({
      user_id: Joi.string().uuid().required().messages({
        'string.guid': 'User ID must be a valid UUID',
        'any.required': 'User ID is required'
      })
    })
  },

  forgotPassword: {
    body: Joi.object({
      email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      })
    })
  },

  resetPassword: {
    body: Joi.object({
      token: Joi.string().required().messages({
        'any.required': 'Reset token is required'
      }),
      password: Joi.string().min(6).max(255).required().messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password must not exceed 255 characters',
        'any.required': 'Password is required'
      }),
      confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Confirm password must match password',
        'any.required': 'Confirm password is required'
      })
    })
  }
};

module.exports = userValidation;
