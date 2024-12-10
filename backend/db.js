// @ts-ignore
const dotenv = require('dotenv');
dotenv.config();
const mysql = require('mysql2/promise'); // 使用 mysql2/promise 版本

// 初始化 MySQL 連線池 (避免連線未準備好問題)
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10, // 允許的最大連接數
    queueLimit: 0
});

// 初始化 DB
// 確保 UserInfo、PrizePool 資料表和 ResetLeftOfPlayDaily 事件存在
(async () => {
    try {
        // 確保 UserInfo 資料表存在
        const createUserInfoTableSql = `
        CREATE TABLE IF NOT EXISTS UserInfo (
          Id BIGINT PRIMARY KEY AUTO_INCREMENT,
          WalletAddress VARCHAR(255) NOT NULL UNIQUE,
          LeftOfPlay INT DEFAULT 5,
          TimeCoin DOUBLE DEFAULT 0,
          CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          Creator VARCHAR(255) NOT NULL
        )
      `;
        await db.execute(createUserInfoTableSql);
        console.log('UserInfo 資料表已確保存在');

        // 確保 PrizePool 資料表存在
        const createPrizePoolTableSql = `
        CREATE TABLE IF NOT EXISTS PrizePool (
          ID INT PRIMARY KEY AUTO_INCREMENT,
          Amount DECIMAL(60,30) DEFAULT 0,
          CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
        await db.execute(createPrizePoolTableSql);
        console.log('PrizePool 資料表已確保存在');

        // 如果 PrizePool 表沒有數據，則插入一個初始數據
        const insertInitialPrizePoolSql = `
        INSERT IGNORE INTO PrizePool (ID, Amount) 
        VALUES (1, 0)
      `;
        await db.execute(insertInitialPrizePoolSql);
        console.log('PrizePool 表的初始數據已插入（如果尚未存在）');

        // 檢查事件是否已存在
        const [rows] = await db.query(`
        SELECT * 
        FROM INFORMATION_SCHEMA.EVENTS 
        WHERE EVENT_SCHEMA = ? 
          AND EVENT_NAME = 'ResetLeftOfPlayDaily';
      `, [process.env.DB_DATABASE]);

        if (rows.length === 0) {
            console.log('事件 ResetLeftOfPlayDaily 不存在，正在建立...');

            // 改成使用 db.query()，而不是 db.execute()
            const createEventSql = `
          CREATE EVENT ResetLeftOfPlayDaily 
            ON SCHEDULE EVERY 1 DAY 
            STARTS CONVERT_TZ(CURRENT_DATE, @@global.time_zone, '+00:00') + INTERVAL '00:00' HOUR_MINUTE 
                DO 
                UPDATE UserInfo 
                SET LeftOfPlay = 5;
        `;
            await db.query(createEventSql);
            console.log('ResetLeftOfPlayDaily 事件已建立');
        } else {
            console.log('事件 ResetLeftOfPlayDaily 已存在，無需建立');
        }

    } catch (err) {
        console.error('建立 UserInfo、PrizePool 表或 ResetLeftOfPlayDaily 事件失敗：', err);
    }
})();

module.exports = db;
