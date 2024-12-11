// @ts-ignore
const express = require('express');
const cors = require('cors'); // 引入 cors
const db = require('./db'); // 引入資料庫連接
const webSocketService = require('../backend/webSocketService.js');
const WebSocketServiceInstance = new webSocketService(3001); // 啟動 WebSocket 服務，端口為 3001
WebSocketServiceInstance.start(); // 啟動 WebSocket 服務

const { transferEthToSpecificAddress, withdraw, web3, contract } = require('./web3utlts.js');

const app = express();
app.use(cors());
app.use(express.json());

// 測試 API，檢查資料庫是否正常連接
app.get('/', (req, res) => {
  res.send('Node.js 和 MySQL 已成功連接');
});

// 將 Time Coin > ETH
app.post('/update-user-balance-when-buy-eth', async (req, res) => {
  const { walletAddress, balanceChange } = req.body;
  transferEthToSpecificAddress(walletAddress, balanceChange);
})

// 購買遊戲次數
app.post('/update-user-balance-when-buy-playtimes', async (req, res) => {
  const { walletAddress, balanceChange, playTimes } = req.body;

  const balanceChangeToETH = balanceChange / 10000;

  console.log(walletAddress, balanceChange, playTimes, balanceChangeToETH)

  // 1. 更新獎金池的金額
  const updatePrizePoolSql = `
    UPDATE PrizePool
    SET Amount = Amount + ?
    WHERE ID = 1
  `;
  await db.execute(updatePrizePoolSql, [balanceChangeToETH]);

  // 2. 更新使用者的 Time Coin & PlayTimes
  const updateUserInfo= `
    UPDATE UserInfo
    SET TimeCoin = TimeCoin - ?, LeftOfPlay = LeftOfPlay + ?
    WHERE WalletAddress = ?
  `;
  await db.execute(updateUserInfo, [balanceChange, playTimes, walletAddress]);

  // 🟢 重新 SELECT 以獲取最新的 Time Coin
  const selectUserInfo = `
    SELECT TimeCoin, LeftOfPlay
    FROM UserInfo
    WHERE WalletAddress = ?
  `;
  const [userInfoRow] = await db.execute(selectUserInfo, [walletAddress]);
  const userInfoTimeCoin = userInfoRow[0]?.TimeCoin;
  const leftOfPlay = userInfoRow[0]?.LeftOfPlay;

  await UpdatePrizePool();

  res.json({
    leftOfPlay: leftOfPlay,
    timeCoin: userInfoTimeCoin
  });

})


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

    await UpdatePrizePool();

    // 2. 調用合約
    withdraw();

  } catch (error) {
    console.error('錯誤:', error);
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
});

// 🟢 查詢用戶 TimeCoin
app.get('/getTimeCoin', async (req, res) => {
  const buyer = req.query.buyer;
  if (!buyer) {
    return res.status(400).json({ error: 'Missing buyer parameter' });
  }

  try {
    const [results] = await db.execute(`SELECT FLOOR(TimeCoin) AS AdjustedTimeCoin FROM UserInfo WHERE WalletAddress = ?`, [buyer]);
    if (results.length > 0) {
      res.json({ buyer, timeCoin: results[0].AdjustedTimeCoin });
    } else {
      res.status(404).json({ error: 'Buyer not found', buyer });
    }
  } catch (err) {
    console.error('查詢 TimeCoin 失敗：', err);
    res.status(500).json({ error: 'Database query error' });
  }
});

// 🟢 查詢 Prize Pool
app.get('/getPrizePool', async (req, res) => {
  try {
    const [results] = await db.execute(`SELECT FLOOR(Amount * 10000) AS AdjustedAmount FROM PrizePool WHERE ID = 1`);
    if (results.length > 0) {
      res.json({ amount: results[0].AdjustedAmount });
    } else {
      res.status(204).send(); // No Content
    }
  } catch (err) {
    console.error('查詢 Prize Pool 失敗：', err);
    res.status(500).json({ error: 'Database query error' });
  }
});


// 🟢 檢查並新增用戶
app.post('/check-user', async (req, res) => {
  const { walletAddress } = req.body;
  try {
    const [results] = await db.execute(`SELECT *, FLOOR(TimeCoin) AS AdjustedTimeCoin FROM UserInfo WHERE WalletAddress = ?`, [walletAddress]);

    if (results.length === 0) {
      await db.execute(`INSERT INTO UserInfo (WalletAddress, LeftOfPlay, TimeCoin, Creator) VALUES (?, ?, ?, ?)`, [walletAddress, 5, 0, 'System']);
      res.json({
        isNewUser: true,
        walletAddress: walletAddress,
        leftOfPlay: 5,
        timeCoin: 0
      });
    } else {
      const userInfo = results[0];
      res.json({
        isNewUser: false,
        walletAddress: userInfo.WalletAddress,
        leftOfPlay: userInfo.LeftOfPlay,
        timeCoin: userInfo.AdjustedTimeCoin,
      });
    }
  } catch (err) {
    console.error('檢查用戶失敗：', err);
    res.status(500).send('資料庫錯誤');
  }
});

// 於遊戲結束後，更新用戶 Time Coin 與 Prize Pool
app.post('/update-balance-when-game-over', async (req, res) => {
  const { walletAddress, betAmount, odds, gameResult } = req.body;

  if (!walletAddress || betAmount === undefined) {
    return res.status(400).json({ error: 'Missing walletAddress or betAmount' });
  }

  let userTimeCoinOdds = gameResult === 'win' ? 1 + odds : 0;
  let prizePoolOdds = gameResult === 'lose' ? 1 : -odds;

  try {
    // 1.更新用戶的 TimeCoin
    const queryUpdateUserTimeCoin = `
      UPDATE UserInfo
      SET TimeCoin = TimeCoin + (? * ?)
      WHERE WalletAddress = ?
    `;
    await db.execute(queryUpdateUserTimeCoin, [betAmount, userTimeCoinOdds, walletAddress]);

    // 2.重新查詢 UserInfo 的 TimeCoin
    const [userResults] = await db.execute(`SELECT TimeCoin FROM UserInfo WHERE WalletAddress = ?`, [walletAddress]);
    if (!userResults || userResults.length === 0) {
      return res.status(404).json({ error: 'User not found', walletAddress });
    }
    const userTimeCoin = userResults[0].TimeCoin; // 取得 UserInfo 的 TimeCoin

    // 3.更新獎金池的金額
    const updatePrizePoolSQL = `
      UPDATE PrizePool
      SET Amount = Amount + ((? * ?) / 10000)
      WHERE ID = 1
    `;
    await db.execute(updatePrizePoolSQL, [betAmount, prizePoolOdds]);

    await UpdatePrizePool();

    // 回傳結果
    res.json({
      success: true,
      walletAddress,
      userTimeCoin // 來自 UserInfo 的 TimeCoin
    });

  } catch (error) {
    console.error('錯誤:', error);
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
});

// 開始遊戲，更新相關資訊
app.post('/update-balance-when-game-start', async (req, res) => {
  const { walletAddress, amountChange } = req.body;
  try {
    // 查詢用戶的 TimeCoin
    const [results] = await db.execute(
      `SELECT FLOOR(TimeCoin) AS AdjustedTimeCoin, LeftOfPlay FROM UserInfo WHERE WalletAddress = ?`,
      [walletAddress]
    );

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found', walletAddress });
    }

    const currentBalance = results[0].AdjustedTimeCoin;
    const currentLeftOfPlay = results[0].LeftOfPlay;
    const newBalance = currentBalance - amountChange;
    const newLeftOfPlay = currentLeftOfPlay - 1;

    // 檢查餘額和剩餘遊戲次數是否足夠
    if (newBalance < 0) {
      return res.status(400).json({ error: 'Insufficient balance', currentBalance });
    }

    if (newLeftOfPlay < 0) {
      return res.status(400).json({ error: 'No plays left', currentLeftOfPlay });
    }

    // 同時更新 TimeCoin 和 LeftOfPlay
    await db.execute(
      `UPDATE UserInfo SET TimeCoin = ?, LeftOfPlay = ? WHERE WalletAddress = ?`,
      [newBalance, newLeftOfPlay, walletAddress]
    );

    res.json({
      success: true,
      walletAddress,
      updatedUserBalance: newBalance,
      updatedLeftOfPlay: newLeftOfPlay
    });
  } catch (err) {
    console.error('更新用戶餘額失敗：', err);
    res.status(500).json({ error: 'Database update error' });
  }
});

// 更新 PrizePool 之後要廣播給所有的用戶
async function UpdatePrizePool() {
  const [prizePoolResults] = await db.execute(`SELECT FLOOR(Amount * 10000) AS Amount FROM PrizePool WHERE ID = 1`);
  const prizePoolTimeCoin = prizePoolResults[0]?.Amount;

  const message = {
    event: 'PrizePoolUpdated',
    data: {
      prizePoolTimeCoin: prizePoolTimeCoin
    }
  };

  WebSocketServiceInstance.broadcastToAll(message);

}

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
      await UpdatePrizePool();

    } catch (err) {
      console.error('更新 UserInfo 或 PrizePool 失敗:', err);
    }
  });

// 監聽 EthTransferred 事件
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
