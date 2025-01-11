const pool = require('../pool');

const createUserBadgeTable = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS UserBadge (
        WalletAddress VARCHAR(255) DEFAULT NULL,
        BadgeId INT DEFAULT NULL,
        Quantity INT DEFAULT 0,
        UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (WalletAddress, BadgeId) -- 添加複合唯一約束
    )
  `;
  await pool.execute(createTableSql);
  console.log('UserBadge 資料表已確保存在');
};

module.exports = createUserBadgeTable;
