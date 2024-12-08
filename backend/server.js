// @ts-ignore
const express = require('express');
const cors = require('cors'); // 引入 cors
const db = require('./db'); // 引入資料庫連接

const app = express();
app.use(cors());
app.use(express.json());

// 測試 API，檢查資料庫是否正常連接
app.get('/', (req, res) => {
  res.send('Node.js 和 MySQL 已成功連接');
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
      const [insertResults] = await db.execute(`INSERT INTO UserInfo (WalletAddress, LeftOfPlay, TimeCoin, Creator) VALUES (?, ?, ?, ?)`, [walletAddress, 5, 0, 'System']);
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
    const queryUpdatePrizePool = `
      UPDATE PrizePool
      SET Amount = Amount + ((? * ?) / 10000)
      WHERE ID = 1
    `;
    await db.execute(queryUpdatePrizePool, [betAmount, prizePoolOdds]);

    // 4.重新查詢 PrizePool 的最新金額
    const [prizePoolResults] = await db.execute(`SELECT FLOOR(Amount * 10000) AS Amount FROM PrizePool WHERE ID = 1`);
    if (!prizePoolResults || prizePoolResults.length === 0) {
      return res.status(404).json({ error: 'Prize pool not found' });
    }
    const prizePoolTimeCoin = prizePoolResults[0].Amount; // 取得 PrizePool 的金額

    // 回傳結果
    res.json({
      success: true,
      walletAddress,
      userTimeCoin, // 來自 UserInfo 的 TimeCoin
      prizePoolTimeCoin // 來自 PrizePool 的 Amount
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

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
