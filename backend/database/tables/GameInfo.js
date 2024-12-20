const pool = require('../pool');

const createGameInfoTable = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS GameInfo (
      ID INT PRIMARY KEY AUTO_INCREMENT,
      WalletAddress VARCHAR(255) NOT NULL,
      GameId VARCHAR(50) NOT NULL,
      Level NVARCHAR(50) DEFAULT NULL,
      Odds DECIMAL(5,2) NOT NULL,
      BetAmount INT DEFAULT NULL,
      Profit INT DEFAULT NULL,
      Result VARCHAR(50) DEFAULT NULL,
      CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.execute(createTableSql);
  console.log('GameInfo 資料表已確保存在');
};

module.exports = createGameInfoTable;
