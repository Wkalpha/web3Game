// @ts-ignore
const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors'); // 引入 cors
const userRoutes = require('./routes/userRoutes.js');
const prizePoolRoutes = require('./routes/prizeRoutes.js');
const leaderboardRoutes = require('./routes/leaderboardRoutes.js');
const gameRoutes = require('./routes/gameRoutes.js');
require('./database/index.js'); // 建立 Table、Function、Event
const { initWebSocketService } = require('./services/webSocketService');
initWebSocketService(3001); // 啟動 WebSocket 服務

const { handleTokensPurchased, handleEthTransferred } = require('./services/contractEventHandler.js');

const app = express();

// 全局速率限制器
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 每 1 分鐘
  max: 30, // 每分鐘最多 10 次請求
  message: 'Too many requests, please try again later.'
});

// 為所有的請求應用速率限制器
app.use(globalLimiter); 

app.use(cors());
app.use(express.json());

// 路由掛載
app.use('/', userRoutes);
app.use('/', prizePoolRoutes);
app.use('/', leaderboardRoutes);
app.use('/', gameRoutes);

// 監聽合約事件
handleTokensPurchased();
handleEthTransferred();

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});