const pool = require('../pool');

const createReserveTable = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS Reserve (
        Id INT PRIMARY KEY AUTO_INCREMENT,
        UserInfo VARCHAR(255),
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_walletAddress (UserInfo)
    )
  `;
  await pool.execute(createTableSql);
  console.log('Reserve 資料表已確保存在');
};

module.exports = createReserveTable;
