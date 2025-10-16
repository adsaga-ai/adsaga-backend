const { getAgendaCore } = require('./agenda-core');
const pino = require('pino');

/**
 * Consumer - Handles job processing and execution
 * Registers job definitions and processes them
 */
class Consumer {
  constructor(config = {}) {
    this.config = {
      defaultConcurrency: 5,
      defaultLockLifetime: 10 * 60 * 1000, // 10 minutes
      ...config
    };

    this.logger = pino({
      name: 'agenda-consumer',
      level: process.env.LOG_LEVEL || 'info'
    });

    this.agendaCore = getAgendaCore(config.agenda);
    this.jobDefinitions = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the consumer
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      await this.agendaCore.connect();
      this.isInitialized = true;
      this.logger.info('Consumer initialized successfully');
    } catch (error) {
      this.logger.error(error, 'Failed to initialize Consumer');
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

    if (!this.agendaCore.isReady()) {
      throw new Error('Agenda not connected');
    }

    const agenda = this.agendaCore.getInstance();
    
    // Filter options to only include valid Agenda options
    const jobOptions = {};
    if (options.concurrency) {
      jobOptions.concurrency = options.concurrency;
    }
    if (options.priority) {
      jobOptions.priority = options.priority;
    }
    if (options.lockLifetime) {
      jobOptions.lockLifetime = options.lockLifetime;
    }

    // Store job definition for reference
    this.jobDefinitions.set(jobName, {
      options: jobOptions,
      processor: processor
    });

    // Define the job in Agenda (without options for now to fix the immediate issue)
    this.logger.info({ jobName, processorType: typeof processor }, 'Defining job in Agenda');
    
    agenda.define(jobName, async (job) => {
      const startTime = Date.now();
      const jobData = job.attrs.data;
      
      try {
        this.logger.info({ 
          jobName, 
          jobId: job.attrs._id,
          data: jobData 
        }, 'Processing job');

        // Execute the job processor
        const result = await processor(jobData, job);

        const duration = Date.now() - startTime;
        this.logger.info({ 
          jobName, 
          jobId: job.attrs._id,
          duration 
        }, 'Job completed successfully');

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.logger.error(error, { 
          jobName, 
          jobId: job.attrs._id,
          duration,
          attempts: job.attrs.failCount + 1
        }, 'Job failed');

        throw error;
      }
    });

    this.logger.info({ jobName, options: jobOptions }, 'Job definition registered');
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
   * Get consumer statistics
   * @returns {Promise<Object>} Consumer statistics
   */
  async getStats() {
    if (!this.isInitialized) {
      throw new Error('Consumer not initialized. Call initialize() first.');
    }

    try {
      const agendaStats = await this.agendaCore.getStats();
      
      return {
        ...agendaStats,
        registeredJobs: this.jobDefinitions.size,
        jobTypes: Array.from(this.jobDefinitions.keys())
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
    return this.isInitialized && this.agendaCore.isReady();
  }

  /**
   * Gracefully shutdown the consumer
   * @returns {Promise<void>}
   */
  async shutdown() {
    this.logger.info('Shutting down Consumer');
    await this.agendaCore.gracefulShutdown();
  }
}

module.exports = Consumer;
