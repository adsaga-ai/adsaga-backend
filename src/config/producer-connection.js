const Producer = require('../utils/agenda/agenda-producer');
const config = require('./');

/**
 * Producer connection singleton
 * Initializes and exports a single Producer instance for the application
 */
class ProducerConnection {
  constructor() {
    this.producer = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the producer connection
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      this.producer = new Producer({
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

      await this.producer.initialize();
      this.isInitialized = true;
      
      console.log('Producer connection initialized successfully');
    } catch (error) {
      console.error('Failed to initialize producer connection:', error);
      throw error;
    }
  }

  /**
   * Get the producer instance
   * @returns {Producer} Producer instance
   */
  getProducer() {
    if (!this.isInitialized || !this.producer) {
      throw new Error('Producer not initialized. Call initialize() first.');
    }
    return this.producer;
  }

  /**
   * Check if producer is ready
   * @returns {boolean} Ready status
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Gracefully shutdown the producer
   * @returns {Promise<void>}
   */
  async shutdown() {
    if (this.producer) {
      await this.producer.shutdown();
      this.isInitialized = false;
      console.log('Producer connection shutdown');
    }
  }
}

// Export singleton instance
const producerConnection = new ProducerConnection();
producerConnection.initialize();

module.exports = producerConnection;
