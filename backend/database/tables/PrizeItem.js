const pool = require('../pool');

const createPrizeItemTable = async () => {
    const createTableSql = `
    CREATE TABLE IF NOT EXISTS PrizeItem (
        ItemId INT AUTO_INCREMENT PRIMARY KEY,
        PoolId INT NOT NULL,
        ItemName VARCHAR(100) NOT NULL,
        ItemType VARCHAR(50) NOT NULL,
        ItemValue INT,
        Rarity VARCHAR(20),
        DropRate DECIMAL(5, 2) NOT NULL,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (PoolId) REFERENCES PrizeItemPool(PrizeItemPoolId) ON DELETE CASCADE
      );
  `;
    await pool.execute(createTableSql);
    console.log('PrizeItem 資料表已確保存在');
};

module.exports = createPrizeItemTable;
