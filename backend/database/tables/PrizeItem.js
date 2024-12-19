const pool = require('../pool');

const createPrizeItemTable = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS PrizeItem (
        ItemId INT AUTO_INCREMENT PRIMARY KEY,
        PoolId INT NOT NULL,
        ItemName VARCHAR(100) NOT NULL UNIQUE,
        ItemType VARCHAR(50) NOT NULL,
        ItemValue INT,
        Rarity VARCHAR(20),
        DropRate DECIMAL(10, 5) NOT NULL,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (PoolId) REFERENCES PrizeItemPool(PrizeItemPoolId) ON DELETE CASCADE
      );
  `;
  await pool.execute(createTableSql);
  console.log('PrizeItem 資料表已確保存在');

  // 插入資料
  const insertDataSql = `
      INSERT IGNORE INTO PrizeItem 
      (PoolId, ItemName, ItemType, ItemValue, Rarity, DropRate) 
      VALUES 
      (1, '5 Time Coin', 'Currency', 5, 'Normal', 0.6),
      (1, '10 Time Coin', 'Currency', 10, 'Normal', 0.3),
      (1, '50 Time Coin', 'Currency', 50, 'Normal', 0.07),
      (1, '150 Time Coin', 'Currency', 150, 'Normal', 0.015),
      (1, '200 Time Coin', 'Currency', 200, 'Normal', 0.01),
      (1, '抽獎券(B)', 'Item', 1, 'Normal', 0.005),

      (2, '2 回合傷害UP10%', 'Item', 1, 'Rare', 0.25),
      (2, '2 回合傷害UP30%', 'Item', 1, 'Rare', 0.2),
      (2, '2 回合傷害UP50%', 'Item', 1, 'Rare', 0.13),
      (2, '結算傷害UP10%', 'Item', 1, 'Rare', 0.15),
      (2, '結算傷害UP30%', 'Item', 1, 'Rare', 0.1),
      (2, '結算傷害UP50%', 'Item', 1, 'Rare', 0.075),
      (2, '結算獎勵UP10%', 'Item', 1, 'Rare', 0.05),
      (2, '結算獎勵UP30%', 'Item', 1, 'Rare', 0.03),
      (2, '結算獎勵UP50%', 'Item', 1, 'Rare', 0.01),
      (2, '抽獎券(C)', 'Item', 1, 'Rare', 0.005),

      (3, '延長 5 回合', 'Item', 1, 'Epic', 0.399),
      (3, '5 回合內顯示秒數', 'Item', 1, 'Epic', 0.15),
      (3, '2 回合內指定秒數', 'Item', 1, 'Epic', 0.15),
      (3, '結算傷害UP100%', 'Item', 1, 'Epic', 0.1),
      (3, '結算獎勵UP100%', 'Item', 1, 'Epic', 0.1),
      (3, '永久結算獎勵提升0.5%', 'Item', 1, 'Epic', 0.05),
      (3, '永久提高每日挑戰次數1次', 'Item', 1, 'Epic', 0.05),
      (3, 'SSR NFT', 'NFT', 1, 'Epic', 0.001);
    `;

  await pool.execute(insertDataSql);
  console.log('已插入資料到 PrizeItem');
};

module.exports = createPrizeItemTable;
