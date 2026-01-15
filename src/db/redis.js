const Redis = require('ioredis');

// Create Redis client
const redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL) // Production (upstash)
    : new Redis();

// Handle connection events
redis.on('connect', () => {
    console.log('Connected to Redis.');
});

redis.on('error', (err) => {
    console.log('Redis error: ', err);
});

module.exports = redis;