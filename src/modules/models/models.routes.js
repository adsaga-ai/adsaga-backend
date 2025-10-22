const express = require('express');
const modelController = require('./models.controller');
const modelValidation = require('./models.validation');
const validate = require('../../middleware/validation-handler');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();

// All model routes require admin authentication
router.use(adminAuth);

// Create new model
router.post(
  '/',
  validate(modelValidation.create),
  modelController.create
);

// Get all models with search and filter
router.get(
  '/',
  validate(modelValidation.list),
  modelController.list
);

// Get model by ID
router.get(
  '/:model_id',
  validate(modelValidation.getById),
  modelController.getById
);

// Update model
router.put(
  '/:model_id',
  validate(modelValidation.update),
  modelController.update
);

// Delete model
router.delete(
  '/:model_id',
  validate(modelValidation.delete),
  modelController.delete
);

module.exports = router;
