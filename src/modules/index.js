const express = require('express');
const subscriptionRoutes = require('./subscription/subscription.routes');

const router = express.Router();

router.use('/subscriptions', subscriptionRoutes);

module.exports = router;
