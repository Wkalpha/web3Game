const { createClient } = require('redis');

// 連接本機 Redis，預設埠號6379
const redisClient = createClient({
  url: 'redis://localhost:6379'
});

// 連線
redisClient.connect().catch(console.error);

// 監聽各種事件 (可加上錯誤監控)
redisClient.on('connect', () => console.log('Redis connected'));
redisClient.on('error', (err) => console.error('Redis error', err));

module.exports = redisClient;