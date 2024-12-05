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

// 查詢 Buyer 的 TimeCoin API
app.get('/getTimeCoin', (req, res) => {
  const buyer = req.query.buyer; // 從請求參數中獲取 buyer 地址

  if (!buyer) {
    return res.status(400).json({ error: 'Missing buyer parameter' });
  }

  const querySql = `
      SELECT FLOOR(TimeCoin) AS AdjustedTimeCoin
      FROM UserInfo
      WHERE WalletAddress = ?
  `;

  db.query(querySql, [buyer], (err, result) => {
    if (err) {
      console.error('查詢 TimeCoin 失敗：', err);
      return res.status(500).json({ error: 'Database query error' });
    }

    if (result.length > 0) {
      // 返回 TimeCoin 值
      res.json({ buyer, timeCoin: result[0].AdjustedTimeCoin });
    } else {
      // 找不到資料
      res.status(404).json({ error: 'Buyer not found', buyer });
    }
  });
});

// 查詢 Prize Pool
app.get('/getPrizePool', (req, res) => {
  const querySql = `
      SELECT FLOOR(Amount * 10000) AS AdjustedAmount
      FROM PrizePool
      WHERE ID = 1
  `;

  db.query(querySql, (err, result) => {
    if (err) {
      console.error('查詢 Amount 失敗：', err);
      return res.status(500).json({ error: 'Database query error', details: err.message });
    }

    if (result.length > 0) {
      // 返回成功的 JSON 結果
      res.json({ amount: result[0].AdjustedAmount });
    } else {
      // 查詢成功但無資料
      res.status(204).send(); // No Content
    }
  });
});


app.post('/check-user', (req, res) => {
  const { walletAddress } = req.body;
  const query = 'SELECT *, FLOOR(TimeCoin) AS AdjustedTimeCoin FROM UserInfo WHERE WalletAddress = ?';

  // 查詢資料庫
  db.query(query, [walletAddress], (err, results) => {
    if (err) {
      console.error('查詢用戶資料失敗：', err);
      res.status(500).send('資料庫查詢失敗');
      return;
    }

    if (results.length === 0) {
      // 如果沒有找到，插入新用戶
      const insertQuery = 'INSERT INTO UserInfo (WalletAddress, TimeCoin, Creator) VALUES (?, ?, ?)';
      db.query(insertQuery, [walletAddress, 0, 'System'], (insertErr, insertResults) => {
        if (insertErr) {
          console.error('插入用戶資料失敗：', insertErr);
          res.status(500).send('資料庫插入失敗');
          return;
        }

        // 返回新用戶的資訊
        res.json({
          isNewUser: true,
          walletAddress: walletAddress,
          timeCoin: 0,
          createdAt: new Date().toISOString(),
          creator: 'System'
        });
      });
    } else {
      // 如果找到該用戶，返回現有用戶資訊
      const userInfo = results[0];
      res.json({
        isNewUser: false,
        walletAddress: userInfo.WalletAddress,
        timeCoin: userInfo.AdjustedTimeCoin,
      });
    }
  });
});

// 更新用戶的Time Coin
app.post('/update-balance', (req, res) => {
  const { walletAddress, amountChange } = req.body;

  if (!walletAddress || amountChange === undefined) {
    return res.status(400).json({ error: 'Missing walletAddress or amountChange' });
  }

  // 查詢用戶是否存在
  const querySelect = `SELECT FLOOR(TimeCoin) AS AdjustedTimeCoin FROM UserInfo WHERE WalletAddress = ?`;
  db.query(querySelect, [walletAddress], (selectErr, results) => {
    if (selectErr) {
      console.error('查詢用戶失敗：', selectErr);
      return res.status(500).json({ error: 'Database query error' });
    }

    if (results.length === 0) {
      // 用戶不存在
      return res.status(404).json({ error: 'User not found', walletAddress });
    }

    // 更新 TimeCoin
    const currentBalance = results[0].AdjustedTimeCoin;
    const newBalance = currentBalance + amountChange;

    if (newBalance < 0) {
      return res.status(400).json({ error: 'Insufficient balance', currentBalance });
    }

    const queryUpdate = `
      UPDATE UserInfo
      SET TimeCoin = ?
      WHERE WalletAddress = ?
    `;
    db.query(queryUpdate, [newBalance, walletAddress], (updateErr) => {
      if (updateErr) {
        console.error('更新用戶餘額失敗：', updateErr);
        return res.status(500).json({ error: 'Database update error' });
      }

      res.json({
        success: true,
        walletAddress,
        updatedBalance: newBalance,
      });
    });

    // 更新獎金池
    const queryUpdatePrizePool = `
      UPDATE PrizePool
      SET Amount = Amount - (?/10000)
      WHERE ID = 1
    `;

    db.query(queryUpdatePrizePool, [amountChange], (err, result) => {
      if (err) {
        console.error('更新 Prize Pool 失敗:', err);
      } else {
        console.log(`Prize Pool 資料表已更新，受影響行數: ${result.affectedRows}`);
      }
    });

  });
});



// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
