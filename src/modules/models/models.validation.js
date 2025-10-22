const Joi = require('joi');

const modelValidation = {

  create: {
    body: Joi.object({
      model_name: Joi.string().min(1).max(50).required().messages({
        'string.min': 'Model name must be at least 1 character long',
        'string.max': 'Model name must not exceed 50 characters',
        'any.required': 'Model name is required'
      }),
      model_type: Joi.string().valid('LLM', 'EMBEDDING', 'VISION', 'TEXT_TO_SPEECH', 'SPEECH_TO_TEXT', 'IMAGE_GENERATION').required().messages({
        'any.only': 'Model type must be one of: LLM, EMBEDDING, VISION, TEXT_TO_SPEECH, SPEECH_TO_TEXT, IMAGE_GENERATION',
        'any.required': 'Model type is required'
      }),
      input_token_amount: Joi.number().positive().required().messages({
        'number.positive': 'Input token amount must be a positive number',
        'any.required': 'Input token amount is required'
      }),
      input_token_counts: Joi.number().positive().required().messages({
        'number.positive': 'Input token counts must be a positive number',
        'any.required': 'Input token counts is required'
      }),
      output_token_amount: Joi.number().positive().required().messages({
        'number.positive': 'Output token amount must be a positive number',
        'any.required': 'Output token amount is required'
      }),
      output_token_counts: Joi.number().positive().required().messages({
        'number.positive': 'Output token counts must be a positive number',
        'any.required': 'Output token counts is required'
      })
    })
  },

  update: {
    params: Joi.object({
      model_id: Joi.string().uuid().required().messages({
        'string.guid': 'Model ID must be a valid UUID',
        'any.required': 'Model ID is required'
      })
    }),
    body: Joi.object({
      model_name: Joi.string().min(1).max(50).messages({
        'string.min': 'Model name must be at least 1 character long',
        'string.max': 'Model name must not exceed 50 characters'
      }),
      model_type: Joi.string().valid('LLM', 'EMBEDDING', 'VISION', 'TEXT_TO_SPEECH', 'SPEECH_TO_TEXT', 'IMAGE_GENERATION').messages({
        'any.only': 'Model type must be one of: LLM, EMBEDDING, VISION, TEXT_TO_SPEECH, SPEECH_TO_TEXT, IMAGE_GENERATION'
      }),
      input_token_amount: Joi.number().positive().messages({
        'number.positive': 'Input token amount must be a positive number'
      }),
      input_token_counts: Joi.number().positive().messages({
        'number.positive': 'Input token counts must be a positive number'
      }),
      output_token_amount: Joi.number().positive().messages({
        'number.positive': 'Output token amount must be a positive number'
      }),
      output_token_counts: Joi.number().positive().messages({
        'number.positive': 'Output token counts must be a positive number'
      })
    }).min(1).messages({
      'object.min': 'At least one field must be provided for update'
    })
  },

  getById: {
    params: Joi.object({
      model_id: Joi.string().uuid().required().messages({
        'string.guid': 'Model ID must be a valid UUID',
        'any.required': 'Model ID is required'
      })
    })
  },

  list: {
    query: Joi.object({
      search: Joi.string().min(1).max(100).messages({
        'string.min': 'Search term must be at least 1 character long',
        'string.max': 'Search term must not exceed 100 characters'
      }),
      model_type: Joi.string().valid('LLM', 'EMBEDDING', 'VISION', 'TEXT_TO_SPEECH', 'SPEECH_TO_TEXT', 'IMAGE_GENERATION').messages({
        'any.only': 'Model type must be one of: LLM, EMBEDDING, VISION, TEXT_TO_SPEECH, SPEECH_TO_TEXT, IMAGE_GENERATION'
      }),
      page: Joi.number().integer().min(1).default(1).messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),
      limit: Joi.number().integer().min(1).max(100).default(10).messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit must not exceed 100'
      })
    })
  },

  delete: {
    params: Joi.object({
      model_id: Joi.string().uuid().required().messages({
        'string.guid': 'Model ID must be a valid UUID',
        'any.required': 'Model ID is required'
      })
    })
  }
};

module.exports = modelValidation;
