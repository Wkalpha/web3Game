const pool = require('../pool');

const createPrizeItemTable = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS PrizeItem (
        ItemId INT AUTO_INCREMENT PRIMARY KEY,
        PoolId INT NOT NULL,
        ItemName VARCHAR(100) NOT NULL UNIQUE,
        ItemType ENUM('Currency', 'Item', 'Ticket', 'Buff', 'NFT') NOT NULL,
        ItemValue INT DEFAULT NULL,
        Rarity ENUM('Normal', 'Rare', 'Epic', 'Legendary') NOT NULL,
        DropRate DECIMAL(10, 5) NOT NULL,
        BigPrize TINYINT(1) NOT NULL DEFAULT 0,
        Effects JSON DEFAULT NULL,
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
      (PoolId, ItemName, ItemType, ItemValue, Rarity, DropRate, BigPrize, Effects)
      VALUES 
      (1, '5 Time Coin', 'Currency', 1, 'Normal', 0.6, 0, NULL),
      (1, '10 Time Coin', 'Currency', 1, 'Normal', 0.3, 0, NULL),
      (1, '50 Time Coin', 'Currency', 1, 'Normal', 0.07, 0, NULL),
      (1, '150 Time Coin', 'Currency', 1, 'Normal', 0.015, 0, NULL),
      (1, '200 Time Coin', 'Currency', 1, 'Normal', 0.01, 1, NULL),
      (1, '抽獎券(B)', 'Ticket', 1, 'Normal', 0.005, 1, NULL),

      (2, '2 回合傷害UP10%', 'Item', 1, 'Rare', 0.25, 0, '{"DamageBonus": 0.1, "DurationRounds": 2}'),
      (2, '2 回合傷害UP30%', 'Item', 1, 'Rare', 0.2, 0, '{"DamageBonus": 0.3, "DurationRounds": 2}'),
      (2, '2 回合傷害UP50%', 'Item', 1, 'Rare', 0.13, 0, '{"DamageBonus": 0.5, "DurationRounds": 2}'),
      (2, '結算傷害UP10%', 'Item', 1, 'Rare', 0.15, 0, '{"FinalDamageBonus": 0.1}'),
      (2, '結算傷害UP30%', 'Item', 1, 'Rare', 0.1, 0, '{"FinalDamageBonus": 0.3}'),
      (2, '結算傷害UP50%', 'Item', 1, 'Rare', 0.075, 0, '{"FinalDamageBonus": 0.5}'),
      (2, '結算獎勵UP10%', 'Item', 1, 'Rare', 0.05, 0, '{"RewardBonus": 0.1}'),
      (2, '結算獎勵UP30%', 'Item', 1, 'Rare', 0.03, 0, '{"RewardBonus": 0.3}'),
      (2, '結算獎勵UP50%', 'Item', 1, 'Rare', 0.01, 1, '{"RewardBonus": 0.5}'),
      (2, '抽獎券(C)', 'Ticket', 1, 'Rare', 0.005, 1, NULL),

      (3, '延長 5 回合', 'Item', 1, 'Epic', 0.399, 0, '{"ExtendRound": 5}'),
      (3, '5 回合內顯示秒數', 'Item', 1, 'Epic', 0.15, 0, '{"ShowTimer": true, "DurationRounds": 5}'),
      (3, '2 回合內指定秒數', 'Item', 1, 'Epic', 0.15, 0, '{"AsignTime": true, "DurationRounds": 2}'),
      (3, '結算傷害UP100%', 'Item', 1, 'Epic', 0.1, 1, '{"FinalDamageBonus": 1}'),
      (3, '結算獎勵UP100%', 'Item', 1, 'Epic', 0.1, 1, '{"RewardBonus": 1}'),
      (3, '永久結算獎勵提升0.5%', 'Buff', 1, 'Epic', 0.05, 1, '{"RewardBonus": 0.05, "Permanent": true}'),
      (3, '永久提高每日挑戰次數1次', 'Buff', 1, 'Epic', 0.05, 1, '{"PlayOfTimes": 1, "Permanent": true}'),
      (3, 'SSR NFT', 'NFT', 1, 'Epic', 0.001, 1, NULL);
    `;

  await pool.execute(insertDataSql);
  console.log('已插入資料到 PrizeItem');
};

module.exports = createPrizeItemTable;
