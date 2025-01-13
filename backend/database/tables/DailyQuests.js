const pool = require('../pool');

const createDailyQuestsTable = async () => {
    const createTableSql = `
    CREATE TABLE IF NOT EXISTS DailyQuests (
        Id INT PRIMARY KEY AUTO_INCREMENT,
        Name VARCHAR(100) NOT NULL UNIQUE,
        Target INT NOT NULL,
        Reward INT DEFAULT NULL,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
    await pool.execute(createTableSql);
    console.log('DailyQuests 資料表已確保存在');

    // 插入資料
    const insertDataSql = `
    INSERT IGNORE INTO DailyQuests 
        (Name, Target, Reward)
        VALUES 
        ('每天獲勝 5 次', 5, 50),
        ('抽任意獎池 1 次', 1, 50),
        ('排行榜下注 1 次', 1, 100);
    `;

    await pool.execute(insertDataSql);
    console.log('已插入資料到 DailyQuests');
};

module.exports = createDailyQuestsTable;
