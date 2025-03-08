const pool = require('../pool');

const createPvPGameLogTable = async () => {
    const createTableSql = `
    CREATE TABLE IF NOT EXISTS PvPGameLog (
        Id INT PRIMARY KEY AUTO_INCREMENT,
        Log JSON DEFAULT NULL,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
    await pool.execute(createTableSql);
    console.log('PvPGameLog 資料表已確保存在');
};

module.exports = createPvPGameLogTable;
