const Consumer = require('../utils/agenda/agenda-consumer');
const leadDiscoveryHandler = require('./handlers/lead-discovery-handler');
const config = require('../config');

const consumer = new Consumer({
  agenda: {
    db: {
      address: config.mongodb.uri,
      collection: 'agenda-jobs',
      options: {
        connectTimeoutMS: 30000,
        socketTimeoutMS: 30000,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 10000
      }
    }
  }
});

async function initiateConsumers() {
  try {
    console.log('Initializing consumer...');
    await consumer.initialize();

    console.log('Defining lead_discovery_handler job...');
    console.log('Handler type:', typeof leadDiscoveryHandler);
    console.log('Handler function:', leadDiscoveryHandler.toString().substring(0, 100) + '...');

    consumer.defineJob('lead_discovery_handler', {
      concurrency: 3,
      priority: 'normal',
      lockLifetime: 30 * 60 * 1000
    }, leadDiscoveryHandler);

    console.log('All consumers initialized successfully');
  } catch (error) {
    console.error('Failed to initialize consumers:', error);
    throw error;
  }
}

module.exports = {
  consumer,
  initiateConsumers
};
