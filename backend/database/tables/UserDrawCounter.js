const pool = require('../pool');

const createUserDrawCounterTable = async () => {
    const createTableSql = `
    CREATE TABLE IF NOT EXISTS UserDrawCounter (
        UserId INT NOT NULL,
        PrizeItemPoolId INT NOT NULL,
        DrawCount INT DEFAULT 0,
        LastDrawTime DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (UserId, PrizeItemPoolId),
        FOREIGN KEY (PrizeItemPoolId) REFERENCES PrizeItemPool(PrizeItemPoolId) ON DELETE CASCADE
      );
  `;
    await pool.execute(createTableSql);
    console.log('UserDrawCounter 資料表已確保存在');
};

module.exports = createUserDrawCounterTable;
