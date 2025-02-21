const pool = require('../pool');

const createClickTraceLogTable = async () => {
    const createTableSql = `
    CREATE TABLE IF NOT EXISTS ClickTraceLog (
        Id INT PRIMARY KEY AUTO_INCREMENT,
        Action VARCHAR(255),
        Count INT,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_action (Action) -- 唯一索引
    )
  `;
    await pool.execute(createTableSql);
    console.log('ClickTraceLog 資料表已確保存在');
};

module.exports = createClickTraceLogTable;
