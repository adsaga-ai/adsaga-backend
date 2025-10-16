const Joi = require('joi');

/**
 * Validation schemas for workflow endpoints
 */
const workflowValidation = {
  /**
   * Validate run workflow request
   */
  validateRunWorkflow: (req, res, next) => {
    const schema = Joi.object({
      workflow_config_id: Joi.string().uuid().required()
    });

    const { error } = schema.validate(req.params);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }
    
    next();
  },

  /**
   * Validate job ID parameter
   */
  validateJobId: (req, res, next) => {
    const schema = Joi.object({
      job_id: Joi.string().required()
    });

    const { error } = schema.validate(req.params);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }
    
    next();
  },

  /**
   * Validate workflow ID parameter
   */
  validateWorkflowId: (req, res, next) => {
    const schema = Joi.object({
      workflow_id: Joi.string().uuid().required()
    });

    const { error } = schema.validate(req.params);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message
      });
    }
    
    next();
  }
};

module.exports = workflowValidation;
