const pool = require('../pool');

const createUserInventoryTable = async () => {
    const createTableSql = `
    CREATE TABLE IF NOT EXISTS UserInventory (
        InventoryId INT AUTO_INCREMENT PRIMARY KEY,
        UserId INT NOT NULL,
        ItemId INT NOT NULL,
        Quantity INT DEFAULT 1,
        AcquiredTime DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ItemId) REFERENCES PrizeItem(ItemId) ON DELETE CASCADE
      );
  `;
    await pool.execute(createTableSql);
    console.log('UserInventory 資料表已確保存在');
};

module.exports = createUserInventoryTable;
