const pool = require('../pool');

const createReferralsTable = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS Referrals (
      Id BIGINT PRIMARY KEY AUTO_INCREMENT,
      ReferrerWalletAddress VARCHAR(255) NOT NULL,
      RefereeWalletAddress VARCHAR(255) NOT NULL,
      RewardTimeCoin INT DEFAULT 0,
      CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.execute(createTableSql);
  console.log('Referrals 資料表已確保存在');
};

module.exports = createReferralsTable;