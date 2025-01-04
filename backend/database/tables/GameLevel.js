const pool = require('../pool');

const createGameLevelTable = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS GameLevel (
      ID INT PRIMARY KEY AUTO_INCREMENT,
      Level NVARCHAR(50), -- 難度
      Round INT DEFAULT 10, -- 回和數
      RewardMultiplier DECIMAL(5,2), -- 獲勝後的獎勵倍率
      Threshold INT, -- 需超過的門檻值
      Score INT, -- 輸贏的分數影響
      CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.execute(createTableSql);
  console.log('GameLevel 資料表已確保存在');

  // 先檢查是否已經有資料
  const checkDataSql = `SELECT COUNT(*) AS count FROM GameLevel;`;
  const [rows] = await pool.execute(checkDataSql);

  if (rows[0].count === 0) {
    // 只有當表內沒有資料時，才插入預設資料
    const insertDataSql = `
      INSERT INTO GameLevel (Level, Round, RewardMultiplier, Threshold, Score)
      VALUES 
      ('Easy', 5, 1.01, 40, 1),
      ('Normal', 12, 1.03, 100, 3),
      ('Hard', 15, 1.07, 130, 5);
    `;

    await pool.execute(insertDataSql);
    console.log('已插入資料到 GameLevel');
  } else {
    console.log('GameLevel 表已有資料，跳過插入');
  }
};

module.exports = createGameLevelTable;
