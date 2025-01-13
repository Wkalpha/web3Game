const pool = require('../pool');

const createBadgeDetailTable = async () => {
    const createTableSql = `
    CREATE TABLE IF NOT EXISTS BadgeTransferLog (
        Id INT PRIMARY KEY AUTO_INCREMENT,
        FromWalletAddress VARCHAR(255),
        ToWalletAddress VARCHAR(255),
        Quantity INT,
        BadgeId INT,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
    await pool.execute(createTableSql);
    console.log('BadgeTransferLog 資料表已確保存在');
};

module.exports = createBadgeDetailTable;
