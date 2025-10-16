# Agenda-based Message Queue System

A scalable, production-ready message queue system built on top of [Agenda](https://github.com/agenda/agenda) for Node.js applications.

## Features

- **Simple Producer/Consumer Pattern**: Easy-to-use interfaces for job creation and processing
- **MongoDB-backed**: Reliable job persistence and recovery
- **Automatic Reconnection**: Handles MongoDB connection failures gracefully
- **Job Scheduling**: Support for immediate, scheduled, and recurring jobs
- **Concurrency Control**: Configurable job concurrency limits
- **Job Prioritization**: Priority-based job processing
- **Unique Jobs**: Prevent duplicate job execution
- **Comprehensive Logging**: Built-in logging with Pino
- **Graceful Shutdown**: Proper cleanup on application termination

## Architecture

The system consists of three main components:

1. **AgendaCore**: Handles MongoDB connection and Agenda instance management
2. **Producer**: Creates and schedules jobs
3. **Consumer**: Defines and processes jobs

## Quick Start

### 1. Installation

The system uses `@hokify/agenda` which is already included in your project dependencies.

### 2. Basic Usage

```javascript
const { Producer, Consumer } = require('./src/jobs');

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

// Define a job processor
consumer.defineJob('send-email', {
  concurrency: 3,
  priority: 'high'
}, async (data, job) => {
  console.log('Sending email to:', data.to);
  // Your email sending logic here
  return { success: true };
});

// Create a job
const job = await producer.now('send-email', {
  to: 'user@example.com',
  subject: 'Hello World',
  body: 'This is a test email'
});

console.log('Job created:', job.id);
```

### 3. Job Scheduling Options

```javascript
// Run immediately
await producer.now('job-name', data);

// Schedule for specific time
await producer.schedule('job-name', new Date('2024-01-01'), data);

// Recurring job (every 5 minutes)
await producer.repeat('job-name', '5 minutes', data);

// Unique job (prevents duplicates)
await producer.createJob('job-name', data, {
  unique: 'unique-key',
  schedule: 'now'
});
```

## API Reference

### Producer

Handles job creation and scheduling.

#### Methods

- `initialize()`: Initialize the producer
- `createJob(jobName, data, options)`: Create a job
- `now(jobName, data, options)`: Create immediate job
- `schedule(jobName, when, data, options)`: Schedule job
- `repeat(jobName, interval, data, options)`: Create recurring job
- `unique(jobName, uniqueKey, data, options)`: Create unique job
- `cancelJob(jobId)`: Cancel job
- `getJobStatus(jobId)`: Get job status
- `isReady()`: Check if ready

### Consumer

Handles job processing.

#### Methods

- `initialize()`: Initialize the consumer
- `defineJob(jobName, options, processor)`: Define a job processor
- `define(jobName, processor, options)`: Short form for defineJob
- `getRegisteredJobs()`: Get list of registered jobs
- `getJobDefinition(jobName)`: Get job definition
- `hasJob(jobName)`: Check if job is registered
- `getStats()`: Get consumer statistics
- `isReady()`: Check if ready
- `shutdown()`: Gracefully shutdown

## Configuration

### AgendaCore Configuration

```javascript
{
  db: {
    address: 'mongodb://localhost:27017/adsaga',
    collection: 'agendaJobs',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 1000
    }
  },
  processEvery: '10 seconds',
  maxConcurrency: 20,
  defaultConcurrency: 5,
  defaultLockLifetime: 10 * 60 * 1000,
  gracefulShutdownTimeout: 10000
}
```

### Job Options

```javascript
{
  concurrency: 5,           // Number of concurrent jobs
  priority: 'normal',       // 'low', 'normal', 'high'
  lockLifetime: 600000,     // Job lock lifetime in ms
  unique: 'unique-key',     // Unique identifier
  schedule: 'now',          // When to run
  repeatEvery: '5 minutes', // For recurring jobs
  repeatOptions: {          // Additional repeat options
    timezone: 'UTC'
  }
}
```

## Error Handling

The system includes comprehensive error handling:

- Automatic reconnection to MongoDB
- Job failure logging and retry logic
- Graceful shutdown on SIGTERM/SIGINT
- Connection health monitoring

## Monitoring

Get system statistics:

```javascript
const [producerStats, consumerStats] = await Promise.all([
  producer.getStats ? producer.getStats() : {},
  consumer.getStats()
]);
console.log('System stats:', { producerStats, consumerStats });
```

Statistics include:
- Total jobs
- Running jobs
- Scheduled jobs
- Failed jobs
- Completed jobs
- Registered job types

## Examples

See `examples/usage-example.js` for comprehensive usage examples.

## Best Practices

1. **Always initialize** the producer and consumer before use
2. **Define job processors** before creating jobs
3. **Use appropriate concurrency** limits based on your system capacity
4. **Handle errors** in your job processors
5. **Monitor job statistics** for system health
6. **Use unique keys** for jobs that shouldn't be duplicated
7. **Gracefully shutdown** on application termination

## License

MIT
