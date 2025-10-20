const RedisConsumer = require('../utils/redis/redis-consumer');
const leadDiscoveryHandler = require('./handlers/lead-discovery-handler');
const config = require('../config');

const consumer = new RedisConsumer({
  redis: config.redis,
  jobChannel: 'job_queue',
  defaultConcurrency: 3
});

async function initiateConsumers() {
  try {
    console.log('Initializing Redis consumer...');
    await consumer.initialize();

    console.log('Defining lead_discovery_handler job...');
    console.log('Handler type:', typeof leadDiscoveryHandler);
    console.log('Handler function:', leadDiscoveryHandler.toString().substring(0, 100) + '...');

    consumer.defineJob('lead_discovery_handler', {
      concurrency: 3,
      priority: 'normal'
    }, leadDiscoveryHandler);

    console.log('All Redis consumers initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Redis consumers:', error);
    throw error;
  }
}

module.exports = {
  consumer,
  initiateConsumers
};
