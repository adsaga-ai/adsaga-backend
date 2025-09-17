const subscriptionRepository = require('./subscription.data');
const responseHandler = require('../../utils/response-handler');

class SubscriptionController {
  async getAllSubscriptions(req, res, next) {
    try {
      const subscriptions = await subscriptionRepository.findAll();
      return responseHandler.success(res, subscriptions, 'Subscription types retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to retrieve subscription types');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async getSubscriptionByCode(req, res, next) {
    try {
      const { subscription_code } = req.params;
      const subscription = await subscriptionRepository.findByCode(subscription_code);
      
      if (!subscription) {
        return responseHandler.error(res, 'Subscription type not found', 404);
      }
      
      return responseHandler.success(res, subscription, 'Subscription type retrieved successfully');
    } catch (error) {
      req.log.error(error, 'Failed to retrieve subscription type by code');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async createSubscription(req, res, next) {
    try {
      const { subscription_code, subscription_name } = req.body;
      
      // Check if subscription code already exists
      const existingSubscription = await subscriptionRepository.findByCode(subscription_code);
      if (existingSubscription) {
        return responseHandler.error(res, 'Subscription code already exists', 409);
      }
      
      const newSubscription = await subscriptionRepository.create({
        subscriptionCode: subscription_code,
        subscriptionName: subscription_name
      });
      
      return responseHandler.success(res, newSubscription, 'Subscription type created successfully', 201);
    } catch (error) {
      req.log.error(error, 'Failed to create subscription type');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async updateSubscription(req, res, next) {
    try {
      const { subscription_code } = req.params;
      const { subscription_name } = req.body;
      
      // Check if subscription exists
      const existingSubscription = await subscriptionRepository.findByCode(subscription_code);
      if (!existingSubscription) {
        return responseHandler.error(res, 'Subscription type not found', 404);
      }
      
      const updatedSubscription = await subscriptionRepository.update(subscription_code, {
        subscriptionName: subscription_name
      });
      
      return responseHandler.success(res, updatedSubscription, 'Subscription type updated successfully');
    } catch (error) {
      req.log.error(error, 'Failed to update subscription type');
      return responseHandler.error(res, error.message, 500);
    }
  }

  async deleteSubscription(req, res, next) {
    try {
      const { subscription_code } = req.params;
      
      // Check if subscription exists
      const existingSubscription = await subscriptionRepository.findByCode(subscription_code);
      if (!existingSubscription) {
        return responseHandler.error(res, 'Subscription type not found', 404);
      }
      
      const deletedSubscription = await subscriptionRepository.delete(subscription_code);
      
      return responseHandler.success(res, deletedSubscription, 'Subscription type deleted successfully');
    } catch (error) {
      req.log.error(error, 'Failed to delete subscription type');
      return responseHandler.error(res, error.message, 500);
    }
  }
}

module.exports = new SubscriptionController();
