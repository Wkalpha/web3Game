const pool = require('../pool');

const createLeaderboardTable = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS Leaderboard (
      ID INT PRIMARY KEY AUTO_INCREMENT,
      WalletAddress VARCHAR(255) NOT NULL,
      YearWeek VARCHAR(10) NOT NULL,
      Win INT DEFAULT 0,
      Lose INT DEFAULT 0,
      Scores INT DEFAULT 0,
      BetAmount INT DEFAULT 0,
      YearWeekRank INT,
      CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE (WalletAddress, YearWeek)
    )
  `;
  await pool.execute(createTableSql);
  console.log('Leaderboard 資料表已確保存在');
};

module.exports = createLeaderboardTable;
