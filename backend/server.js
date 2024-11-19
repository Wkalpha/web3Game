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
      SELECT TimeCoin
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
          res.json({ buyer, timeCoin: result[0].TimeCoin });
      } else {
          // 找不到資料
          res.status(404).json({ error: 'Buyer not found', buyer });
      }
  });
});

app.post('/check-user', (req, res) => {
  const { walletAddress } = req.body;
  const query = 'SELECT * FROM UserInfo WHERE WalletAddress = ?';

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
        timeCoin: userInfo.TimeCoin,
        createdAt: userInfo.CreatedAt,
        creator: userInfo.Creator
      });
    }
  });
});


// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
