const pool = require('../pool');

const createPrizePoolTable = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS PrizePool (
      ID INT PRIMARY KEY AUTO_INCREMENT,
      Name NVARCHAR(100),
      Amount DECIMAL(60,30) DEFAULT 0,
      CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.execute(createTableSql);
  console.log('PrizePool 資料表已確保存在');
};

const insertInitialPrizePoolData = async () => {
  const insertSql = `
    INSERT IGNORE INTO PrizePool (ID, Name, Amount) 
    VALUES (1, 'MainPrizePool', 0), (2, 'LeaderboardPrizePool', 0)
  `;
  await pool.execute(insertSql);
  console.log('PrizePool 表的初始數據已插入（如果尚未存在）');
};

module.exports = { createPrizePoolTable, insertInitialPrizePoolData };