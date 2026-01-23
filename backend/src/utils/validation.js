const Joi = require('joi');

/**
 * Validate session ID format
 * @param {string} sessionId - Session ID to validate
 * @returns {object} Validation result
 */
const validateSessionId = (sessionId) => {
  if (!sessionId) {
    return {
      isValid: false,
      message: 'Session ID is required'
    };
  }

  if (typeof sessionId !== 'string') {
    return {
      isValid: false,
      message: 'Session ID must be a string'
    };
  }

  if (sessionId.length !== 6) {
    return {
      isValid: false,
      message: 'Session ID must be exactly 6 characters'
    };
  }

  if (!/^[A-Z0-9]{6}$/.test(sessionId.toUpperCase())) {
    return {
      isValid: false,
      message: 'Session ID must contain only letters and numbers'
    };
  }

  return {
    isValid: true,
    message: 'Valid session ID'
  };
};

/**
 * Validate clipboard content
 * @param {string} content - Content to validate
 * @returns {object} Validation result
 */
const validateContent = (content) => {
  if (content === null || content === undefined) {
    return {
      isValid: false,
      message: 'Content is required'
    };
  }

  if (typeof content !== 'string') {
    return {
      isValid: false,
      message: 'Content must be a string'
    };
  }

  if (content.length > 50000) {
    return {
      isValid: false,
      message: 'Content exceeds maximum length of 50,000 characters'
    };
  }

  return {
    isValid: true,
    message: 'Valid content'
  };
};

/**
 * Joi schema for creating session
 */
const createSessionSchema = Joi.object({
  // No required fields for session creation
});

/**
 * Joi schema for updating clipboard
 */
const updateClipboardSchema = Joi.object({
  content: Joi.string().max(50000).required().messages({
    'string.base': 'Content must be a string',
    'string.max': 'Content cannot exceed 50,000 characters',
    'any.required': 'Content is required'
  })
});

/**
 * Joi schema for session ID parameter
 */
const sessionIdSchema = Joi.object({
  sessionId: Joi.string().length(6).pattern(/^[A-Z0-9]{6}$/i).required().messages({
    'string.base': 'Session ID must be a string',
    'string.length': 'Session ID must be exactly 6 characters',
    'string.pattern.base': 'Session ID must contain only letters and numbers',
    'any.required': 'Session ID is required'
  })
});

/**
 * Middleware to validate request body
 * @param {object} schema - Joi schema to validate against
 * @returns {function} Express middleware function
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

/**
 * Middleware to validate request parameters
 * @param {object} schema - Joi schema to validate against
 * @returns {function} Express middleware function
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

module.exports = {
  validateSessionId,
  validateContent,
  createSessionSchema,
  updateClipboardSchema,
  sessionIdSchema,
  validateBody,
  validateParams
};