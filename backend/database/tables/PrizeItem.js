const pool = require('../pool');

const createPrizeItemTable = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS PrizeItem (
        ItemId INT AUTO_INCREMENT PRIMARY KEY,
        PoolId INT NOT NULL,
        ItemName VARCHAR(100) NOT NULL UNIQUE,
        ItemType ENUM('Currency', 'Ticket', 'FunctionalBuff', 'DamageBuff', 'PermanentBuff', 'FinalBuff', 'NFT') NOT NULL,
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
      (1, '5 Time Coin', 'Currency', 1, 'Normal', 0.6, 0, '{"value": 5, "type": "TimeCoin"}'),
      (1, '10 Time Coin', 'Currency', 1, 'Normal', 0.3, 0, '{"value": 10, "type": "TimeCoin"}'),
      (1, '50 Time Coin', 'Currency', 1, 'Normal', 0.07, 0, '{"value": 50, "type": "TimeCoin"}'),
      (1, '150 Time Coin', 'Currency', 1, 'Normal', 0.015, 0, '{"value": 150, "type": "TimeCoin"}'),
      (1, '200 Time Coin', 'Currency', 1, 'Normal', 0.01, 1, '{"value": 200, "type": "TimeCoin"}'),
      (1, '抽獎券(B)', 'Ticket', 1, 'Normal', 0.005, 1, '{"value": 1, "type": "Rare"}'),

      (2, '2 回合傷害UP10%', 'DamageBuff', 1, 'Rare', 0.25, 0, '{"value": 0.1, "type": "DamageBonus", "durationRounds": 2}'),
      (2, '2 回合傷害UP30%', 'DamageBuff', 1, 'Rare', 0.2, 0, '{"value": 0.3, "type": "DamageBonus", "durationRounds": 2}'),
      (2, '2 回合傷害UP50%', 'DamageBuff', 1, 'Rare', 0.13, 0, '{"value": 0.5, "type": "DamageBonus", "durationRounds": 2}'),
      (2, '結算傷害UP10%', 'FinalBuff', 1, 'Rare', 0.15, 0, '{"value": 0.1, "type": "FinalDamageBonus"}'),
      (2, '結算傷害UP30%', 'FinalBuff', 1, 'Rare', 0.1, 0, '{"value": 0.3, "type": "FinalDamageBonus"}'),
      (2, '結算傷害UP50%', 'FinalBuff', 1, 'Rare', 0.075, 0, '{"value": 0.5, "type": "FinalDamageBonus"}'),
      (2, '結算獎勵UP10%', 'FinalBuff', 1, 'Rare', 0.05, 0, '{"value": 0.1, "type": "RewardBonus"}'),
      (2, '結算獎勵UP30%', 'FinalBuff', 1, 'Rare', 0.03, 0, '{"value": 0.3, "type": "RewardBonus"}'),
      (2, '結算獎勵UP50%', 'FinalBuff', 1, 'Rare', 0.01, 1, '{"value": 0.5, "type": "RewardBonus"}'),
      (2, '抽獎券(C)', 'Ticket', 1, 'Rare', 0.005, 1, '{"value": 1, "type": "Epic"}'),

      (3, '延長 5 回合', 'FunctionalBuff', 1, 'Epic', 0.349, 0, '{"value": 5, "type": "ExtendRound"}'),
      (3, '2 回合內隨機增加1~5分數', 'FunctionalBuff', 1, 'Epic', 0.2, 0, '{"value": 1, "type": "RandomScore", "durationRounds": 2}'),
      (3, '2 回合內指定秒數', 'FunctionalBuff', 1, 'Epic', 0.1, 0, '{"value": 1, "type": "AsignTime", "durationRounds": 2}'),
      (3, '結算傷害UP100%', 'FinalBuff', 1, 'Epic', 0.1, 1, '{"value": 1, "type": "FinalDamageBonus"}'),
      (3, '結算獎勵UP100%', 'FinalBuff', 1, 'Epic', 0.1, 1, '{"value": 1, "type": "RewardBonus"}'),
      (3, '永久結算傷害提升0.5%', 'PermanentBuff', 1, 'Epic', 0.05, 1, '{"value": 0.005, "type": "BaseAttackPower"}'),
      (3, '永久結算獎勵提升0.5%', 'PermanentBuff', 1, 'Epic', 0.05, 1, '{"value": 0.005, "type": "RewardMultiplier"}'),
      (3, '永久提高每日挑戰次數1次', 'PermanentBuff', 1, 'Epic', 0.05, 1, '{"value": 1, "type": "BaseLeftOfPlay"}'),
      (3, 'SSR NFT', 'NFT', 1, 'Epic', 0.001, 1, '{"value": 1, "type": "NFT"}');
    `;

  await pool.execute(insertDataSql);
  console.log('已插入資料到 PrizeItem');
};

module.exports = createPrizeItemTable;
