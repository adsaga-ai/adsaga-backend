const { createClient } = require('redis');
const pino = require('pino');

/**
 * Core Redis configuration and connection management
 * Provides centralized Redis instance with proper error handling and reconnection
 */
class RedisCore {
  constructor(config = {}) {
    this.config = {
      // Default configuration
      host: 'localhost',
      port: 6379,
      password: null,
      db: 0,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      // Connection options
      socket: {
        connectTimeout: 10000,
        lazyConnect: true,
        reconnectStrategy: (retries) => {
          if (retries > 20) {
            return new Error('Too many reconnection attempts');
          }
          return Math.min(retries * 50, 2000);
        }
      },
      // Override with provided config
      ...config
    };

    this.logger = pino({
      name: 'redis-core',
      level: process.env.LOG_LEVEL || 'info'
    });

    this.client = null;
    this.publisher = null;
    this.subscriber = null;
    this.isConnected = false;
    this.isShuttingDown = false;
    this.connectionRetries = 0;
    this.maxRetries = 10;
  }

  /**
   * Initialize and connect to Redis
   * @returns {Promise<Object>} Connected Redis clients
   */
  async connect() {
    try {
      if (this.client && this.isConnected) {
        this.logger.info('Redis already connected');
        return { client: this.client, publisher: this.publisher, subscriber: this.subscriber };
      }

      // Parse database number (Redis expects numeric DB index)
      const dbNumber = typeof this.config.db === 'string' ? parseInt(this.config.db) || 0 : this.config.db;
      
      this.logger.info({ 
        config: this.config,
        redisUrl: `redis://${this.config.password ? `:***@` : ''}${this.config.host}:${this.config.port}/${dbNumber}`
      }, 'Connecting to Redis');
      
      // Create main client for general operations
      this.client = createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
          ...this.config.socket
        },
        password: this.config.password,
        database: dbNumber,
        retryDelayOnFailover: this.config.retryDelayOnFailover,
        enableReadyCheck: this.config.enableReadyCheck,
        maxRetriesPerRequest: this.config.maxRetriesPerRequest
      });

      // Create publisher client for pub/sub
      this.publisher = createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
          ...this.config.socket
        },
        password: this.config.password,
        database: dbNumber,
        retryDelayOnFailover: this.config.retryDelayOnFailover,
        enableReadyCheck: this.config.enableReadyCheck,
        maxRetriesPerRequest: this.config.maxRetriesPerRequest
      });

      // Create subscriber client for pub/sub
      this.subscriber = createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
          ...this.config.socket
        },
        password: this.config.password,
        database: dbNumber,
        retryDelayOnFailover: this.config.retryDelayOnFailover,
        enableReadyCheck: this.config.enableReadyCheck,
        maxRetriesPerRequest: this.config.maxRetriesPerRequest
      });
      
      // Set up event listeners
      this._setupEventListeners();
      
      // Connect all clients
      await Promise.all([
        this.client.connect(),
        this.publisher.connect(),
        this.subscriber.connect()
      ]);
      
      this.isConnected = true;
      this.connectionRetries = 0;
      
      this.logger.info('Redis connected successfully');
      
      return { 
        client: this.client, 
        publisher: this.publisher, 
        subscriber: this.subscriber 
      };
    } catch (error) {
      this.logger.error(error, 'Failed to connect to Redis');
      this.connectionRetries++;
      
      if (this.connectionRetries < this.maxRetries) {
        this.logger.info({ 
          retry: this.connectionRetries, 
          maxRetries: this.maxRetries 
        }, 'Retrying Redis connection');
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, this.connectionRetries), 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.connect();
      }
      
      throw error;
    }
  }

  /**
   * Set up event listeners for Redis clients
   * @private
   */
  _setupEventListeners() {
    if (!this.client) return;

    // Main client events
    this.client.on('connect', () => {
      this.logger.info('Redis client connected');
    });

    this.client.on('ready', () => {
      this.logger.info('Redis client ready');
      this.isConnected = true;
    });

    this.client.on('error', (error) => {
      this.logger.error(error, 'Redis client error');
      this.isConnected = false;
    });

    this.client.on('end', () => {
      this.logger.info('Redis client connection ended');
      this.isConnected = false;
    });

    // Publisher events
    this.publisher.on('connect', () => {
      this.logger.info('Redis publisher connected');
    });

    this.publisher.on('error', (error) => {
      this.logger.error(error, 'Redis publisher error');
    });

    // Subscriber events
    this.subscriber.on('connect', () => {
      this.logger.info('Redis subscriber connected');
    });

    this.subscriber.on('error', (error) => {
      this.logger.error(error, 'Redis subscriber error');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
  }

  /**
   * Get the Redis client instance
   * @returns {Object|null} Redis client or null if not connected
   */
  getClient() {
    if (!this.isConnected || !this.client) {
      this.logger.warn('Redis not connected. Call connect() first.');
      return null;
    }
    return this.client;
  }

  /**
   * Get the Redis publisher instance
   * @returns {Object|null} Redis publisher or null if not connected
   */
  getPublisher() {
    if (!this.isConnected || !this.publisher) {
      this.logger.warn('Redis publisher not connected. Call connect() first.');
      return null;
    }
    return this.publisher;
  }

  /**
   * Get the Redis subscriber instance
   * @returns {Object|null} Redis subscriber or null if not connected
   */
  getSubscriber() {
    if (!this.isConnected || !this.subscriber) {
      this.logger.warn('Redis subscriber not connected. Call connect() first.');
      return null;
    }
    return this.subscriber;
  }

  /**
   * Check if Redis is connected
   * @returns {boolean} Connection status
   */
  isReady() {
    return this.isConnected && this.client !== null && this.publisher !== null && this.subscriber !== null;
  }

  /**
   * Gracefully shutdown Redis connections
   * @returns {Promise<void>}
   */
  async gracefulShutdown() {
    if (this.isShuttingDown) {
      this.logger.warn('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    this.logger.info('Starting graceful shutdown of Redis');

    try {
      const shutdownPromises = [];

      if (this.client) {
        shutdownPromises.push(this.client.quit());
      }

      if (this.publisher) {
        shutdownPromises.push(this.publisher.quit());
      }

      if (this.subscriber) {
        shutdownPromises.push(this.subscriber.quit());
      }

      await Promise.all(shutdownPromises);

      this.isConnected = false;
      this.logger.info('Redis shutdown completed');
    } catch (error) {
      this.logger.error(error, 'Error during Redis shutdown');
    }
  }

  /**
   * Publish a message to a channel
   * @param {string} channel - Channel name
   * @param {string|Object} message - Message to publish
   * @returns {Promise<number>} Number of subscribers that received the message
   */
  async publish(channel, message) {
    if (!this.isReady()) {
      throw new Error('Redis not connected');
    }

    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      const result = await this.publisher.publish(channel, messageStr);
      
      this.logger.debug({ channel, messageLength: messageStr.length }, 'Message published');
      return result;
    } catch (error) {
      this.logger.error(error, { channel }, 'Failed to publish message');
      throw error;
    }
  }

  /**
   * Subscribe to a channel
   * @param {string} channel - Channel name
   * @param {Function} callback - Message handler function
   * @returns {Promise<void>}
   */
  async subscribe(channel, callback) {
    if (!this.isReady()) {
      throw new Error('Redis not connected');
    }

    try {
      await this.subscriber.subscribe(channel, callback);
      this.logger.info({ channel }, 'Subscribed to channel');
    } catch (error) {
      this.logger.error(error, { channel }, 'Failed to subscribe to channel');
      throw error;
    }
  }

  /**
   * Unsubscribe from a channel
   * @param {string} channel - Channel name
   * @returns {Promise<void>}
   */
  async unsubscribe(channel) {
    if (!this.isReady()) {
      throw new Error('Redis not connected');
    }

    try {
      await this.subscriber.unsubscribe(channel);
      this.logger.info({ channel }, 'Unsubscribed from channel');
    } catch (error) {
      this.logger.error(error, { channel }, 'Failed to unsubscribe from channel');
      throw error;
    }
  }

  /**
   * Get Redis statistics
   * @returns {Promise<Object>} Redis statistics
   */
  async getStats() {
    if (!this.isReady()) {
      throw new Error('Redis not connected');
    }

    try {
      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      
      return {
        memory: info,
        keyspace: keyspace,
        connected: this.isConnected
      };
    } catch (error) {
      this.logger.error(error, 'Failed to get Redis stats');
      throw error;
    }
  }
}

// Singleton instance
let redisCoreInstance = null;

/**
 * Get the singleton RedisCore instance
 * @param {Object} config - Configuration options
 * @returns {RedisCore} RedisCore instance
 */
function getRedisCore(config = {}) {
  if (!redisCoreInstance) {
    redisCoreInstance = new RedisCore(config);
  }
  return redisCoreInstance;
}

module.exports = {
  RedisCore,
  getRedisCore
};
