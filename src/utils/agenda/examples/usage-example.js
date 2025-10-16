const { Consumer, Producer } = require('../../jobs');
const pino = require('pino');

const logger = pino({
  name: 'usage-example',
  level: 'info'
});

/**
 * Example usage of the Agenda-based message queue system
 * This demonstrates how to define jobs, create them, and process them
 */

// Example 1: Setup job definitions with Consumer
function setupJobDefinitions(consumer) {
  // Email job definition
  consumer.defineJob('send-email', {
    concurrency: 3,
    priority: 'high',
    lockLifetime: 5 * 60 * 1000 // 5 minutes
  }, async (data, job) => {
    logger.info({ data }, 'Processing email job');
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.info({ 
      to: data.to, 
      subject: data.subject 
    }, 'Email sent successfully');
    
    return { success: true, messageId: `msg_${Date.now()}` };
  });

  // Data processing job definition
  consumer.defineJob('process-lead', {
    concurrency: 5,
    priority: 'normal',
    lockLifetime: 10 * 60 * 1000 // 10 minutes
  }, async (data, job) => {
    logger.info({ leadId: data.leadId }, 'Processing lead data');
    
    // Simulate data processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    logger.info({ leadId: data.leadId }, 'Lead processed successfully');
    
    return { 
      leadId: data.leadId, 
      processedAt: new Date(),
      status: 'completed'
    };
  });

  // Cleanup job definition
  consumer.defineJob('cleanup-old-jobs', {
    concurrency: 1,
    priority: 'low'
  }, async (data, job) => {
    logger.info('Running cleanup job');
    
    // Simulate cleanup process
    await new Promise(resolve => setTimeout(resolve, 500));
    
    logger.info('Cleanup completed');
    
    return { cleaned: 42, timestamp: new Date() };
  });

  logger.info('Job definitions registered');
}

// Example 2: Initialize and use the producer and consumer
async function demonstrateUsage() {
  try {
    // Initialize producer and consumer
    const producer = new Producer({
      agenda: {
        db: {
          address: process.env.MONGODB_URI || 'mongodb://localhost:27017/adsaga',
          collection: 'agendaJobs'
        }
      }
    });

    const consumer = new Consumer({
      agenda: {
        db: {
          address: process.env.MONGODB_URI || 'mongodb://localhost:27017/adsaga',
          collection: 'agendaJobs'
        }
      }
    });

    await Promise.all([
      producer.initialize(),
      consumer.initialize()
    ]);
    logger.info('Producer and consumer initialized');

    // Setup job definitions
    setupJobDefinitions(consumer);

    // Example 3: Create immediate jobs
    const emailJob = await producer.now('send-email', {
      to: 'user@example.com',
      subject: 'Welcome to AdSaga!',
      body: 'Thank you for joining our platform.'
    });
    logger.info({ jobId: emailJob.id }, 'Email job created');

    // Example 4: Create scheduled jobs
    const scheduledTime = new Date(Date.now() + 60000); // 1 minute from now
    const leadJob = await producer.schedule('process-lead', scheduledTime, {
      leadId: 'lead_12345',
      companyName: 'Acme Corp',
      email: 'contact@acme.com'
    });
    logger.info({ jobId: leadJob.id, scheduledFor: scheduledTime }, 'Lead job scheduled');

    // Example 5: Create recurring jobs
    const cleanupJob = await producer.repeat('cleanup-old-jobs', '0 2 * * *', {}, {
      // Run daily at 2 AM
      repeatOptions: {
        timezone: 'UTC'
      }
    });
    logger.info({ jobId: cleanupJob.id }, 'Cleanup job scheduled for daily execution');

    // Example 6: Create unique jobs (prevents duplicates)
    const uniqueEmailJob = await producer.createJob('send-email', {
      to: 'admin@example.com',
      subject: 'Daily Report',
      body: 'Here is your daily report.'
    }, {
      unique: 'daily-report-email',
      schedule: 'now'
    });
    logger.info({ jobId: uniqueEmailJob.id }, 'Unique email job created');

    // Example 7: Monitor job status
    const jobStatus = await producer.getJobStatus(emailJob.id);
    logger.info({ jobStatus }, 'Email job status');

    // Example 8: Get system statistics
    const [producerStats, consumerStats] = await Promise.all([
      producer.getStats ? producer.getStats() : {},
      consumer.getStats()
    ]);
    logger.info({ producerStats, consumerStats }, 'System statistics');

    // Example 9: Cancel a job
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    const cancelled = await producer.cancelJob(leadJob.id);
    logger.info({ cancelled }, 'Job cancellation result');

    // Example 10: Graceful shutdown
    setTimeout(async () => {
      logger.info('Shutting down producer and consumer');
      await Promise.all([
        consumer.shutdown(),
        producer.shutdown ? producer.shutdown() : Promise.resolve()
      ]);
      process.exit(0);
    }, 10000); // Shutdown after 10 seconds

  } catch (error) {
    logger.error(error, 'Error in demonstration');
    process.exit(1);
  }
}


// Run the demonstration
if (require.main === module) {
  demonstrateUsage();
}

module.exports = {
  setupJobDefinitions,
  demonstrateUsage
};
