const pool = require('../pool');

const createUserDrawLogTable = async () => {
    const createTableSql = `
    CREATE TABLE IF NOT EXISTS UserDrawLog (
        LogId INT AUTO_INCREMENT PRIMARY KEY,
        UserId INT NOT NULL,
        PrizeItemPoolId INT NOT NULL,
        ItemId INT NOT NULL,
        DrawTime DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (PrizeItemPoolId) REFERENCES PrizeItemPool(PrizeItemPoolId) ON DELETE CASCADE,
        FOREIGN KEY (ItemId) REFERENCES PrizeItem(ItemId) ON DELETE CASCADE
      );
  `;
    await pool.execute(createTableSql);
    console.log('UserDrawLog 資料表已確保存在');
};

module.exports = createUserDrawLogTable;
