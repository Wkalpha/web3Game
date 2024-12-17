// @ts-ignore
const express = require('express');
const cors = require('cors'); // 引入 cors
const db = require('./db'); // 引入資料庫連接
const userRoutes = require('./routes/userRoutes.js');
const prizePoolRoutes = require('./routes/prizeRoutes.js');
const leaderboardRoutes = require('./routes/leaderboardRoutes.js');
const dbInit = require('./database/index.js'); // 建立 Table、Function、Event
const { initWebSocketService } = require('./services/webSocketService');
const WebSocketServiceInstance = initWebSocketService(3001); // 啟動 WebSocket 服務，端口為 3001
// WebSocketServiceInstance.start(); // 啟動 WebSocket 服務

const { withdraw, web3, contract } = require('./services/web3utlts.js');

const app = express();
app.use(cors());
app.use(express.json());

// 路由掛載
app.use('/', userRoutes);
app.use('/', prizePoolRoutes);
app.use('/', leaderboardRoutes);

// 提取合約的 ETH
app.post('/update-prize-pool-after-withdraw', async (req, res) => {
  try {
    // 更新獎金池的金額
    const queryUpdatePrizePool = `
      UPDATE PrizePool
      SET Amount = 0
      WHERE ID = 1
    `;
    await db.execute(queryUpdatePrizePool);

    await QueryPrizePool();

    // 2. 調用合約
    withdraw();

  } catch (error) {
    console.error('錯誤:', error);
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
});

// 監聽 buyToken 事件
contract.events.TokensPurchased()
  .on('data', async (event) => {
    console.log(event); // 可以選擇不顯示

    const weiToEth = web3.utils.fromWei(event.returnValues.ethAmount, 'ether');
    const timeCoin = weiToEth * 10000; // 1 ETH = 10000 TimeCoin
    const buyer = event.returnValues.buyer;

    try {
      // 更新 UserInfo 的 TimeCoin
      const updateUserTimeCoinSql = `
                UPDATE UserInfo
                SET TimeCoin = TimeCoin + ?
                WHERE WalletAddress = ?
            `;
      await db.execute(updateUserTimeCoinSql, [timeCoin, buyer]);

      // 更新 PrizePool 的 Amount
      const updatePrizePoolSql = `
                UPDATE PrizePool
                SET Amount = Amount + ?
                WHERE ID = 1
            `;
      await db.execute(updatePrizePoolSql, [weiToEth]);

      // 🟢 重新 SELECT 以獲取最新的 Time Coin
      const selectUserInfo = `
        SELECT TimeCoin
        FROM UserInfo
        WHERE WalletAddress = ?
      `;
      const [userInfoRow] = await db.execute(selectUserInfo, [buyer]);
      const userInfoTimeCoin = userInfoRow[0]?.TimeCoin;

      // 只通知對應的買家 (特定的 walletAddress)
      const message = {
        event: 'TokensPurchased',
        data: {
          buyer,
          userTimeCoin: userInfoTimeCoin
        }
      };

      WebSocketServiceInstance.broadcastToClient(buyer, message);
      await QueryPrizePool();

    } catch (err) {
      console.error('更新 UserInfo 或 PrizePool 失敗:', err);
    }
  });

// 監聽 EthTransferred(玩家將 Time Coin 換回 ETH) 事件
contract.events.EthTransferred()
  .on('data', async (event) => {
    console.log(event); // 可以選擇不顯示

    let totalAmount = event.returnValues.amountAfterFee + event.returnValues.feeAmount;

    const weiToEth = web3.utils.fromWei(totalAmount, 'ether');
    const timeCoin = weiToEth * 10000; // 1 ETH = 10000 TimeCoin
    const buyer = event.returnValues.to;

    try {
      // 更新 UserInfo 的 TimeCoin
      const updateUserTimeCoinSql = `
                UPDATE UserInfo
                SET TimeCoin = TimeCoin - ?
                WHERE WalletAddress = ?
            `;
      await db.execute(updateUserTimeCoinSql, [timeCoin, buyer]);

      // 🟢 重新 SELECT 以獲取最新的 Time Coin
      const selectUserInfo = `
        SELECT TimeCoin
        FROM UserInfo
        WHERE WalletAddress = ?
      `;
      const [userInfoRow] = await db.execute(selectUserInfo, [buyer]);
      const userInfoTimeCoin = userInfoRow[0]?.TimeCoin;

      // 只通知對應的買家 (特定的 walletAddress)
      const message = {
        event: 'TimeCoinToETH',
        data: {
          buyer,
          userTimeCoin: userInfoTimeCoin
        }
      };

      WebSocketServiceInstance.broadcastToClient(buyer, message);

    } catch (err) {
      console.error('更新 UserInfo Time Coin 失敗:', err);
    }
  });

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});