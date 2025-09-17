const express = require('express');
const subscriptionController = require('./subscription.controller');
const subscriptionValidation = require('./subscription.validation');
const validate = require('../../middleware/validation-handler');

const router = express.Router('/subscriptions');

router.get('/', subscriptionController.getAllSubscriptions);

router.get(
  '/:subscription_code',
  validate(subscriptionValidation.getByCode),
  subscriptionController.getSubscriptionByCode
);

router.post(
  '/',
  validate(subscriptionValidation.create),
  subscriptionController.createSubscription
);

router.put(
  '/:subscription_code',
  validate(subscriptionValidation.update),
  subscriptionController.updateSubscription
);

router.delete(
  '/:subscription_code',
  validate(subscriptionValidation.delete),
  subscriptionController.deleteSubscription
);

module.exports = router;
