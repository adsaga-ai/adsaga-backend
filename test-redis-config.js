const config = require('./src/config');
const RedisCore = require('./src/utils/redis/redis-core').RedisCore;

/**
 * Test script to verify Redis configuration is being read correctly
 */
async function testRedisConfig() {
  console.log('Testing Redis configuration...');
  
  try {
    console.log('Config object:', JSON.stringify(config, null, 2));
    console.log('Redis config:', JSON.stringify(config.redis, null, 2));
    
    // Create Redis core with config
    const redisCore = new RedisCore(config.redis);
    
    console.log('Redis core config:', JSON.stringify(redisCore.config, null, 2));
    
    // Test connection (this will fail if Redis is not running, but we can see the config)
    console.log('Attempting to connect to Redis...');
    await redisCore.connect();
    
    console.log('Redis connected successfully!');
    await redisCore.gracefulShutdown();
    
  } catch (error) {
    console.error('Redis connection failed:', error.message);
    console.log('This is expected if Redis server is not running');
    console.log('The important thing is that the configuration is being read correctly');
  }
}

// Run the test
if (require.main === module) {
  testRedisConfig()
    .then(() => {
      console.log('Configuration test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Configuration test failed:', error);
      process.exit(1);
    });
}

module.exports = testRedisConfig;
