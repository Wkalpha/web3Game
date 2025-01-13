const pool = require('../pool');

const createBadgeDetailTable = async () => {
    const createTableSql = `
    CREATE TABLE IF NOT EXISTS BadgeDetail (
        Id INT PRIMARY KEY AUTO_INCREMENT,
        Name VARCHAR(100) NOT NULL UNIQUE,
        DropRate DECIMAL(10, 5) NOT NULL,
        Effects JSON DEFAULT NULL,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
    await pool.execute(createTableSql);
    console.log('BadgeDetail 資料表已確保存在');

    // 插入資料
    const insertDataSql = `
    INSERT IGNORE INTO BadgeDetail 
        (Name, DropRate, Effects)
        VALUES 
        ('結算獎勵提升 1 %', 0.25, '{"value": 0.01, "type": "RewardBonus"}'),
        ('提升 2 次每日挑戰', 0.25, '{"value": 2, "type": "BaseLeftOfPlay"}'),
        ('傷害提升 5 %', 0.25, '{"value": 0.05, "type": "BaseAttackPower"}'),
        ('抽獎費用降低 1 %', 0.25, '{"value": 0.01, "type": "DecraeseDrawFee"}');
    `;

    await pool.execute(insertDataSql);
    console.log('已插入資料到 BadgeDetail');
};

module.exports = createBadgeDetailTable;
