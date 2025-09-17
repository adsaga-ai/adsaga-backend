const responseHandler = (req, res, next) => {
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to format response
    res.json = function(data) {
        const response = {
            success: true,
            data: data
        };
        
        // If no status code is set, default to 200
        if (!res.statusCode) {
            res.statusCode = 200;
        }
        
        // Override success for error status codes
        if (res.statusCode >= 400) {
            response.success = false;
            // For error responses, data might be error message or details
            response.data = data;
        }
        
        return originalJson.call(this, response);
    };
    
    // Helper methods for common responses
    res.success = function(data, statusCode = 200) {
        return res.status(statusCode).json(data);
    };
    
    res.error = function(message, statusCode = 500, details = null) {
        const errorData = {
            message: message,
            ...(details && { details })
        };
        return res.status(statusCode).json(errorData);
    };
    
    // Specific error helpers
    res.badRequest = function(message = 'Bad Request', details = null) {
        return res.error(message, 400, details);
    };
    
    res.unauthorized = function(message = 'Unauthorized', details = null) {
        return res.error(message, 401, details);
    };
    
    res.notFound = function(message = 'Not Found', details = null) {
        return res.error(message, 404, details);
    };
    
    res.internalError = function(message = 'Internal Server Error', details = null) {
        return res.error(message, 500, null);
    };
    
    res.created = function(data) {
        return res.success(data, 201);
    };
    
    res.ok = function(data) {
        return res.success(data, 200);
    };
    
    next();
};

// Static methods for direct usage in controllers
responseHandler.success = function(res, data, message = null, statusCode = 200) {
    const response = {
        success: true,
        data: data
    };
    
    if (message) {
        response.message = message;
    }
    
    return res.status(statusCode).json(response);
};

responseHandler.error = function(res, message, statusCode = 500, details = null) {
    const response = {
        success: false,
        message: message
    };
    
    if (details) {
        response.details = details;
    }
    
    return res.status(statusCode).json(response);
};

module.exports = responseHandler;
