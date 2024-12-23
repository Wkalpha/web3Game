const pool = require('../database/pool');

/**
 * 取得玩家獎池累計抽獎次數
 */
const getDrawCounter = async (userId, prizeItemPoolId) => {
    const sql = `
        SELECT DrawCount
        FROM UserDrawCounter
        WHERE UserId = ? AND PrizeItemPoolId = ?
    `;
    const [rows] = await pool.execute(sql, [userId, prizeItemPoolId]);

    // 如果沒有找到資料，返回 0
    return rows.length > 0 ? rows[0].DrawCount : 0;
};

/**
 * 增加玩家抽獎次數
 */
const incrementDrawCounter = async (userId, prizeItemPoolId) => {
    const sql = `
        INSERT INTO UserDrawCounter (UserId, PrizeItemPoolId, DrawCount, LastDrawTime)
        VALUES (?, ?, 1, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
        DrawCount = DrawCount + 1,
        LastDrawTime = CURRENT_TIMESTAMP;
    `;
    await pool.execute(sql, [userId, prizeItemPoolId]);
};

/**
 * 扣除保底次數
 */
const deductDrawCounter = async (userId, prizeItemPoolId, guaranteeDraw) => {
    const sql = `
        UPDATE UserDrawCounter
        SET DrawCount = DrawCount - ?
        WHERE UserId = ? AND PrizeItemPoolId = ? 
    `;
    await pool.execute(sql, [guaranteeDraw, userId, prizeItemPoolId]);
};


module.exports = {
    getDrawCounter,
    incrementDrawCounter,
    deductDrawCounter
};
