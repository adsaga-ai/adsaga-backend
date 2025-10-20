const dotenv = require('dotenv');
dotenv.config();

const config = require('./src/config');

console.log('Environment variables:');
console.log('REDIS_HOST:', process.env.REDIS_HOST);
console.log('REDIS_PORT:', process.env.REDIS_PORT);
console.log('REDIS_PASSWORD:', process.env.REDIS_PASSWORD);
console.log('REDIS_DB:', process.env.REDIS_DB);

console.log('\nConfig object:');
console.log('config.redis:', JSON.stringify(config.redis, null, 2));

console.log('\nExpected Redis URL:');
const redisUrl = `redis://${config.redis.password ? `:${config.redis.password}@` : ''}${config.redis.host}:${config.redis.port}/${config.redis.db}`;
console.log('Redis URL:', redisUrl);
