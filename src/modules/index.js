const express = require('express');
const subscriptionRoutes = require('./subscription/subscription.routes');
const organisationRoutes = require('./organisation/organisation.routes');
const userRoutes = require('./users/user.routes');

const router = express.Router();

router.use('/subscriptions', subscriptionRoutes);
router.use('/organisations', organisationRoutes);
router.use('/users', userRoutes);

module.exports = router;
