const pool = require('../pool');

const createUserDailyProgressTable = async () => {
    const createTableSql = `
    CREATE TABLE IF NOT EXISTS UserDailyProgress (
        WalletAddress VARCHAR(255) NOT NULL,
        DailyQuestId INT NOT NULL,
        Progress INT DEFAULT 0,
        RewardClaimed BOOLEAN DEFAULT FALSE,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (DailyQuestId) REFERENCES DailyQuests(Id),
        PRIMARY KEY (WalletAddress, DailyQuestId) -- 設定 WalletAddress 和 BadgeId 為複合主鍵
    )
  `;
    await pool.execute(createTableSql);
    console.log('UserDailyProgress 資料表已確保存在');
};

module.exports = createUserDailyProgressTable;
