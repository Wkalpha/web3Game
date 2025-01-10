const pool = require('../pool');

const createRewardLogTable = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS RewardLog (
      ID INT PRIMARY KEY AUTO_INCREMENT,
      WalletAddress VARCHAR(255) NOT NULL,
      RewardAmount INT DEFAULT NULL,
      RewardType VARCHAR(50) DEFAULT NULL,
      YearWeek VARCHAR(50) DEFAULT NULL,
      CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.execute(createTableSql);
  console.log('RewardLog 資料表已確保存在');
};

module.exports = createRewardLogTable;
