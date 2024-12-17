const pool = require('../pool');

const createPrizeItemPoolTable = async () => {
    const createTableSql = `
    CREATE TABLE IF NOT EXISTS PrizeItemPool (
        PrizeItemPoolId INT AUTO_INCREMENT PRIMARY KEY,
        PoolName VARCHAR(50) NOT NULL,
        EntryFee INT NOT NULL,
        GuaranteeDraw INT NOT NULL,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
  `;
    await pool.execute(createTableSql);
    console.log('PrizeItemPool 資料表已確保存在');
};

module.exports = createPrizeItemPoolTable;
