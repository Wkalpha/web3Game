const pool = require('../pool');

const createGameInfoTable = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS GameInfo (
      ID INT PRIMARY KEY AUTO_INCREMENT,
      WalletAddress VARCHAR(255) NOT NULL,
      GameId VARCHAR(50) NOT NULL,
      Level NVARCHAR(50) DEFAULT NULL,
      RewardMultiplier DECIMAL(5,2) DEFAULT 1, -- 獲勝後的獎勵倍率
      DamageMultiplier DECIMAL(5,2) DEFAULT 1, -- 結算傷害倍率
      Round INT,
      ItemId INT,
      Odds DECIMAL(5, 2) NOT NULL,
      BetAmount INT DEFAULT NULL,
      Profit INT DEFAULT NULL,
      UserScores INT DEFAULT NULL, -- 玩家總分
      Result VARCHAR(50) DEFAULT NULL,
      CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_walletAddress_gameId (WalletAddress, GameId) -- 複合唯一索引
    )
  `;
  await pool.execute(createTableSql);
  console.log('GameInfo 資料表已確保存在');
};

module.exports = createGameInfoTable;
