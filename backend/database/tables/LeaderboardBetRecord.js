const pool = require('../pool');

const createLeaderboardBetRecordTable = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS LeaderboardBetRecord (
        ID INT PRIMARY KEY AUTO_INCREMENT,
        FromWalletAddress VARCHAR(255) NOT NULL,
        ToWalletAddress VARCHAR(255) NOT NULL,
        YearWeek VARCHAR(10) NOT NULL,
        BetAmount INT DEFAULT 0,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE (FromWalletAddress, ToWalletAddress, YearWeek) -- 添加複合唯一約束
    );
  `;
  await pool.execute(createTableSql);
  console.log('Leaderboard 資料表已確保存在');
};

module.exports = createLeaderboardBetRecordTable;
