// @ts-ignore
const express = require('express');
const cors = require('cors'); // 引入 cors
const userRoutes = require('./routes/userRoutes.js');
const prizePoolRoutes = require('./routes/prizeRoutes.js');
const leaderboardRoutes = require('./routes/leaderboardRoutes.js');
require('./database/index.js'); // 建立 Table、Function、Event
const { initWebSocketService } = require('./services/webSocketService');
initWebSocketService(3001); // 啟動 WebSocket 服務

const { handleTokensPurchased, handleEthTransferred } = require('./services/contractEventHandler.js');

const app = express();
app.use(cors());
app.use(express.json());

// 路由掛載
app.use('/', userRoutes);
app.use('/', prizePoolRoutes);
app.use('/', leaderboardRoutes);

// 監聽合約事件
handleTokensPurchased();
handleEthTransferred();

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});