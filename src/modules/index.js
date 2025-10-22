const express = require('express');
const subscriptionRoutes = require('./subscription/subscription.routes');
const organisationRoutes = require('./organisation/organisation.routes');
const userRoutes = require('./users/user.routes');
const workflowConfigRoutes = require('./workflow-config/workflow-config.routes');
const workflowRoutes = require('./workflow/workflow.routes');
const leadsRoutes = require('./leads/leads.routes');
const adminRoutes = require('./admin/admin.routes');

const router = express.Router();

router.use('/admin', adminRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/organisations', organisationRoutes);
router.use('/users', userRoutes);
router.use('/workflow-configs', workflowConfigRoutes);
router.use('/workflows', workflowRoutes);
router.use('/leads', leadsRoutes);

module.exports = router;
