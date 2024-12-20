const pool = require('../pool');

const createGameLogTable = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS GameLog (
      ID INT PRIMARY KEY AUTO_INCREMENT,
      WalletAddress VARCHAR(255) NOT NULL,
      TargetTime DECIMAL(10, 2) DEFAULT NULL,
      GameId VARCHAR(50) NOT NULL,
      Round INT,
      StartTime VARCHAR(20) DEFAULT NULL,
      EndTime VARCHAR(20) DEFAULT NULL,
      ElapsedTime DECIMAL(10, 2) DEFAULT NULL,
      Scores INT DEFAULT NULL,
      CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.execute(createTableSql);
  console.log('GameLog 資料表已確保存在');
};

module.exports = createGameLogTable;
