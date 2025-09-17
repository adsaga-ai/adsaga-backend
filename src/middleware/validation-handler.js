const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];
    
    // Validate params if schema has params
    if (schema.params) {
      const { error: paramsError } = schema.params.validate(req.params);
      if (paramsError) {
        errors.push(...paramsError.details.map(detail => ({
          field: `params.${detail.path.join('.')}`,
          message: detail.message
        })));
      }
    }
    
    // Validate body if schema has body
    if (schema.body) {
      const { error: bodyError } = schema.body.validate(req.body);
      if (bodyError) {
        errors.push(...bodyError.details.map(detail => ({
          field: `body.${detail.path.join('.')}`,
          message: detail.message
        })));
      }
    }
    
    // Validate query if schema has query
    if (schema.query) {
      const { error: queryError } = schema.query.validate(req.query);
      if (queryError) {
        errors.push(...queryError.details.map(detail => ({
          field: `query.${detail.path.join('.')}`,
          message: detail.message
        })));
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    next();
  };
};

module.exports = validate;
