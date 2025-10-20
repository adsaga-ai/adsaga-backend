const { getRedisCore } = require('./redis-core');
const pino = require('pino');

/**
 * Redis Consumer - Handles job processing and execution
 * Registers job definitions and processes them via Redis pub/sub
 */
class RedisConsumer {
  constructor(config = {}) {
    this.config = {
      defaultConcurrency: 5,
      jobChannel: 'job_queue',
      ...config
    };

    this.logger = pino({
      name: 'redis-consumer',
      level: process.env.LOG_LEVEL || 'info'
    });

    this.redisCore = getRedisCore(config.redis);
    this.jobDefinitions = new Map();
    this.isInitialized = false;
    this.isProcessing = false;
    this.concurrency = this.config.defaultConcurrency;
    this.activeJobs = new Set();
  }

  /**
   * Initialize the consumer
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      await this.redisCore.connect();
      this.isInitialized = true;
      this.logger.info('Redis Consumer initialized successfully');
    } catch (error) {
      this.logger.error(error, 'Failed to initialize Redis Consumer');
      throw error;
    }
  }

  /**
   * Define a job processor
   * @param {string} jobName - Name of the job
   * @param {Object} options - Job options
   * @param {Function} processor - Job processor function
   */
  defineJob(jobName, options = {}, processor) {
    if (!this.isInitialized) {
      throw new Error('Consumer not initialized. Call initialize() first.');
    }

    if (!this.redisCore.isReady()) {
      throw new Error('Redis not connected');
    }

    if (typeof processor !== 'function') {
      throw new Error('Processor must be a function');
    }

    // Store job definition for reference
    this.jobDefinitions.set(jobName, {
      options: options,
      processor: processor
    });

    this.logger.info({ jobName, processorType: typeof processor }, 'Job definition registered');

    // Start processing if not already started
    if (!this.isProcessing) {
      this.startProcessing();
    }
  }

  /**
   * Define a job with simple options
   * @param {string} jobName - Name of the job
   * @param {Function} processor - Job processor function
   * @param {Object} options - Job options
   */
  define(jobName, processor, options = {}) {
    this.defineJob(jobName, options, processor);
  }

  /**
   * Start processing jobs from the queue
   * @returns {Promise<void>}
   */
  async startProcessing() {
    if (this.isProcessing) {
      this.logger.warn('Job processing already started');
      return;
    }

    if (!this.isInitialized || !this.redisCore.isReady()) {
      throw new Error('Consumer not initialized or Redis not connected');
    }

    try {
      // Subscribe to the job queue channel
      await this.redisCore.subscribe(this.config.jobChannel, this._handleJobMessage.bind(this));
      
      this.isProcessing = true;
      this.logger.info({ 
        jobChannel: this.config.jobChannel,
        concurrency: this.concurrency 
      }, 'Started processing jobs');
    } catch (error) {
      this.logger.error(error, 'Failed to start job processing');
      throw error;
    }
  }

  /**
   * Stop processing jobs
   * @returns {Promise<void>}
   */
  async stopProcessing() {
    if (!this.isProcessing) {
      this.logger.warn('Job processing not started');
      return;
    }

    try {
      // Wait for active jobs to complete
      await this._waitForActiveJobs();
      
      // Unsubscribe from the job queue channel
      await this.redisCore.unsubscribe(this.config.jobChannel);
      
      this.isProcessing = false;
      this.logger.info('Stopped processing jobs');
    } catch (error) {
      this.logger.error(error, 'Failed to stop job processing');
      throw error;
    }
  }

  /**
   * Handle incoming job messages
   * @private
   */
  async _handleJobMessage(message, channel) {
    try {
      const jobData = JSON.parse(message);
      
      this.logger.debug({ 
        jobId: jobData.id, 
        jobName: jobData.name,
        channel 
      }, 'Received job message');

      // Check if we have a processor for this job type
      const jobDefinition = this.jobDefinitions.get(jobData.name);
      if (!jobDefinition) {
        this.logger.warn({ 
          jobName: jobData.name, 
          jobId: jobData.id 
        }, 'No processor found for job type');
        return;
      }

      // Check concurrency limit
      if (this.activeJobs.size >= this.concurrency) {
        this.logger.warn({ 
          jobId: jobData.id,
          activeJobs: this.activeJobs.size,
          concurrency: this.concurrency
        }, 'Concurrency limit reached, skipping job');
        return;
      }

      // Process the job
      this._processJob(jobData, jobDefinition);
    } catch (error) {
      this.logger.error(error, { message, channel }, 'Failed to handle job message');
    }
  }

  /**
   * Process a single job
   * @private
   */
  async _processJob(jobData, jobDefinition) {
    const { id: jobId, name: jobName, data, options } = jobData;
    
    // Add to active jobs
    this.activeJobs.add(jobId);
    
    const startTime = Date.now();
    
    try {
      this.logger.info({ 
        jobId, 
        jobName, 
        data,
        activeJobs: this.activeJobs.size
      }, 'Processing job');

      // Create a mock job object similar to Agenda's job object
      const mockJob = {
        attrs: {
          _id: jobId,
          name: jobName,
          data: data,
          priority: options.priority || 'normal',
          failCount: 0,
          failReason: null
        }
      };

      // Execute the job processor
      const result = await jobDefinition.processor(data, mockJob);

      const duration = Date.now() - startTime;
      this.logger.info({ 
        jobId, 
        jobName, 
        duration,
        result: result ? 'success' : 'completed'
      }, 'Job completed successfully');

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(error, { 
        jobId, 
        jobName, 
        duration,
        attempts: 1
      }, 'Job failed');

      throw error;
    } finally {
      // Remove from active jobs
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Wait for all active jobs to complete
   * @private
   */
  async _waitForActiveJobs(timeout = 30000) {
    if (this.activeJobs.size === 0) {
      return;
    }

    const startTime = Date.now();
    
    while (this.activeJobs.size > 0 && (Date.now() - startTime) < timeout) {
      this.logger.info({ 
        activeJobs: this.activeJobs.size 
      }, 'Waiting for active jobs to complete');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (this.activeJobs.size > 0) {
      this.logger.warn({ 
        activeJobs: this.activeJobs.size 
      }, 'Timeout waiting for active jobs to complete');
    }
  }

  /**
   * Get list of registered job definitions
   * @returns {Array} List of job names
   */
  getRegisteredJobs() {
    return Array.from(this.jobDefinitions.keys());
  }

  /**
   * Get job definition details
   * @param {string} jobName - Name of the job
   * @returns {Object|null} Job definition or null if not found
   */
  getJobDefinition(jobName) {
    return this.jobDefinitions.get(jobName) || null;
  }

  /**
   * Check if a job is registered
   * @param {string} jobName - Name of the job
   * @returns {boolean} Whether job is registered
   */
  hasJob(jobName) {
    return this.jobDefinitions.has(jobName);
  }

  /**
   * Set concurrency limit
   * @param {number} concurrency - Maximum number of concurrent jobs
   */
  setConcurrency(concurrency) {
    if (concurrency < 1) {
      throw new Error('Concurrency must be at least 1');
    }
    this.concurrency = concurrency;
    this.logger.info({ concurrency }, 'Concurrency limit updated');
  }

  /**
   * Get consumer statistics
   * @returns {Promise<Object>} Consumer statistics
   */
  async getStats() {
    if (!this.isInitialized) {
      throw new Error('Consumer not initialized. Call initialize() first.');
    }

    try {
      const redisStats = await this.redisCore.getStats();
      
      return {
        ...redisStats,
        registeredJobs: this.jobDefinitions.size,
        jobTypes: Array.from(this.jobDefinitions.keys()),
        activeJobs: this.activeJobs.size,
        concurrency: this.concurrency,
        isProcessing: this.isProcessing
      };
    } catch (error) {
      this.logger.error(error, 'Failed to get consumer stats');
      throw error;
    }
  }

  /**
   * Check if consumer is ready
   * @returns {boolean} Ready status
   */
  isReady() {
    return this.isInitialized && this.redisCore.isReady();
  }

  /**
   * Gracefully shutdown the consumer
   * @returns {Promise<void>}
   */
  async shutdown() {
    this.logger.info('Shutting down Redis Consumer');
    
    if (this.isProcessing) {
      await this.stopProcessing();
    }
    
    await this.redisCore.gracefulShutdown();
    this.isInitialized = false;
  }
}

module.exports = RedisConsumer;
