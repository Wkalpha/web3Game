const pool = require('../database/pool');

/**
 * 新增點擊事件
 * @returns 
 */
const insert = async (action) => {
    try {
        const sql = `
            INSERT INTO ClickTraceLog (Action, Count, CreatedAt, UpdatedAt)
            VALUES (?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE
            Count = Count + 1,
            UpdatedAt = CURRENT_TIMESTAMP;
        `;
        const [result] = await pool.execute(sql, [action]);
        return result;
    } catch (error) {
        console.error("Database error:", error);
        throw error; // 可以選擇拋出錯誤給上層處理
    }
}

module.exports = {
    insert,
};
