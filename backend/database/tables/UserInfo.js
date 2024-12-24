const pool = require('../pool');

const createUserInfoTable = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS UserInfo (
      Id BIGINT PRIMARY KEY AUTO_INCREMENT,
      WalletAddress VARCHAR(255) NOT NULL UNIQUE,
      LeftOfPlay INT DEFAULT 5,
      TimeCoin DOUBLE DEFAULT 0,
      BaseLeftOfPlay INT DEFAULT 5, -- 基礎可玩次數
      BaseAttackPower DOUBLE DEFAULT 1, -- 玩家基礎攻擊力
      RewardMultiplier DOUBLE DEFAULT 1, -- 玩家結算獎勵倍數
      CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      Creator VARCHAR(255) NOT NULL
    )
  `;
  await pool.execute(createTableSql);
  console.log('UserInfo 資料表已確保存在');
};

module.exports = createUserInfoTable;