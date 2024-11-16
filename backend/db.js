// @ts-ignore
const dotenv = require('dotenv');
dotenv.config();

const mysql = require('mysql2');

// 建立 MySQL 連接
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
});

// 連接到資料庫
db.connect((err) => {
    console.log('連接PORT',process.env.DB_PORT)
    if (err) {
        console.error('MySQL 連線失敗：', err);
        process.exit(1);
    } else {
        console.log('MySQL 連線成功');

        // 創建 UserInfo 資料表
        const createUserInfoTable = `
      CREATE TABLE IF NOT EXISTS UserInfo (
        Id BIGINT PRIMARY KEY AUTO_INCREMENT,
        WalletAddress VARCHAR(255) NOT NULL,
        TimeCoin DOUBLE DEFAULT 0,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        Creator VARCHAR(255) NOT NULL
      )
    `;

        db.query(createUserInfoTable, (err, result) => {
            if (err) {
                console.error('建立 UserInfo 資料表失敗：', err);
            } else {
                console.log('UserInfo 資料表已確保存在');
            }
        });
    }
});

module.exports = db;
