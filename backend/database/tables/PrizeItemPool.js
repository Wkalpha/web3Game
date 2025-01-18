const pool = require('../pool');

const createPrizeItemPoolTable = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS PrizeItemPool (
        PrizeItemPoolId INT AUTO_INCREMENT PRIMARY KEY,
        PoolName VARCHAR(50) NOT NULL UNIQUE,
        EntryFee INT NOT NULL,
        GuaranteeDraw INT NOT NULL,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
  `;
  await pool.execute(createTableSql);
  console.log('PrizeItemPool 資料表已確保存在');

  // 插入資料
  const insertDataSql = `
      INSERT IGNORE INTO PrizeItemPool  
      (PoolName, EntryFee, GuaranteeDraw)
      VALUES 
      ('A', 20, 10),
      ('B', 50, 20),
      ('C', 100, 30);
    `;

  await pool.execute(insertDataSql);
  console.log('已插入資料到 PrizeItemPool');
};

module.exports = createPrizeItemPoolTable;
