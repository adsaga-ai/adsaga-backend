const { getAgendaCore } = require('./agenda-core');
const pino = require('pino');

/**
 * Producer - Handles job creation and scheduling
 * Simple interface for adding jobs to the queue
 */
class Producer {
  constructor(config = {}) {
    this.config = {
      defaultPriority: 'normal',
      defaultConcurrency: 5,
      ...config
    };

    this.logger = pino({
      name: 'agenda-producer',
      level: process.env.LOG_LEVEL || 'info'
    });

    this.agendaCore = getAgendaCore(config.agenda);
    this.isInitialized = false;
  }

  /**
   * Initialize the producer
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      await this.agendaCore.connect();
      this.isInitialized = true;
      this.logger.info('Producer initialized successfully');
    } catch (error) {
      this.logger.error(error, 'Failed to initialize Producer');
      throw error;
    }
  }

  /**
   * Create and schedule a job
   * @param {string} jobName - Name of the job
   * @param {Object} data - Job data
   * @param {Object} options - Scheduling options
   * @returns {Promise<Object>} Created job info
   */
  async createJob(jobName, data = {}, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Producer not initialized. Call initialize() first.');
    }

    if (!this.agendaCore.isReady()) {
      throw new Error('Agenda not connected');
    }

    const agenda = this.agendaCore.getInstance();
    
    try {
      const job = agenda.create(jobName, data);
      
      // Apply scheduling options
      if (options.schedule) {
        job.schedule(options.schedule);
      } else if (options.repeatEvery) {
        job.repeatEvery(options.repeatEvery, options.repeatOptions);
      } else if (options.repeatAt) {
        job.repeatAt(options.repeatAt);
      } else {
        // Run immediately
        job.schedule('now');
      }

      // Apply other options
      if (options.priority) {
        job.priority(options.priority);
      }

      if (options.unique) {
        job.unique(options.unique);
      }

      // Note: Concurrency is set at job definition level, not on individual job instances
      // The concurrency option is ignored here as it should be set when defining the job

      if (options.lockLifetime) {
        job.lockLifetime(options.lockLifetime);
      }

      // Save the job
      await job.save();

      this.logger.info({ 
        jobName, 
        jobId: job.attrs._id,
        data,
        options 
      }, 'Job created and scheduled');

      return {
        id: job.attrs._id,
        name: job.attrs.name,
        data: job.attrs.data,
        nextRunAt: job.attrs.nextRunAt,
        priority: job.attrs.priority,
        status: 'scheduled'
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
    return this.createJob(jobName, data, { ...options, schedule: 'now' });
  }

  /**
   * Create a job that runs at a specific time
   * @param {string} jobName - Name of the job
   * @param {Date|string} when - When to run the job
   * @param {Object} data - Job data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created job info
   */
  async schedule(jobName, when, data = {}, options = {}) {
    return this.createJob(jobName, data, { ...options, schedule: when });
  }

  /**
   * Create a recurring job
   * @param {string} jobName - Name of the job
   * @param {string} interval - Cron expression or interval
   * @param {Object} data - Job data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created job info
   */
  async repeat(jobName, interval, data = {}, options = {}) {
    return this.createJob(jobName, data, { 
      ...options, 
      repeatEvery: interval,
      repeatOptions: options.repeatOptions
    });
  }

  /**
   * Create a unique job (prevents duplicates)
   * @param {string} jobName - Name of the job
   * @param {string} uniqueKey - Unique identifier for the job
   * @param {Object} data - Job data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Created job info
   */
  async unique(jobName, uniqueKey, data = {}, options = {}) {
    return this.createJob(jobName, data, { 
      ...options, 
      unique: uniqueKey
    });
  }

  /**
   * Cancel a job
   * @param {string} jobId - Job ID to cancel
   * @returns {Promise<boolean>} Success status
   */
  async cancelJob(jobId) {
    if (!this.isInitialized) {
      throw new Error('Producer not initialized. Call initialize() first.');
    }

    if (!this.agendaCore.isReady()) {
      throw new Error('Agenda not connected');
    }

    try {
      const agenda = this.agendaCore.getInstance();
      const jobs = await agenda.jobs({ _id: jobId });
      
      if (jobs.length === 0) {
        this.logger.warn({ jobId }, 'Job not found for cancellation');
        return false;
      }

      const job = jobs[0];
      await job.remove();

      this.logger.info({ jobId, jobName: job.attrs.name }, 'Job cancelled');
      return true;
    } catch (error) {
      this.logger.error(error, { jobId }, 'Failed to cancel job');
      throw error;
    }
  }

  /**
   * Get job status
   * @param {string} jobId - Job ID
   * @returns {Promise<Object|null>} Job status or null if not found
   */
  async getJobStatus(jobId) {
    if (!this.isInitialized) {
      throw new Error('Producer not initialized. Call initialize() first.');
    }

    if (!this.agendaCore.isReady()) {
      throw new Error('Agenda not connected');
    }

    try {
      const agenda = this.agendaCore.getInstance();
      const jobs = await agenda.jobs({ _id: jobId });
      
      if (jobs.length === 0) {
        return null;
      }

      const job = jobs[0];
      return {
        id: job.attrs._id,
        name: job.attrs.name,
        data: job.attrs.data,
        nextRunAt: job.attrs.nextRunAt,
        lastRunAt: job.attrs.lastRunAt,
        lastFinishedAt: job.attrs.lastFinishedAt,
        lockedAt: job.attrs.lockedAt,
        priority: job.attrs.priority,
        failCount: job.attrs.failCount,
        failReason: job.attrs.failReason,
        status: this._getJobStatus(job)
      };
    } catch (error) {
      this.logger.error(error, { jobId }, 'Failed to get job status');
      throw error;
    }
  }

  /**
   * Get job status from job attributes
   * @private
   */
  _getJobStatus(job) {
    if (job.attrs.lockedAt) {
      return 'running';
    } else if (job.attrs.failCount > 0) {
      return 'failed';
    } else if (job.attrs.lastFinishedAt) {
      return 'completed';
    } else if (job.attrs.nextRunAt) {
      return 'scheduled';
    } else {
      return 'unknown';
    }
  }

  /**
   * Check if producer is ready
   * @returns {boolean} Ready status
   */
  isReady() {
    return this.isInitialized && this.agendaCore.isReady();
  }
}

module.exports = Producer;
