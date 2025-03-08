const pool = require('../database/pool');

/**
 * 新增PVP結果
 * @returns 
 */
const insertIntoPvPGameLog = async (result) => {
    try {
        const sql = `
            INSERT INTO PvPGameLog (Log, CreatedAt)
            VALUES (?, CURRENT_TIMESTAMP)
        `;
        await pool.execute(sql, [result]);
    } catch (error) {
        console.error("Database error:", error);
        throw error; // 可以選擇拋出錯誤給上層處理
    }
}

module.exports = {
    insertIntoPvPGameLog,
};
