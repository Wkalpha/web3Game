const pool = require('../database/pool');

/**
 * 取得關卡資訊
 * @param {難度} Level 
 * @returns 
 */
const queryGameLevel = async (level) => {
    const sql = `
        SELECT Threshold, Score
        FROM GameLevel
        WHERE Level = ?
    `;

    const [rows] = await pool.execute(sql, [level]);
    const { Threshold, Score } = rows[0];
    return { Threshold, Score };
}

module.exports = {
    queryGameLevel
};
