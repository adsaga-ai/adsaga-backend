const express = require('express');
const subscriptionRoutes = require('./subscription/subscription.routes');
const organisationRoutes = require('./organisation/organisation.routes');
const userRoutes = require('./users/user.routes');
const workflowConfigRoutes = require('./workflow-config/workflow-config.routes');

const router = express.Router();

router.use('/subscriptions', subscriptionRoutes);
router.use('/organisations', organisationRoutes);
router.use('/users', userRoutes);
router.use('/workflow-configs', workflowConfigRoutes);

module.exports = router;
