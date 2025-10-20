const { createClient } = require('redis');

/**
 * Direct test of Redis connection with your specific configuration
 */
async function testRedisDirect() {
  console.log('Testing Redis connection directly...');
  
  try {
    // Use your exact Redis configuration
    const client = createClient({
      socket: {
        host: '192.168.1.11',
        port: 6379,
        connectTimeout: 10000,
        lazyConnect: true
      },
      password: '5623',
      database: 0 // Redis expects numeric DB index, not string
    });

    console.log('Connecting to Redis at 192.168.1.11:6379...');
    
    client.on('connect', () => {
      console.log('✅ Redis connected successfully!');
    });

    client.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
    });

    await client.connect();
    
    // Test a simple operation
    await client.set('test_key', 'Hello Redis!');
    const value = await client.get('test_key');
    console.log('✅ Test operation successful:', value);
    
    await client.disconnect();
    console.log('✅ Redis disconnected successfully!');
    
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testRedisDirect()
    .then(() => {
      console.log('Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = testRedisDirect;
