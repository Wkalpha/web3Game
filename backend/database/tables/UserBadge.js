const pool = require('../pool');

const createUserBadgeTable = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS UserBadge (
        WalletAddress VARCHAR(255),
        BadgeId INT,
        Quantity INT DEFAULT 0,
        UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (WalletAddress, BadgeId) -- 設定 WalletAddress 和 BadgeId 為複合主鍵
    )
  `;
  await pool.execute(createTableSql);
  console.log('UserBadge 資料表已確保存在');
};

module.exports = createUserBadgeTable;
