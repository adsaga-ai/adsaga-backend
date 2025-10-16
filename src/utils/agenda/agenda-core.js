const { Agenda } = require('@hokify/agenda');
const pino = require('pino');

/**
 * Core Agenda configuration and connection management
 * Provides centralized Agenda instance with proper error handling and reconnection
 */
class AgendaCore {
  constructor(config = {}) {
    this.config = {
      // Default configuration
      db: {
        address: process.env.MONGODB_URI || 'mongodb://localhost:27017/adsaga',
        collection: 'agendaJobs',
        options: {
          connectTimeoutMS: 30000,
          socketTimeoutMS: 30000,
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          heartbeatFrequencyMS: 10000
        }
      },
      // Job processing configuration
      processEvery: '10 seconds',
      maxConcurrency: 20,
      defaultConcurrency: 5,
      defaultLockLifetime: 10 * 60 * 1000, // 10 minutes
      // Retry configuration
      defaultLockLimit: 0,
      // Graceful shutdown
      gracefulShutdownTimeout: 10000, // 10 seconds
      ...config
    };

    this.logger = pino({
      name: 'agenda-core',
      level: process.env.LOG_LEVEL || 'info'
    });

    this.agenda = null;
    this.isConnected = false;
    this.isShuttingDown = false;
    this.connectionRetries = 0;
    this.maxRetries = 10;
  }

  /**
   * Initialize and connect to MongoDB
   * @returns {Promise<Agenda>} Connected Agenda instance
   */
  async connect() {
    try {
      if (this.agenda && this.isConnected) {
        this.logger.info('Agenda already connected');
        return this.agenda;
      }

      this.logger.info({ config: this.config.db }, 'Connecting to MongoDB for Agenda');

      // Create Agenda instance with database configuration
      this.agenda = new Agenda({
        db: {
          address: this.config.db.address,
          collection: this.config.db.collection,
          options: this.config.db.options
        },
        processEvery: this.config.processEvery,
        maxConcurrency: this.config.maxConcurrency,
        defaultConcurrency: this.config.defaultConcurrency,
        defaultLockLifetime: this.config.defaultLockLifetime,
        defaultLockLimit: this.config.defaultLockLimit
      });
      
      // Set up event listeners
      this._setupEventListeners();
      
      // Start processing jobs
      await this.agenda.start();
      
      this.isConnected = true;
      this.connectionRetries = 0;
      
      this.logger.info('Agenda connected and started successfully');
      
      return this.agenda;
    } catch (error) {
      this.logger.error(error, 'Failed to connect to Agenda');
      this.connectionRetries++;
      
      if (this.connectionRetries < this.maxRetries) {
        this.logger.info({ 
          retry: this.connectionRetries, 
          maxRetries: this.maxRetries 
        }, 'Retrying Agenda connection');
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, this.connectionRetries), 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.connect();
      }
      
      throw error;
    }
  }

  /**
   * Set up event listeners for Agenda
   * @private
   */
  _setupEventListeners() {
    if (!this.agenda) return;

    // Connection events
    this.agenda.on('ready', () => {
      this.logger.info('Agenda ready');
      this.isConnected = true;
    });

    this.agenda.on('error', (error) => {
      this.logger.error(error, 'Agenda error');
      this.isConnected = false;
    });

    // Job events
    this.agenda.on('start', (job) => {
      this.logger.debug({ jobId: job.attrs._id, jobName: job.attrs.name }, 'Job started');
    });

    this.agenda.on('success', (job) => {
      this.logger.debug({ jobId: job.attrs._id, jobName: job.attrs.name }, 'Job completed successfully');
    });

    this.agenda.on('fail', (error, job) => {
      this.logger.error(error, { 
        jobId: job.attrs._id, 
        jobName: job.attrs.name,
        attempts: job.attrs.failCount,
        maxAttempts: job.attrs.failCount + job.attrs.failReason ? 1 : 0
      }, 'Job failed');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
  }

  /**
   * Get the Agenda instance
   * @returns {Agenda|null} Agenda instance or null if not connected
   */
  getInstance() {
    if (!this.isConnected || !this.agenda) {
      this.logger.warn('Agenda not connected. Call connect() first.');
      return null;
    }
    return this.agenda;
  }

  /**
   * Check if Agenda is connected
   * @returns {boolean} Connection status
   */
  isReady() {
    return this.isConnected && this.agenda !== null;
  }

  /**
   * Gracefully shutdown Agenda
   * @returns {Promise<void>}
   */
  async gracefulShutdown() {
    if (this.isShuttingDown) {
      this.logger.warn('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    this.logger.info('Starting graceful shutdown of Agenda');

    try {
      if (this.agenda) {
        // Stop accepting new jobs
        await this.agenda.stop();
        
        // Wait for running jobs to complete
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            this.logger.warn('Graceful shutdown timeout reached');
            resolve();
          }, this.config.gracefulShutdownTimeout);

          // Check if all jobs are done
          const checkJobs = () => {
            this.agenda.jobs({ running: true }, (err, jobs) => {
              if (err) {
                this.logger.error(err, 'Error checking running jobs during shutdown');
                clearTimeout(timeout);
                resolve();
                return;
              }

              if (jobs.length === 0) {
                this.logger.info('All jobs completed, shutting down');
                clearTimeout(timeout);
                resolve();
              } else {
                this.logger.info({ runningJobs: jobs.length }, 'Waiting for jobs to complete');
                setTimeout(checkJobs, 1000);
              }
            });
          };

          checkJobs();
        });

        // Close the connection
        await this.agenda.close();
      }

      this.isConnected = false;
      this.logger.info('Agenda shutdown completed');
    } catch (error) {
      this.logger.error(error, 'Error during Agenda shutdown');
    }
  }

  /**
   * Get job statistics
   * @returns {Promise<Object>} Job statistics
   */
  async getStats() {
    if (!this.isReady()) {
      throw new Error('Agenda not connected');
    }

    try {
      const stats = await this.agenda.jobs({}, (err, jobs) => {
        if (err) throw err;
        
        const stats = {
          total: jobs.length,
          running: jobs.filter(job => job.attrs.lockedAt).length,
          scheduled: jobs.filter(job => !job.attrs.lockedAt && job.attrs.nextRunAt).length,
          failed: jobs.filter(job => job.attrs.failCount > 0).length,
          completed: jobs.filter(job => job.attrs.lastFinishedAt).length
        };

        return stats;
      });

      return stats;
    } catch (error) {
      this.logger.error(error, 'Failed to get Agenda stats');
      throw error;
    }
  }

  /**
   * Clean up old completed jobs
   * @param {number} olderThan - Remove jobs older than this many milliseconds
   * @returns {Promise<number>} Number of jobs removed
   */
  async cleanup(olderThan = 24 * 60 * 60 * 1000) { // Default: 24 hours
    if (!this.isReady()) {
      throw new Error('Agenda not connected');
    }

    try {
      const cutoff = new Date(Date.now() - olderThan);
      const result = await this.agenda.jobs({ 
        lastFinishedAt: { $lt: cutoff } 
      }, (err, jobs) => {
        if (err) throw err;
        return jobs.length;
      });

      // Remove the jobs
      await this.agenda.jobs({ 
        lastFinishedAt: { $lt: cutoff } 
      }, (err, jobs) => {
        if (err) throw err;
        jobs.forEach(job => job.remove());
      });

      this.logger.info({ removed: result, olderThan }, 'Cleaned up old jobs');
      return result;
    } catch (error) {
      this.logger.error(error, 'Failed to cleanup old jobs');
      throw error;
    }
  }
}

// Singleton instance
let agendaCoreInstance = null;

/**
 * Get the singleton AgendaCore instance
 * @param {Object} config - Configuration options
 * @returns {AgendaCore} AgendaCore instance
 */
function getAgendaCore(config = {}) {
  if (!agendaCoreInstance) {
    agendaCoreInstance = new AgendaCore(config);
  }
  return agendaCoreInstance;
}

module.exports = {
  AgendaCore,
  getAgendaCore
};
