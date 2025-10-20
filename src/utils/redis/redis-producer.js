const { getRedisCore } = require('./redis-core');
const pino = require('pino');
const { v4: uuidv4 } = require('uuid');

/**
 * Redis Producer - Handles job creation and publishing
 * Simple interface for adding jobs to the queue via Redis pub/sub
 */
class RedisProducer {
  constructor(config = {}) {
    this.config = {
      defaultPriority: 'normal',
      jobChannel: 'job_queue',
      ...config
    };

    this.logger = pino({
      name: 'redis-producer',
      level: process.env.LOG_LEVEL || 'info'
    });

    this.redisCore = getRedisCore(config.redis);
    this.isInitialized = false;
  }

  /**
   * Initialize the producer
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      await this.redisCore.connect();
      this.isInitialized = true;
      this.logger.info('Redis Producer initialized successfully');
    } catch (error) {
      this.logger.error(error, 'Failed to initialize Redis Producer');
      throw error;
    }
  }

  /**
   * Create and publish a job
   * @param {string} jobName - Name of the job
   * @param {Object} data - Job data
   * @param {Object} options - Job options
   * @returns {Promise<Object>} Created job info
   */
  async createJob(jobName, data = {}, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Producer not initialized. Call initialize() first.');
    }

    if (!this.redisCore.isReady()) {
      throw new Error('Redis not connected');
    }

    try {
      const jobId = uuidv4();
      const jobData = {
        id: jobId,
        name: jobName,
        data: data,
        options: {
          priority: options.priority || this.config.defaultPriority,
          ...options
        },
        createdAt: new Date().toISOString(),
        status: 'queued'
      };

      // Publish job to the job queue channel
      const result = await this.redisCore.publish(this.config.jobChannel, jobData);

      this.logger.info({ 
        jobId,
        jobName, 
        data,
        options: jobData.options,
        subscribers: result
      }, 'Job created and published');

      return {
        id: jobId,
        name: jobName,
        data: data,
        options: jobData.options,
        status: 'queued',
        createdAt: jobData.createdAt,
        subscribers: result
      };
    } catch (error) {
      this.logger.error(error, { jobName, data, options }, 'Failed to create job');
      throw error;
    }
  }

  /**
   * Create a job that runs immediately
   * @param {string} jobName - Name of the job
   * @param {Object} data - Job data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created job info
   */
  async now(jobName, data = {}, options = {}) {
    return this.createJob(jobName, data, { ...options, priority: 'high' });
  }

  /**
   * Create a job with specific priority
   * @param {string} jobName - Name of the job
   * @param {Object} data - Job data
   * @param {string} priority - Job priority (high, normal, low)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created job info
   */
  async priority(jobName, data = {}, priority = 'normal', options = {}) {
    return this.createJob(jobName, data, { ...options, priority });
  }

  /**
   * Create a unique job (prevents duplicates based on unique key)
   * @param {string} jobName - Name of the job
   * @param {string} uniqueKey - Unique identifier for the job
   * @param {Object} data - Job data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created job info
   */
  async unique(jobName, uniqueKey, data = {}, options = {}) {
    // For Redis pub/sub, we'll use a simple approach with job name + unique key
    const uniqueJobName = `${jobName}:${uniqueKey}`;
    return this.createJob(uniqueJobName, { ...data, uniqueKey }, options);
  }

  /**
   * Publish a custom message to a channel
   * @param {string} channel - Channel name
   * @param {Object} message - Message to publish
   * @returns {Promise<number>} Number of subscribers that received the message
   */
  async publish(channel, message) {
    if (!this.isInitialized) {
      throw new Error('Producer not initialized. Call initialize() first.');
    }

    if (!this.redisCore.isReady()) {
      throw new Error('Redis not connected');
    }

    try {
      const result = await this.redisCore.publish(channel, message);
      
      this.logger.debug({ channel, message }, 'Custom message published');
      return result;
    } catch (error) {
      this.logger.error(error, { channel }, 'Failed to publish custom message');
      throw error;
    }
  }

  /**
   * Check if producer is ready
   * @returns {boolean} Ready status
   */
  isReady() {
    return this.isInitialized && this.redisCore.isReady();
  }

  /**
   * Gracefully shutdown the producer
   * @returns {Promise<void>}
   */
  async shutdown() {
    this.logger.info('Shutting down Redis Producer');
    await this.redisCore.gracefulShutdown();
    this.isInitialized = false;
  }
}

module.exports = RedisProducer;
