const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const pino = require('pino');
const cookieParser = require('cookie-parser');
const config = require('./config');
const modules = require('./modules');
const cors = require('cors');
const { initiateConsumers } = require('./jobs/initiate-consumers');

const logger = pino({
  level: config.logLevel || 'info'
});

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(config.cors));

// Custom logger middleware that provides req.log functionality
app.use((req, res, next) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  req.log = logger.child({ 
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent')
  });
  
  // Log request start
  req.log.info({ 
    method: req.method, 
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  }, 'Request started');
  
  // Log response when finished
  res.on('finish', () => {
    req.log.info({ 
      statusCode: res.statusCode,
      responseTime: Date.now() - req.startTime
    }, 'Request completed');
  });
  
  req.startTime = Date.now();
  next();
});

app.use('/api', modules);


const PORT = config.port;

(async () => {
  await initiateConsumers();
  const server = app.listen(PORT, () => {
    logger.info({ port: PORT }, 'Server started successfully');
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
})();

module.exports = app;
