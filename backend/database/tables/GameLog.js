const pool = require('../pool');

const createGameLogTable = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS GameLog (
      ID INT PRIMARY KEY AUTO_INCREMENT,
      WalletAddress VARCHAR(255) NOT NULL,
      TargetTime DECIMAL(10, 2) DEFAULT NULL,
      GameId VARCHAR(50) NOT NULL,
      Round INT,
      ItemId INT DEFAULT NULL, -- 道具ID
      ItemType NVARCHAR(100) DEFAULT NULL, -- 道具種類
      ItemEffectValue DECIMAL(5, 2) DEFAULT NULL, -- 道具數值
      ItemLeftRound INT DEFAULT NULL, -- 道具持續剩餘回合
      StartTime BIGINT DEFAULT NULL, -- Unix Timestamp (毫秒)
      EndTime BIGINT DEFAULT NULL, -- Unix Timestamp (毫秒)
      ElapsedTime DECIMAL(5, 2) DEFAULT NULL,
      Scores INT DEFAULT NULL,
      CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_gameId_round (GameId, Round) -- 複合唯一索引
    )
  `;
  await pool.execute(createTableSql);
  console.log('GameLog 資料表已確保存在');
};

module.exports = createGameLogTable;
